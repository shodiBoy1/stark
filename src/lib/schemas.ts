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
  page: z.number().int().positive().optional(),
  acceptedAnswers: z.array(z.string().min(1).max(300)).max(6).optional(),
});

export const questionsArraySchema = z.array(questionSchema).min(1);

export const generateRequestSchema = z.object({
  sources: z
    .array(
      z.object({
        name: z.string().min(1).max(180),
        pages: z.array(z.string().max(12_000)).min(1).max(120),
      }),
    )
    .min(1)
    .max(8),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.enum(["en", "de"]),
  model: z.enum(["gpt-4o-mini", "claude"]),
  questionsCount: z.number().int().min(1).max(60),
  examFormat: z.enum(["mc_4", "mc_5", "mixed", "mixed_fill"]).optional(),
  examContext: z.string().max(20_000).optional(),
  instructions: z.string().max(8_000).optional(),
  batchIndex: z.number().int().min(0).optional(),
  totalBatches: z.number().int().min(1).optional(),
  previousQuestions: z.array(z.string().max(300)).max(40).optional(),
});

export const settingsSchema = z.object({
  language: z.enum(["en", "de"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  model: z.enum(["gpt-4o-mini", "claude"]),
  questionsPerTest: z.number().int().min(1).max(60),
});

export type QuestionSchema = z.infer<typeof questionSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type SettingsSchema = z.infer<typeof settingsSchema>;
