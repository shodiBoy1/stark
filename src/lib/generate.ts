import type { Question } from "./db";
import { QUESTIONS_PER_BATCH, SIMILARITY_THRESHOLD } from "./constants";
import { normalizeText } from "./utils";
import type { SourcePages } from "./source-text";

export interface BatchGenerateConfig {
  sources: SourcePages[];
  difficulty: string;
  language: string;
  model: string;
  questionsCount: number;
  examFormat?: string;
  examContext?: string;
  instructions?: string;
  onProgress?: (completed: number, total: number) => void;
}

export async function generateInBatches(config: BatchGenerateConfig): Promise<Question[]> {
  const { questionsCount, onProgress } = config;
  const totalBatches = Math.ceil(questionsCount / QUESTIONS_PER_BATCH);
  const allQuestions: Question[] = [];

  for (let i = 0; i < totalBatches; i++) {
    const remaining = questionsCount - allQuestions.length;
    if (remaining <= 0) break;

    onProgress?.(i, totalBatches);

    const questions = await callGenerate({
      ...config,
      questionsCount: Math.min(QUESTIONS_PER_BATCH, remaining),
      totalBatches,
      batchIndex: i,
      previousQuestions: allQuestions.map((question) => question.question),
    });

    allQuestions.push(...questions);
  }

  const shortfall = questionsCount - allQuestions.length;
  if (shortfall > 0 && allQuestions.length > 0) {
    try {
      const extra = await callGenerate({
        ...config,
        questionsCount: shortfall,
        totalBatches: totalBatches + 1,
        batchIndex: totalBatches,
        previousQuestions: allQuestions.map((question) => question.question),
      });
      allQuestions.push(...extra);
    } catch (error) {
      console.warn("Shortfall retry failed:", error);
    }
  }

  onProgress?.(totalBatches, totalBatches);
  return renumberQuestions(deduplicateQuestions(allQuestions));
}

async function callGenerate(
  config: BatchGenerateConfig & {
    totalBatches: number;
    batchIndex: number;
    previousQuestions: string[];
  },
): Promise<Question[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sources: config.sources,
      difficulty: config.difficulty,
      language: config.language,
      model: config.model,
      questionsCount: config.questionsCount,
      examFormat: config.examFormat,
      examContext: config.examContext,
      instructions: config.instructions,
      batchIndex: config.batchIndex,
      totalBatches: config.totalBatches,
      previousQuestions: config.previousQuestions.slice(-30).map((question) => question.slice(0, 240)),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Generation failed");
  }

  return data.questions;
}

function renumberQuestions(questions: Question[]): Question[] {
  return questions.map((question, index) => ({
    ...question,
    id: `q${index + 1}`,
  }));
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" ").filter((word) => word.length > 2));
  const wordsB = new Set(normalizeText(b).split(" ").filter((word) => word.length > 2));
  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function deduplicateQuestions(questions: Question[]): Question[] {
  const unique: Question[] = [];
  for (const question of questions) {
    const isDuplicate = unique.some((existing) => similarity(existing.question, question.question) > SIMILARITY_THRESHOLD);
    if (!isDuplicate) unique.push(question);
  }
  return unique;
}
