import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateRequestSchema, questionsArraySchema } from "@/lib/schemas";
import { buildTestPrompt } from "@/lib/prompts";
import { buildBatchExcerpt } from "@/lib/source-text";
import { extractJsonValue, questionsFromPayload } from "@/lib/parse-model-json";
import { normalizeQuestions } from "@/lib/questions";
import { TEXT_BUDGET, type Difficulty, type ExamFormat, type Language } from "@/lib/constants";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

async function complete(model: "gpt-4o-mini" | "claude", system: string, user: string): Promise<string> {
  if (model === "gpt-4o-mini") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key not configured");

    const openai = new OpenAI({ apiKey, maxRetries: 1 });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 5000,
      response_format: { type: "json_object" },
    });
    return completion.choices[0]?.message?.content || "";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  const anthropic = new Anthropic({ apiKey, maxRetries: 1 });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 5000,
    temperature: 0.4,
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateRequestSchema.parse(body);
    const format = (parsed.examFormat || "mixed_fill") as ExamFormat;
    const batchIndex = parsed.batchIndex ?? 0;
    const totalBatches = parsed.totalBatches ?? 1;

    const excerpt = buildBatchExcerpt(parsed.sources, batchIndex, totalBatches, TEXT_BUDGET);
    if (excerpt.trim().length < 40) {
      return NextResponse.json(
        { error: "Not enough readable text in the selected PDFs. Re-scan the file or upload a PDF with selectable text." },
        { status: 400 },
      );
    }

    let prompt = buildTestPrompt({
      sources: parsed.sources,
      difficulty: parsed.difficulty as Difficulty,
      language: parsed.language as Language,
      questionsCount: parsed.questionsCount,
      examFormat: format,
      examContext: parsed.examContext,
      instructions: parsed.instructions,
      batchIndex,
      totalBatches,
      previousQuestions: parsed.previousQuestions,
    });

    let lastError = "Failed to generate test";

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 1) {
        prompt = {
          ...prompt,
          user: `${prompt.user}\n\nThe previous reply was not usable. Return only the JSON object {"questions":[...]} and follow the format rules exactly.`,
        };
      }

      try {
        const raw = await complete(parsed.model, prompt.system, prompt.user);
        if (!raw.trim()) {
          lastError = "Empty response from the model";
          continue;
        }

        const questions = normalizeQuestions(
          questionsFromPayload(extractJsonValue(raw)),
          format,
          parsed.questionsCount,
        );
        if (questions.length === 0) {
          lastError = "The model returned questions that could not be used. Try again.";
          continue;
        }

        const validated = questionsArraySchema.parse(questions);
        return NextResponse.json({ questions: validated });
      } catch (error) {
        console.error("Generate attempt failed:", error);
        const message = error instanceof Error ? error.message : "";
        if (message.includes("API key") || message.includes("not configured")) {
          return NextResponse.json({ error: message }, { status: 500 });
        }
        lastError = "Failed to generate test";
      }
    }

    return NextResponse.json({ error: lastError }, { status: 500 });
  } catch (error: unknown) {
    console.error("Generate error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid generation request" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "";
    const safeMessage =
      message.includes("API key") || message.includes("not configured") ? message : "Failed to generate test";
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
