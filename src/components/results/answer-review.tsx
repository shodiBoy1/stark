"use client";

import { QuestionCard } from "@/components/test/question-card";
import type { Question } from "@/lib/db";

interface AnswerReviewProps {
  questions: Question[];
  answers: Record<string, string>;
}

export function AnswerReview({ questions, answers }: AnswerReviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Answers</h3>
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          answer={answers[q.id]}
          onAnswer={() => {}}
          showResult
        />
      ))}
    </div>
  );
}
