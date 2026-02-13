"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { normalizeText } from "@/lib/utils";
import type { Question } from "@/lib/db";

interface TopicBreakdownProps {
  questions: Question[];
  answers: Record<string, string>;
}

export function TopicBreakdown({ questions, answers }: TopicBreakdownProps) {
  const topicMap = new Map<string, { correct: number; total: number }>();

  for (const q of questions) {
    const source = q.source || "Unknown";
    const entry = topicMap.get(source) || { correct: 0, total: 0 };
    entry.total++;
    const userAnswer = answers[q.id];
    if (userAnswer && normalizeText(userAnswer) === normalizeText(q.correctAnswer)) {
      entry.correct++;
    }
    topicMap.set(source, entry);
  }

  const topics = [...topicMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (topics.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold text-text mb-4">Per-Topic Breakdown</h3>
      <div className="space-y-3">
        {topics.map(([name, { correct, total }]) => {
          const pct = Math.round((correct / total) * 100);
          const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";

          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text truncate mr-3">{name}</span>
                <span className="text-sm font-medium text-muted-strong whitespace-nowrap">
                  {correct}/{total}
                </span>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
