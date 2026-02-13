export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy", description: "Remember & Understand (Bloom's L1-2)" },
  { value: "medium", label: "Medium", description: "Apply & Analyze (Bloom's L3-4)" },
  { value: "hard", label: "Hard", description: "Evaluate & Create (Bloom's L5-6)" },
] as const;

export const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "claude", label: "Claude Sonnet", provider: "anthropic" },
] as const;

export const DEFAULT_SETTINGS = {
  language: "en" as const,
  difficulty: "medium" as const,
  model: "gpt-4o-mini" as const,
  questionsPerTest: 10,
};

export const EXAM_FORMATS = [
  { value: "mc_4", label: "Multiple Choice (4 options)" },
  { value: "mc_5", label: "Multiple Choice (5 options)" },
  { value: "mixed", label: "Mixed (MC + True/False + Short Answer)" },
  { value: "mixed_fill", label: "Mixed with Fill-in-Blank" },
] as const;

export const TEST_MODES = [
  { value: "practice", label: "Practice", description: "Elapsed timer, no auto-submit" },
  { value: "exam_simulation", label: "Exam Simulation", description: "Countdown timer, auto-submit when time runs out" },
] as const;

export const QUESTIONS_PER_BATCH = 22;
export const MAX_QUESTIONS = 80;

// Text budgets for prompt building
export const TEXT_BUDGET = 40_000;
export const EXAM_CONTEXT_BUDGET = 8_000;
export const INSTRUCTIONS_BUDGET = 4_000;
export const OLD_EXAM_TEXT_BUDGET = 10_000;

// Question deduplication
export const SIMILARITY_THRESHOLD = 0.7;

export type Language = (typeof LANGUAGES)[number]["value"];
export type Difficulty = (typeof DIFFICULTIES)[number]["value"];
export type Model = (typeof MODELS)[number]["value"];
export type ExamFormat = (typeof EXAM_FORMATS)[number]["value"];
export type TestMode = (typeof TEST_MODES)[number]["value"];
