"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { useTest, useTests } from "@/hooks/useTests";
import { isAnswerCorrect } from "@/lib/grading";
import type { TestRecord } from "@/lib/db";
import { ScoreSummary } from "@/components/results/score-summary";
import { TopicBreakdown } from "@/components/results/topic-breakdown";
import { AnswerReview } from "@/components/results/answer-review";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = useTest(id);
  const { addTest } = useTests();
  const router = useRouter();
  const [isDrilling, setIsDrilling] = useState(false);

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

  const finished = test;
  const retakeHref = finished.projectId
    ? `/tests/new?projectId=${finished.projectId}`
    : `/tests/new?pdfId=${finished.pdfId}`;

  const missed = finished.questions.filter((question) => !isAnswerCorrect(question, finished.answers[question.id]));

  async function drillMissed() {
    if (missed.length === 0 || isDrilling) return;
    setIsDrilling(true);
    try {
      const drill: TestRecord = {
        id: crypto.randomUUID(),
        pdfId: finished.pdfId,
        pdfName: finished.pdfName,
        title: `${finished.title} · missed`,
        questions: missed.map((question, index) => ({ ...question, id: `q${index + 1}` })),
        answers: {},
        score: 0,
        totalCorrect: 0,
        totalQuestions: missed.length,
        difficulty: finished.difficulty,
        language: finished.language,
        model: finished.model,
        timeSpentSeconds: 0,
        status: "in_progress",
        projectId: finished.projectId,
        pdfIds: finished.pdfIds,
        mode: "practice",
        flagged: [],
        createdAt: new Date(),
      };
      await addTest(drill);
      router.push(`/tests/${drill.id}`);
    } catch {
      toast.error("Could not start the missed-question drill");
      setIsDrilling(false);
    }
  }

  return (
    <div>
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Tests
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
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
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={drillMissed} disabled={missed.length === 0 || isDrilling}>
            <Target size={16} />
            {missed.length === 0 ? "No misses" : `Drill ${missed.length} missed`}
          </Button>
          <Link href={retakeHref}>
            <Button variant="secondary">
              <RotateCcw size={16} />
              New test
            </Button>
          </Link>
        </div>
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
