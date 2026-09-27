import type { Question } from "./db";
import { normalizeText } from "./utils";

const CHOICE_PREFIX = /^([A-E])\s*[).:\-]\s+/i;

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "to", "and", "or", "in", "on", "for", "is", "are", "was", "were",
  "be", "with", "that", "this", "from", "as", "by", "at", "it", "its",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "einem", "einen",
  "und", "oder", "ist", "sind", "war", "waren", "im", "in", "zu", "von", "mit", "auf",
  "fur", "für", "ein", "nicht",
]);

export function stripChoicePrefix(value: string): string {
  return value.trim().replace(CHOICE_PREFIX, "").trim();
}

export function choiceLetter(value: string): string | null {
  const labeled = value.trim().match(/^([A-E])\s*[).:\-]\s+/i);
  if (labeled) return labeled[1].toUpperCase();
  const bare = value.trim().match(/^([A-E])$/i);
  return bare ? bare[1].toUpperCase() : null;
}

function contentTokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function answersEqual(left: string, right: string): boolean {
  const a = normalizeText(stripChoicePrefix(left));
  const b = normalizeText(stripChoicePrefix(right));
  return a.length > 0 && a === b;
}

function shortAnswerMatches(userAnswer: string, expected: string): boolean {
  if (answersEqual(userAnswer, expected)) return true;

  const userNorm = normalizeText(stripChoicePrefix(userAnswer));
  const expectedNorm = normalizeText(stripChoicePrefix(expected));
  if (!userNorm || !expectedNorm) return false;

  if (expectedNorm.length >= 8 && userNorm.includes(expectedNorm)) return true;

  const userTokens = contentTokens(userNorm);
  const expectedTokens = contentTokens(expectedNorm);
  if (userTokens.length === 0 || expectedTokens.length === 0) return false;

  if (
    expectedTokens.length === 1 &&
    expectedTokens[0].length >= 5 &&
    userTokens.includes(expectedTokens[0])
  ) {
    return true;
  }

  const smaller = userTokens.length <= expectedTokens.length ? userTokens : expectedTokens;
  const larger = new Set(userTokens.length <= expectedTokens.length ? expectedTokens : userTokens);
  const hits = smaller.filter((token) => larger.has(token)).length;
  return smaller.length >= 2 && hits >= 2 && hits / smaller.length >= 0.75;
}

export function isAnswerCorrect(question: Question, userAnswer: string | undefined): boolean {
  if (!userAnswer || !userAnswer.trim()) return false;

  const candidates = [question.correctAnswer, ...(question.acceptedAnswers ?? [])];
  if (question.type === "short_answer") {
    return candidates.some((candidate) => shortAnswerMatches(userAnswer, candidate));
  }

  if (candidates.some((candidate) => answersEqual(userAnswer, candidate))) return true;

  if (/^[A-E]$/i.test(userAnswer.trim())) {
    const letter = userAnswer.trim().toUpperCase();
    return candidates.some((candidate) => choiceLetter(candidate) === letter);
  }
  return false;
}

export function gradeTest(questions: Question[], answers: Record<string, string>) {
  let totalCorrect = 0;
  for (const question of questions) {
    if (isAnswerCorrect(question, answers[question.id])) totalCorrect++;
  }
  const score = questions.length === 0 ? 0 : Math.round((totalCorrect / questions.length) * 100);
  return { score, totalCorrect };
}

export function optionIsSelectedCorrect(option: string, question: Question): boolean {
  return option === question.correctAnswer || answersEqual(option, question.correctAnswer);
}
