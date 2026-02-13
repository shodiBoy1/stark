"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/lib/db";

interface QuestionCardProps {
  question: Question;
  index: number;
  answer: string | undefined;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
}

export function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
  showResult,
}: QuestionCardProps) {
  const typeLabels: Record<string, string> = {
    multiple_choice: "Multiple Choice",
    true_false: "True / False",
    short_answer: "Short Answer",
    fill_in_blank: "Fill in Blank",
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Question {index + 1}</span>
        <Badge>{typeLabels[question.type] || question.type}</Badge>
      </div>

      {question.type === "fill_in_blank" && question.context && (
        <div className="p-4 bg-black/[0.03] rounded-[12px] border border-card-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-2 font-medium">Context</p>
          <p className="text-sm text-muted-strong leading-relaxed">{question.context}</p>
        </div>
      )}

      <p className="text-base font-medium leading-relaxed text-text">{question.question}</p>

      {question.type === "short_answer" ? (
        <input
          type="text"
          value={answer || ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={showResult}
          className="w-full bg-white border border-card-border rounded-[12px] px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors disabled:opacity-50"
        />
      ) : (
        <div className="space-y-2">
          {question.options?.map((option) => {
            const isSelected = answer === option;
            const isCorrect = showResult && option === question.correctAnswer;
            const isWrong = showResult && isSelected && option !== question.correctAnswer;

            return (
              <button
                key={option}
                onClick={() => !showResult && onAnswer(option)}
                disabled={showResult}
                className={`w-full text-left px-4 py-3 rounded-[12px] text-sm transition-all duration-200 border cursor-pointer disabled:cursor-default ${
                  isCorrect
                    ? "bg-success/10 border-success/30 text-success"
                    : isWrong
                      ? "bg-error/10 border-error/30 text-error"
                      : isSelected
                        ? "bg-accent/5 border-accent/30 text-text"
                        : "bg-white border-card-border hover:bg-card-hover hover:border-card-border-hover text-muted-strong"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {showResult && (
        <div
          className={`p-4 rounded-[12px] text-sm ${
            answer === question.correctAnswer
              ? "bg-success/10 border border-success/20"
              : "bg-error/10 border border-error/20"
          }`}
        >
          <p className="font-medium mb-1 text-text">
            {answer === question.correctAnswer ? "Correct!" : `Incorrect. Answer: ${question.correctAnswer}`}
          </p>
          <p className="text-muted-strong text-xs">{question.explanation}</p>
        </div>
      )}
    </GlassCard>
  );
}
