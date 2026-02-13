"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTest } from "@/hooks/useTests";
import { ScoreSummary } from "@/components/results/score-summary";
import { TopicBreakdown } from "@/components/results/topic-breakdown";
import { AnswerReview } from "@/components/results/answer-review";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = useTest(id);

  if (test === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!test || test.status !== "completed") {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Results not available</p>
        <Link href="/tests" className="text-accent-soft text-sm mt-2 inline-block">
          Back to Tests
        </Link>
      </div>
    );
  }

  const retakeHref = test.projectId
    ? `/tests/new?projectId=${test.projectId}`
    : `/tests/new?pdfId=${test.pdfId}`;

  return (
    <div>
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Tests
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{test.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge>{test.difficulty}</Badge>
            <Badge>{test.model}</Badge>
            <Badge>{test.language === "en" ? "English" : "Deutsch"}</Badge>
            {test.mode === "exam_simulation" && <Badge variant="accent">Exam Simulation</Badge>}
            {test.autoSubmitted && (
              <Badge variant="warning">Auto-submitted</Badge>
            )}
          </div>
        </div>
        <Link href={retakeHref}>
          <Button variant="secondary">
            <RotateCcw size={16} />
            Retake
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <ScoreSummary
              score={test.score}
              totalCorrect={test.totalCorrect}
              totalQuestions={test.totalQuestions}
              timeSpentSeconds={test.timeSpentSeconds}
            />
            <TopicBreakdown questions={test.questions} answers={test.answers} />
          </div>
        </div>
        <div className="lg:col-span-2">
          <AnswerReview questions={test.questions} answers={test.answers} />
        </div>
      </div>
    </div>
  );
}
