"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import type { Question } from "@/lib/db";

interface QuestionNavProps {
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  flagged?: string[];
  onNavigate: (index: number) => void;
}

export function QuestionNav({ questions, answers, currentIndex, flagged = [], onNavigate }: QuestionNavProps) {
  const flaggedSet = new Set(flagged);

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id]?.trim();
          const isCurrent = i === currentIndex;
          const isFlagged = flaggedSet.has(q.id);

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(i)}
              className={cn(
                "relative w-full aspect-square rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                isCurrent
                  ? "bg-accent text-white"
                  : isAnswered
                    ? "bg-accent-soft/20 text-accent-soft"
                    : "bg-black/5 text-muted hover:bg-black/10",
                isFlagged && !isCurrent && "ring-2 ring-warning/70"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted mt-3">Flagged questions have a ring. Jump back to them before you submit.</p>
    </GlassCard>
  );
}
