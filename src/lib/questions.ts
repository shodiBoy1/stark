import type { ExamFormat } from "./constants";
import type { Question } from "./db";
import { answersEqual, choiceLetter, stripChoicePrefix } from "./grading";

const TRUE_WORDS = new Set(["true", "wahr", "richtig", "yes", "ja"]);
const FALSE_WORDS = new Set(["false", "falsch", "no", "nein"]);

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const items: string[] = [];
  for (const entry of value) {
    const text = asString(entry);
    if (!text || items.some((item) => answersEqual(item, text))) continue;
    items.push(text);
    if (items.length >= limit) break;
  }
  return items;
}

function resolveChoice(correct: string, options: string[]): string | null {
  const exact = options.find((option) => option === correct);
  if (exact) return exact;
  const byText = options.find((option) => answersEqual(option, correct));
  if (byText) return byText;
  const letter = choiceLetter(correct);
  if (!letter) return null;
  return options.find((option) => choiceLetter(option) === letter) ?? null;
}

function normalizeTrueFalse(correct: string, options: string[]): { options: string[]; correctAnswer: string } | null {
  const usable = options.length >= 2 ? options.slice(0, 2) : ["True", "False"];
  const token = stripChoicePrefix(correct).toLowerCase();
  const wantTrue = TRUE_WORDS.has(token);
  const wantFalse = FALSE_WORDS.has(token);
  if (wantTrue || wantFalse) {
    const match = usable.find((option) => {
      const optionToken = stripChoicePrefix(option).toLowerCase();
      return wantTrue ? TRUE_WORDS.has(optionToken) : FALSE_WORDS.has(optionToken);
    });
    if (match) return { options: usable, correctAnswer: match };
  }
  const resolved = resolveChoice(correct, usable);
  if (!resolved) return null;
  return { options: usable, correctAnswer: resolved };
}

function expectedOptionCount(type: Question["type"], format: ExamFormat): number {
  if (type !== "multiple_choice" && type !== "fill_in_blank") return 0;
  return format === "mc_5" ? 5 : 4;
}

function normalizeOne(raw: unknown, format: ExamFormat): Question | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const type = record.type;
  if (type !== "multiple_choice" && type !== "true_false" && type !== "short_answer" && type !== "fill_in_blank") {
    return null;
  }

  const question = asString(record.question);
  if (question.length < 8) return null;

  const explanation = asString(record.explanation);
  const source = asString(record.source) || undefined;
  const context = asString(record.context) || undefined;
  const pageNumber = typeof record.page === "number" ? record.page : Number(record.page);
  const page = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.round(pageNumber) : undefined;
  const correct = asString(record.correctAnswer);
  if (!correct) return null;

  if (type === "short_answer") {
    const acceptedAnswers = asStringList(record.acceptedAnswers, 6).filter((answer) => !answersEqual(answer, correct));
    return {
      id: "q",
      type,
      question,
      correctAnswer: correct,
      explanation,
      source,
      page,
      acceptedAnswers: acceptedAnswers.length > 0 ? acceptedAnswers : undefined,
    };
  }

  if (type === "true_false") {
    const normalized = normalizeTrueFalse(correct, asStringList(record.options, 4));
    if (!normalized) return null;
    return {
      id: "q",
      type,
      question,
      options: normalized.options,
      correctAnswer: normalized.correctAnswer,
      explanation,
      source,
      page,
    };
  }

  const wanted = expectedOptionCount(type, format);
  let options = asStringList(record.options, 8);
  const resolved = resolveChoice(correct, options);
  if (!resolved || options.length < 3) return null;
  if (options.length > wanted) {
    const kept = options.filter((option) => option === resolved).concat(options.filter((option) => option !== resolved));
    options = kept.slice(0, wanted);
    if (!options.includes(resolved)) options[options.length - 1] = resolved;
  }
  if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) return null;

  return {
    id: "q",
    type,
    question,
    options,
    correctAnswer: resolved,
    explanation,
    context: type === "fill_in_blank" ? context : undefined,
    source,
    page,
  };
}

export function normalizeQuestions(raw: unknown[], format: ExamFormat, limit: number): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const question = normalizeOne(item, format);
    if (!question) continue;
    const key = question.question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push({ ...question, id: `q${questions.length + 1}` });
    if (questions.length >= limit) break;
  }

  return questions;
}
