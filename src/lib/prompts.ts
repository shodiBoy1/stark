import type { Difficulty, Language, ExamFormat } from "./constants";
import { EXAM_CONTEXT_BUDGET, INSTRUCTIONS_BUDGET, TEXT_BUDGET } from "./constants";
import { buildBatchExcerpt, type SourcePages } from "./source-text";

const difficultyInstructions: Record<Difficulty, string> = {
  easy: `Difficulty: recall and understanding.
Ask for definitions, stated facts, and direct comprehension. One idea per question.`,
  medium: `Difficulty: apply and analyze.
Ask students to use a concept in a situation from the excerpt, compare two ideas, or explain why a step follows.`,
  hard: `Difficulty: evaluate.
Ask students to judge a claim, choose between two interpretations, or spot the consequence of an idea in the excerpt. Stay inside the source. Do not require outside facts.`,
};

const languageInstructions: Record<Language, string> = {
  en: "Write every question, option, answer, and explanation in English.",
  de: "Write every question, option, answer, and explanation in German.",
};

const formatRules: Record<ExamFormat, string> = {
  mc_4: `Every question is multiple_choice with exactly 4 options, each starting with "A) ", "B) ", "C) ", or "D) ".
correctAnswer must be copied exactly from one option.`,
  mc_5: `Every question is multiple_choice with exactly 5 options, labeled "A) " through "E) ".
correctAnswer must be copied exactly from one option.`,
  mixed: `Mix types across the set: about 60% multiple_choice, 20% true_false, 20% short_answer.
multiple_choice: exactly 4 options labeled "A) " through "D) ". correctAnswer is copied from one option.
true_false: options are ["True", "False"] in English, or ["Wahr", "Falsch"] in German. correctAnswer is one of those two strings.
short_answer: omit options. correctAnswer is a short phrase from the excerpt. acceptedAnswers lists 2 to 4 other wordings that mean the same thing.`,
  mixed_fill: `Mix types: about 50% multiple_choice, 15% true_false, 15% short_answer, 20% fill_in_blank.
multiple_choice and fill_in_blank: exactly 4 options labeled "A) " through "D) ". correctAnswer is copied from one option.
fill_in_blank also has context: one or two sentences taken from the excerpt, with the tested term missing from the question.
true_false: options are ["True", "False"] or ["Wahr", "Falsch"].
short_answer: omit options. Include acceptedAnswers with 2 to 4 equivalent wordings.`,
};

export interface PromptConfig {
  sources: SourcePages[];
  difficulty: Difficulty;
  language: Language;
  questionsCount: number;
  examFormat?: ExamFormat;
  examContext?: string;
  instructions?: string;
  batchIndex?: number;
  totalBatches?: number;
  previousQuestions?: string[];
}

export function buildTestPrompt(config: PromptConfig): { system: string; user: string } {
  const batchIndex = config.batchIndex ?? 0;
  const totalBatches = config.totalBatches ?? 1;
  const excerpt = buildBatchExcerpt(config.sources, batchIndex, totalBatches, TEXT_BUDGET);
  const sourceNames = config.sources.map((source) => source.name);
  const format = config.examFormat || "mixed_fill";

  const previous =
    config.previousQuestions && config.previousQuestions.length > 0
      ? config.previousQuestions
          .slice(-30)
          .map((question, index) => `${index + 1}. ${question.slice(0, 220)}`)
          .join("\n")
      : "";

  const examContext = config.examContext?.trim()
    ? config.examContext.trim().slice(0, EXAM_CONTEXT_BUDGET)
    : "";

  const instructions = config.instructions?.trim()
    ? config.instructions.trim().slice(0, INSTRUCTIONS_BUDGET)
    : "";

  const system = `You write closed-book exam questions from lecture excerpts a student uploaded.
Return only a JSON object with a "questions" array. No markdown.
Rules:
- Every question is answerable from the excerpt alone.
- Test a different fact or idea each time.
- Exactly one option is correct. Wrong options are plausible ideas from the same pages, not jokes.
- Never use "all of the above" or "none of the above".
- correctAnswer for a choice question is copied character for character from options.
- explanation says why the answer is right in one or two sentences, using the excerpt.
- source is one of the source names given below.
- page is the page number printed in the excerpt header for the page you used.
- Do not repeat a question listed under ALREADY USED.`;

  const user = `${difficultyInstructions[config.difficulty]}
${languageInstructions[config.language]}
${totalBatches > 1 ? `This is batch ${batchIndex + 1} of ${totalBatches}. Use this batch's pages, not material you cannot see.` : ""}

Write exactly ${config.questionsCount} questions.

Source names: ${JSON.stringify(sourceNames)}

EXCERPT:
${excerpt}
${examContext ? `\nEXAM STYLE (copy the style of these past papers, not their facts, unless the same fact is also in the excerpt):\n${examContext}\n` : ""}${previous ? `\nALREADY USED (do not repeat these topics):\n${previous}\n` : ""}${instructions ? `\nSTUDENT PREFERENCES (follow these unless they conflict with the rules above):\n${instructions}\n` : ""}
QUESTION FORMAT:
${formatRules[format]}

JSON shape:
{"questions":[{"id":"q1","type":"multiple_choice","question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctAnswer":"A) ...","explanation":"...","source":${JSON.stringify(sourceNames[0] || "Source")}, "page":1}]}
Short-answer objects add "acceptedAnswers":["...","..."] and omit options.
Fill-in-blank objects add "context".`;

  return { system, user };
}
