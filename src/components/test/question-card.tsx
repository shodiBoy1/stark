"use client";

import { Flag } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAnswerCorrect, optionIsSelectedCorrect } from "@/lib/grading";
import type { Question } from "@/lib/db";

interface QuestionCardProps {
  question: Question;
  index: number;
  answer: string | undefined;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  lockAnswers?: boolean;
  flagged?: boolean;
  onToggleFlag?: () => void;
  onCheck?: () => void;
}

export function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
  showResult,
  lockAnswers,
  flagged,
  onToggleFlag,
  onCheck,
}: QuestionCardProps) {
  const locked = lockAnswers ?? !!showResult;
  const typeLabels: Record<string, string> = {
    multiple_choice: "Multiple Choice",
    true_false: "True / False",
    short_answer: "Short Answer",
    fill_in_blank: "Fill in Blank",
  };

  const correct = showResult && isAnswerCorrect(question, answer);

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">Question {index + 1}</span>
        <div className="flex items-center gap-2">
          {question.page ? <Badge>Page {question.page}</Badge> : null}
          <Badge>{typeLabels[question.type] || question.type}</Badge>
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border cursor-pointer ${
                flagged
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : "border-card-border text-muted hover:text-text"
              }`}
              aria-pressed={flagged}
            >
              <Flag size={12} />
              {flagged ? "Flagged" : "Flag"}
            </button>
          )}
        </div>
      </div>

      {question.type === "fill_in_blank" && question.context && (
        <div className="p-4 bg-black/[0.03] rounded-[12px] border border-card-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-2 font-medium">Context</p>
          <p className="text-sm text-muted-strong leading-relaxed">{question.context}</p>
        </div>
      )}

      <p className="text-base font-medium leading-relaxed text-text">{question.question}</p>

      {question.type === "short_answer" ? (
        <div className="space-y-3">
          <input
            type="text"
            value={answer || ""}
            onChange={(e) => onAnswer(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && onCheck && !showResult) {
                event.preventDefault();
                onCheck();
              }
            }}
            placeholder="Type your answer..."
            disabled={locked}
            className="w-full bg-white border border-card-border rounded-[12px] px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors disabled:opacity-50"
          />
          {onCheck && !showResult && (
            <Button type="button" variant="secondary" size="sm" onClick={onCheck} disabled={!answer?.trim()}>
              Check answer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {question.options?.map((option) => {
            const isSelected = answer === option;
            const isCorrectOption = showResult && optionIsSelectedCorrect(option, question);
            const isWrong = showResult && isSelected && !isCorrectOption;

            return (
              <button
                key={option}
                onClick={() => !locked && onAnswer(option)}
                disabled={locked}
                className={`w-full text-left px-4 py-3 rounded-[12px] text-sm transition-all duration-200 border cursor-pointer disabled:cursor-default ${
                  isCorrectOption
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
            correct ? "bg-success/10 border border-success/20" : "bg-error/10 border border-error/20"
          }`}
        >
          <p className="font-medium mb-1 text-text">
            {correct ? "Correct" : `Answer: ${question.correctAnswer}`}
          </p>
          {question.explanation ? <p className="text-muted-strong text-xs">{question.explanation}</p> : null}
          {!correct && question.acceptedAnswers && question.acceptedAnswers.length > 0 ? (
            <p className="text-muted text-xs mt-2">Also accepted: {question.acceptedAnswers.join(" · ")}</p>
          ) : null}
          {question.source ? (
            <p className="text-muted text-xs mt-2">
              {question.source}
              {question.page ? ` · page ${question.page}` : ""}
            </p>
          ) : null}
        </div>
      )}
    </GlassCard>
  );
}
