import type { Question } from "./db";
import { QUESTIONS_PER_BATCH, SIMILARITY_THRESHOLD } from "./constants";
import { normalizeText } from "./utils";

export interface BatchGenerateConfig {
  texts: string[];
  difficulty: string;
  language: string;
  model: string;
  questionsCount: number;
  pdfName: string;
  examFormat?: string;
  examContext?: string;
  instructions?: string;
  onProgress?: (completed: number, total: number) => void;
}

export async function generateInBatches(config: BatchGenerateConfig): Promise<Question[]> {
  const { questionsCount, onProgress } = config;
  const totalBatches = Math.ceil(questionsCount / QUESTIONS_PER_BATCH);

  if (totalBatches <= 1) {
    onProgress?.(0, 1);
    const questions = await callGenerate({
      ...config,
      totalBatches: 1,
      batchIndex: 0,
      previousQuestions: [],
    });
    onProgress?.(1, 1);
    return renumberQuestions(questions);
  }

  const allQuestions: Question[] = [];

  for (let i = 0; i < totalBatches; i++) {
    const remaining = questionsCount - allQuestions.length;
    if (remaining <= 0) break;
    const batchCount = Math.min(QUESTIONS_PER_BATCH, remaining);

    onProgress?.(i, totalBatches);

    // Pass previously generated question texts to avoid duplicates
    const previousQuestions = allQuestions.map((q) => q.question);

    const questions = await callGenerate({
      ...config,
      questionsCount: batchCount,
      totalBatches,
      batchIndex: i,
      previousQuestions,
    });

    allQuestions.push(...questions);
  }

  // If we still have fewer than requested, do one retry for the shortfall
  const shortfall = questionsCount - allQuestions.length;
  if (shortfall > 0) {
    try {
      const previousQuestions = allQuestions.map((q) => q.question);
      const extra = await callGenerate({
        ...config,
        questionsCount: shortfall,
        totalBatches: 1,
        batchIndex: 0,
        previousQuestions,
      });
      allQuestions.push(...extra);
    } catch (err) {
      console.warn("Shortfall retry failed:", err);
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
  }
): Promise<Question[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: config.texts,
      difficulty: config.difficulty,
      language: config.language,
      model: config.model,
      questionsCount: config.questionsCount,
      pdfName: config.pdfName,
      examFormat: config.examFormat,
      examContext: config.examContext,
      instructions: config.instructions,
      batchIndex: config.batchIndex,
      totalBatches: config.totalBatches,
      previousQuestions: config.previousQuestions,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Generation failed");
  }

  const data = await response.json();
  return data.questions;
}

function renumberQuestions(questions: Question[]): Question[] {
  return questions.map((q, i) => ({
    ...q,
    id: `q${i + 1}`,
  }));
}

function similarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function deduplicateQuestions(questions: Question[]): Question[] {
  const unique: Question[] = [];
  for (const q of questions) {
    const isDuplicate = unique.some((u) => similarity(u.question, q.question) > SIMILARITY_THRESHOLD);
    if (!isDuplicate) unique.push(q);
  }
  return unique;
}
