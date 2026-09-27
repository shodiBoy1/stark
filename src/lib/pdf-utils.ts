import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { MAX_OCR_PAGES, MAX_PDF_BYTES, MAX_PDF_PAGES } from "./constants";
import { extractJsonValue, questionsFromPayload } from "./parse-model-json";

const execFileAsync = promisify(execFile);

const PAGES_PER_BATCH = 2;
const MAX_RETRIES = 3;
const OCR_CONCURRENCY = 3;

export interface OcrPage {
  index: number;
  image: string;
}

export interface PdfExtraction {
  text: string;
  pageTexts: string[];
  pageCount: number;
  warnings: string[];
}

export function getPythonPaths() {
  const venv =
    process.env.STARK_VENV_PATH ||
    join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".stark-venv");
  const python =
    process.platform === "win32"
      ? join(venv, "Scripts", "python.exe")
      : join(venv, "bin", "python3");
  return {
    python,
    renderScript: join(process.cwd(), "scripts", "render_pages.py"),
  };
}

export function isValidPDF(buffer: Buffer): boolean {
  return buffer.subarray(0, 1024).toString("latin1").includes("%PDF-");
}

async function renderPages(buffer: Buffer): Promise<{
  pageTexts: string[];
  ocrPages: OcrPage[];
  pageCount: number;
  warnings: string[];
}> {
  const { python, renderScript } = getPythonPaths();
  const tmpPath = join(tmpdir(), `stark-${randomUUID()}.pdf`);
  await writeFile(tmpPath, buffer);

  try {
    const { stdout } = await execFileAsync(
      python,
      [renderScript, tmpPath, String(MAX_PDF_PAGES), String(MAX_OCR_PAGES)],
      { timeout: 90_000, maxBuffer: 80 * 1024 * 1024 },
    );
    const result = JSON.parse(stdout);
    if (result.error) throw new Error(result.error);
    return {
      pageTexts: Array.isArray(result.pageTexts) ? result.pageTexts : [],
      ocrPages: Array.isArray(result.ocrPages) ? result.ocrPages : [],
      pageCount: Number(result.pageCount) || 0,
      warnings: Array.isArray(result.warnings) ? result.warnings.filter((item: unknown) => typeof item === "string") : [],
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") {
      throw new Error("Python environment not found. Run pnpm setup, then restart the server.");
    }
    const stdout =
      error && typeof error === "object" && "stdout" in error
        ? String((error as { stdout?: Buffer | string }).stdout ?? "")
        : "";
    if (stdout.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(stdout) as { error?: unknown };
        if (typeof parsed.error === "string" && parsed.error) throw new Error(parsed.error);
      } catch (inner) {
        if (inner instanceof SyntaxError) {
          // stdout was not usable JSON; fall through to the original error
        } else {
          throw inner;
        }
      }
    }
    throw error;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(err: unknown): number {
  if (err && typeof err === "object" && "headers" in err) {
    const headers = (err as { headers: Headers }).headers;
    const remainingTokens = headers?.get?.("x-ratelimit-remaining-tokens");
    if (remainingTokens === "0") {
      const resetTokens = headers?.get?.("x-ratelimit-reset-tokens");
      const match = resetTokens?.match(/(?:(\d+)m)?(\d+(?:\.\d+)?)s/);
      if (match) {
        const minutes = parseInt(match[1] || "0", 10);
        const seconds = parseFloat(match[2]);
        return (minutes * 60 + seconds) * 1000 + 500;
      }
      return 20_000;
    }
    const retryAfterMs = headers?.get?.("retry-after-ms");
    if (retryAfterMs) return parseInt(retryAfterMs, 10) + 500;
  }
  return 8_000;
}

async function mapWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      await fn(items[index]);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
}

function parseOcrPages(raw: string): string[] | null {
  try {
    const list = questionsFromPayload(extractJsonValue(raw));
    if (!list.every((item) => typeof item === "string")) return null;
    return list as string[];
  } catch {
    return null;
  }
}

async function ocrWithVision(ocrPages: OcrPage[], basicTexts: string[]): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const openai = new OpenAI({ apiKey, maxRetries: 0 });
  const mergedTexts = [...basicTexts];
  const batches: OcrPage[][] = [];
  for (let i = 0; i < ocrPages.length; i += PAGES_PER_BATCH) {
    batches.push(ocrPages.slice(i, i + PAGES_PER_BATCH));
  }

  await mapWithConcurrency(batches, OCR_CONCURRENCY, async (batch) => {
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: `Extract the readable text from these ${batch.length} PDF page image(s), in order. Include headings, body text, tables, and labels. Skip decorative page numbers if they repeat. Return only JSON: {"pages":["text of page 1","text of page 2"]}`,
      },
      ...batch.map(
        (page): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
          type: "image_url",
          image_url: { url: page.image, detail: "high" },
        }),
      ),
    ];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content }],
          temperature: 0,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        });
        const parsed = parseOcrPages(completion.choices[0]?.message?.content || "");
        if (parsed) {
          for (let i = 0; i < batch.length && i < parsed.length; i++) {
            const next = parsed[i].trim();
            const index = batch[i].index;
            if (next.length > (mergedTexts[index] || "").trim().length) {
              mergedTexts[index] = next;
            }
          }
        }
        return;
      } catch (err) {
        const is429 = err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429;
        if (is429 && attempt < MAX_RETRIES) {
          await sleep(getRetryDelay(err));
          continue;
        }
        console.warn("Vision OCR batch failed:", err);
        return;
      }
    }
  });

  return mergedTexts;
}

export async function extractPdf(buffer: Buffer): Promise<PdfExtraction> {
  if (buffer.length === 0) throw new Error("The PDF is empty.");
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF is larger than 20 MB. Split it into smaller files.");
  }
  if (!isValidPDF(buffer)) throw new Error("This file is not a PDF.");

  const rendered = await renderPages(buffer);
  const warnings = [...rendered.warnings];
  let pageTexts = rendered.pageTexts;

  if (rendered.ocrPages.length > 0) {
    if (!process.env.OPENAI_API_KEY) {
      warnings.push("Some pages have little selectable text. Add OPENAI_API_KEY to read those pages, or upload a text-based PDF.");
    } else {
      pageTexts = await ocrWithVision(rendered.ocrPages, rendered.pageTexts);
    }
  }

  const readable = pageTexts.filter((page) => page.trim().length >= 40).length;
  if (readable === 0) {
    warnings.push("Almost no text was found. The PDF may be a scan, or the pages are mostly images.");
  }

  return {
    text: pageTexts.map((page) => page.trim()).filter(Boolean).join("\n\n"),
    pageTexts,
    pageCount: rendered.pageCount,
    warnings,
  };
}
