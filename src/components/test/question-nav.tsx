"use client";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import type { Question } from "@/lib/db";

interface QuestionNavProps {
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function QuestionNav({ questions, answers, currentIndex, onNavigate }: QuestionNavProps) {
  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = i === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(i)}
              className={cn(
                "w-full aspect-square rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                isCurrent
                  ? "bg-accent text-white"
                  : isAnswered
                    ? "bg-accent-soft/20 text-accent-soft"
                    : "bg-black/5 text-muted hover:bg-black/10"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
