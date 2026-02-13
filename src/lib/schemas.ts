import { z } from "zod";

export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "fill_in_blank"]),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().default(""),
  context: z.string().optional(),
  source: z.string().optional(),
});

export const questionsArraySchema = z.array(questionSchema).min(1);

export const generateRequestSchema = z.object({
  texts: z.array(z.string().min(10)).min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum(["en", "de"]),
  model: z.enum(["gpt-4o-mini", "claude"]),
  questionsCount: z.number().int().min(1).max(80),
  pdfName: z.string(),
  examFormat: z.enum(["mc_4", "mc_5", "mixed", "mixed_fill"]).optional(),
  examContext: z.string().optional(),
  instructions: z.string().optional(),
  batchIndex: z.number().int().min(0).optional(),
  totalBatches: z.number().int().min(1).optional(),
  previousQuestions: z.array(z.string()).optional(),
});

export const settingsSchema = z.object({
  language: z.enum(["en", "de"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  model: z.enum(["gpt-4o-mini", "claude"]),
  questionsPerTest: z.number().int().min(1).max(80),
});

export type QuestionSchema = z.infer<typeof questionSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type SettingsSchema = z.infer<typeof settingsSchema>;
