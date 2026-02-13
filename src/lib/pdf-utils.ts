import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import OpenAI from "openai";

const execFileAsync = promisify(execFile);

const PAGES_PER_BATCH = 3;
const MAX_RETRIES = 4;
const OCR_CONCURRENCY = 3;
const MIN_CHARS_PER_PAGE = 100;

export interface OcrPage {
  index: number;
  image: string;
}

export function getPythonPaths() {
  return {
    python: join(
      process.env.STARK_VENV_PATH ||
        join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".stark-venv"),
      "bin",
      "python3",
    ),
    renderScript: join(process.cwd(), "scripts", "render_pages.py"),
  };
}

export async function renderPages(
  buffer: Buffer,
  fileName: string,
): Promise<{ pageTexts: string[]; ocrPages: OcrPage[]; pageCount: number }> {
  const { python, renderScript } = getPythonPaths();
  const tmpPath = join(tmpdir(), `stark-${randomUUID()}-${fileName}`);
  await writeFile(tmpPath, buffer);

  try {
    const { stdout } = await execFileAsync(python, [renderScript, tmpPath], {
      timeout: 120_000,
      maxBuffer: 200 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);
    if (result.error) throw new Error(result.error);
    return result;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getRetryDelay(err: unknown): number {
  if (err && typeof err === "object" && "headers" in err) {
    const headers = (err as { headers: Headers }).headers;

    // If tokens are exhausted, wait for the token bucket to refill
    const remainingTokens = headers?.get?.("x-ratelimit-remaining-tokens");
    if (remainingTokens === "0") {
      const resetTokens = headers?.get?.("x-ratelimit-reset-tokens");
      if (resetTokens) {
        // Parse "1m19.648s" or "59.848s" format
        const match = resetTokens.match(/(?:(\d+)m)?(\d+(?:\.\d+)?)s/);
        if (match) {
          const minutes = parseInt(match[1] || "0", 10);
          const seconds = parseFloat(match[2]);
          return (minutes * 60 + seconds) * 1000 + 1000;
        }
      }
      return 60_000;
    }

    const retryAfterMs = headers?.get?.("retry-after-ms");
    if (retryAfterMs) {
      return parseInt(retryAfterMs, 10) + 500;
    }
  }
  return 60_000;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(workerIndex: number) {
    // Stagger worker starts by 1s each to avoid bursting the rate limit
    if (workerIndex > 0) await sleep(workerIndex * 1000);
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx]);
    }
  }

  const numWorkers = Math.min(concurrency, items.length);
  const workers = Array.from({ length: numWorkers }, (_, i) => worker(i));
  await Promise.all(workers);
  return results;
}

/**
 * OCR only the pages that need it, running batches in parallel.
 * Returns a full-length string[] where pages with good native text keep their
 * basicTexts value and OCR'd pages get the Vision API result.
 */
export async function ocrWithVision(
  ocrPages: OcrPage[],
  basicTexts: string[],
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const openai = new OpenAI({ apiKey, maxRetries: 0 });

  // Start with basicTexts as the base — OCR results will overwrite sparse pages
  const mergedTexts = [...basicTexts];

  // Group ocrPages into batches of PAGES_PER_BATCH
  const batches: OcrPage[][] = [];
  for (let i = 0; i < ocrPages.length; i += PAGES_PER_BATCH) {
    batches.push(ocrPages.slice(i, i + PAGES_PER_BATCH));
  }

  const totalBatches = batches.length;

  // Run batches in parallel with concurrency limit
  await mapWithConcurrency(batches, OCR_CONCURRENCY, async (batch) => {
    const batchImages = batch.map((p) => p.image);
    const batchBasicTexts = batch.map((p) => basicTexts[p.index] || "");

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: `Extract ALL text from these ${batchImages.length} PDF page(s). Include text from diagrams, charts, tables, images, formulas, and annotations. Return ONLY a JSON array with one string per page, in order. Each string should contain the complete text content of that page. Basic OCR found this text already — make sure you capture everything it missed, especially from images and diagrams:\n\n${batchBasicTexts.map((t, i) => `Page ${batch[i].index + 1} basic text: ${t.slice(0, 200)}...`).join("\n")}`,
      },
      ...batchImages.map(
        (img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
          type: "image_url",
          image_url: { url: img, detail: "high" },
        }),
      ),
    ];

    let success = false;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content }],
          temperature: 0,
          max_tokens: 16384,
        });

        const raw = completion.choices[0]?.message?.content || "[]";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        let parsed: string[] | null = null;
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]) as string[];
          } catch {
            const cleaned = jsonMatch[0].replace(/,\s*]/g, "]");
            try {
              parsed = JSON.parse(cleaned) as string[];
            } catch {
              // fall through — parsed stays null
            }
          }
        }

        if (parsed) {
          for (let i = 0; i < batch.length && i < parsed.length; i++) {
            mergedTexts[batch[i].index] = parsed[i];
          }
        }
        // If parsing failed, basicTexts values remain (already in mergedTexts)
        success = true;
        break;
      } catch (err) {
        const is429 =
          err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429;
        if (is429 && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(err);
          console.warn(
            `Vision OCR batch rate limited, waiting ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );
          await sleep(delay);
        } else {
          console.warn(`Vision OCR batch failed after ${attempt + 1} attempts:`, err);
          break;
        }
      }
    }

    if (!success) {
      // basicTexts values already in mergedTexts — nothing to do
    }
  });

  return mergedTexts;
}

/** Validate that a buffer starts with the PDF magic bytes (%PDF). */
export function isValidPDF(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}
