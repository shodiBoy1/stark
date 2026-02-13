import { NextRequest, NextResponse } from "next/server";
import { generateRequestSchema, questionsArraySchema } from "@/lib/schemas";
import { buildTestPrompt } from "@/lib/prompts";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Difficulty, Language } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateRequestSchema.parse(body);

    const prompt = buildTestPrompt({
      texts: parsed.texts,
      difficulty: parsed.difficulty as Difficulty,
      language: parsed.language as Language,
      questionsCount: parsed.questionsCount,
      pdfName: parsed.pdfName,
      examFormat: parsed.examFormat,
      examContext: parsed.examContext,
      instructions: parsed.instructions,
      batchIndex: parsed.batchIndex,
      totalBatches: parsed.totalBatches,
      previousQuestions: parsed.previousQuestions,
    });

    let rawResponse: string;

    if (parsed.model === "gpt-4o-mini") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }

      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 8192,
      });

      rawResponse = completion.choices[0]?.message?.content || "";
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Anthropic API key not configured" },
          { status: 500 }
        );
      }

      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      rawResponse = textBlock ? textBlock.text : "";
    }

    if (!rawResponse) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON from the response
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON in AI response" },
        { status: 500 }
      );
    }

    const validated = questionsArraySchema.parse(questions);

    return NextResponse.json({ questions: validated });
  } catch (error: unknown) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "";
    const safeMessage =
      message.includes("API key") || message.includes("not configured")
        ? message
        : "Failed to generate test";
    return NextResponse.json(
      { error: safeMessage },
      { status: 500 }
    );
  }
}
