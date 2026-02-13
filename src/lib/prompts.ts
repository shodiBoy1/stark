import type { Difficulty, Language, ExamFormat } from "./constants";
import { TEXT_BUDGET, EXAM_CONTEXT_BUDGET, INSTRUCTIONS_BUDGET } from "./constants";

const difficultyInstructions: Record<Difficulty, string> = {
  easy: `Generate questions at Bloom's Taxonomy Level 1-2 (Remember & Understand).
Focus on: definitions, key facts, recall of concepts, basic comprehension.
Questions should test recognition and understanding of material.`,
  medium: `Generate questions at Bloom's Taxonomy Level 3-4 (Apply & Analyze).
Focus on: applying concepts to scenarios, analyzing relationships, comparing ideas.
Questions should require deeper thinking beyond simple recall.`,
  hard: `Generate questions at Bloom's Taxonomy Level 5-6 (Evaluate & Create).
Focus on: evaluating arguments, synthesizing information, making judgments.
Questions should require critical thinking and creative problem-solving.`,
};

const languageInstructions: Record<Language, string> = {
  en: "Generate all questions and answers in English.",
  de: "Generate all questions and answers in German (Deutsch).",
};

const formatRules: Record<ExamFormat, string> = {
  mc_4: `1. ALL questions must be multiple_choice with exactly 4 options (A, B, C, D).
2. Set correctAnswer to the correct option letter followed by the answer text, e.g. "A) The correct answer"`,
  mc_5: `1. ALL questions must be multiple_choice with exactly 5 options (A, B, C, D, E).
2. Set correctAnswer to the correct option letter followed by the answer text, e.g. "A) The correct answer"`,
  mixed: `1. Mix question types: multiple_choice (60%), true_false (20%), short_answer (20%)
2. For multiple_choice: provide exactly 4 options (A, B, C, D). Set correctAnswer to the correct option letter followed by the answer text, e.g. "A) The correct answer"
3. For true_false: set options to ["True", "False"]. Set correctAnswer to "True" or "False"
4. For short_answer: no options needed. Set correctAnswer to a concise expected answer`,
  mixed_fill: `1. Mix question types: multiple_choice (50%), true_false (15%), short_answer (15%), fill_in_blank (20%)
2. For multiple_choice: provide exactly 4 options (A, B, C, D). Set correctAnswer to the correct option letter followed by the answer text, e.g. "A) The correct answer"
3. For true_false: set options to ["True", "False"]. Set correctAnswer to "True" or "False"
4. For short_answer: no options needed. Set correctAnswer to a concise expected answer
5. For fill_in_blank: provide a "context" field with a paragraph or scenario that gives context, then ask the question. Provide 4 options like multiple_choice. The question should reference the context.`,
};

export interface PromptConfig {
  texts: string[];
  difficulty: Difficulty;
  language: Language;
  questionsCount: number;
  pdfName: string;
  examFormat?: ExamFormat;
  examContext?: string;
  instructions?: string;
  batchIndex?: number;
  totalBatches?: number;
  previousQuestions?: string[];
}

function combineTexts(texts: string[], pdfName: string): { combined: string; sourceNames: string[] } {
  if (texts.length === 0) return { combined: "", sourceNames: [] };
  const perPdf = Math.floor(TEXT_BUDGET / texts.length);
  const names = pdfName.split(", ").map((n) => n.trim());
  const combined = texts
    .map((t, i) => `--- Source: "${names[i] || `Source ${i + 1}`}" ---\n${t.slice(0, perPdf)}`)
    .join("\n\n");
  return { combined, sourceNames: names };
}

function buildExamContextSection(examContext: string): string {
  return `
EXAM STYLE GUIDANCE (use this to match the style and format of real exams, NOT as source material for questions):
${examContext.slice(0, EXAM_CONTEXT_BUDGET)}
`;
}

export function buildTestPrompt(config: PromptConfig): string;
export function buildTestPrompt(
  text: string,
  difficulty: Difficulty,
  language: Language,
  questionsCount: number,
  pdfName: string
): string;
export function buildTestPrompt(
  configOrText: PromptConfig | string,
  difficulty?: Difficulty,
  language?: Language,
  questionsCount?: number,
  pdfName?: string
): string {
  let config: PromptConfig;

  if (typeof configOrText === "string") {
    config = {
      texts: [configOrText],
      difficulty: difficulty!,
      language: language!,
      questionsCount: questionsCount!,
      pdfName: pdfName!,
    };
  } else {
    config = configOrText;
  }

  const { combined: combinedText, sourceNames } = combineTexts(config.texts, config.pdfName);
  const batchInfo =
    config.totalBatches && config.totalBatches > 1
      ? `\nThis is batch ${(config.batchIndex ?? 0) + 1} of ${config.totalBatches}. Generate unique questions that don't overlap with previous batches. Focus on different sections of the material.`
      : "";

  const previousQuestionsSection =
    config.previousQuestions && config.previousQuestions.length > 0
      ? `\nALREADY GENERATED QUESTIONS (do NOT repeat or rephrase these — generate completely different questions covering different topics):\n${config.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

  const examContextSection = config.examContext
    ? buildExamContextSection(config.examContext)
    : "";

  const instructionsSection = config.instructions
    ? `\nCUSTOM INSTRUCTIONS (follow these carefully, they override default rules where applicable):\n${config.instructions.slice(0, INSTRUCTIONS_BUDGET)}\n`
    : "";

  const format = config.examFormat || "mixed_fill";
  const formatSection = formatRules[format];

  return `You are an expert exam question generator. Based on the following lecture content, generate exactly ${config.questionsCount} exam questions.

${difficultyInstructions[config.difficulty]}
${languageInstructions[config.language]}
${batchInfo}

Source material: "${config.pdfName}"

CONTENT:
${combinedText}
${examContextSection}
${previousQuestionsSection}
${instructionsSection}
QUESTION FORMAT RULES:
${formatSection}

GENERAL RULES:
1. Every question must have a clear explanation of why the answer is correct
2. Questions must be directly based on the provided content
3. Each question must have a unique id like "q1", "q2", etc.
4. Each question MUST have a "source" field set to the name of the source PDF it was derived from. Use one of these exact names: ${JSON.stringify(sourceNames)}
5. CRITICAL: Each question must test a DIFFERENT specific fact, concept, or idea. Never ask two questions about the same topic, even rephrased. If you listed a question above in ALREADY GENERATED QUESTIONS, do NOT create any question on the same topic.

Respond with ONLY a valid JSON array of question objects. No markdown, no code blocks, just the JSON array.
Each object must have: id, type, question, options (array or omit for short_answer), correctAnswer, explanation, source, context (only for fill_in_blank)

Example format:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "What is...?",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "correctAnswer": "A) First option",
    "explanation": "This is correct because...",
    "source": "${sourceNames[0] || "Source 1"}"
  }
]`;
}
