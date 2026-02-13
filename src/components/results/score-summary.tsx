"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { formatDuration } from "@/lib/utils";

interface ScoreSummaryProps {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}

export function ScoreSummary({
  score,
  totalCorrect,
  totalQuestions,
  timeSpentSeconds,
}: ScoreSummaryProps) {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <GlassCard className="p-8 flex flex-col items-center text-center">
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}%
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-text mb-1">
        {score >= 80 ? "Excellent!" : score >= 50 ? "Good effort!" : "Keep practicing!"}
      </h2>
      <p className="text-sm text-muted">
        You got {totalCorrect} out of {totalQuestions} questions correct
      </p>
      <p className="text-xs text-muted mt-2">
        Time: {formatDuration(timeSpentSeconds)}
      </p>
    </GlassCard>
  );
}
