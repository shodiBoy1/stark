"use client";

import { use, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTest } from "@/hooks/useTests";
import { normalizeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { QuestionCard } from "@/components/test/question-card";
import { QuestionNav } from "@/components/test/question-nav";
import { TestTimer } from "@/components/test/test-timer";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

export default function TestTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = useTest(id);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeRef = useRef(0);
  const hasAutoSubmitted = useRef(false);

  const isCompleted = test?.status === "completed";

  const handleTick = useCallback((s: number) => {
    timeRef.current = s;
  }, []);

  const handleSubmit = useCallback(
    async (auto?: boolean) => {
      if (isSubmitting || hasAutoSubmitted.current) return;
      if (auto) hasAutoSubmitted.current = true;
      setIsSubmitting(true);
      try {
        const currentTest = await db.tests.get(id);
        if (!currentTest || currentTest.status === "completed") return;

        let totalCorrect = 0;
        for (const q of currentTest.questions) {
          const userAnswer = currentTest.answers[q.id];
          if (userAnswer && normalizeText(userAnswer) === normalizeText(q.correctAnswer)) {
            totalCorrect++;
          }
        }
        const score = Math.round((totalCorrect / currentTest.totalQuestions) * 100);

        await db.tests.update(id, {
          status: "completed",
          score,
          totalCorrect,
          timeSpentSeconds: timeRef.current,
          autoSubmitted: auto || false,
          completedAt: new Date(),
        });

        toast.success(
          auto
            ? `Time's up! Test auto-submitted. Score: ${score}%`
            : `Test completed! Score: ${score}%`
        );
        router.push(`/tests/${id}/results`);
      } catch {
        toast.error("Failed to submit test");
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, router, isSubmitting]
  );

  const handleTimeUp = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  useEffect(() => {
    if (isCompleted) router.replace(`/tests/${id}/results`);
  }, [isCompleted, id, router]);

  if (test === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Test not found</p>
        <Link href="/tests" className="text-accent-soft text-sm mt-2 inline-block">
          Back to Tests
        </Link>
      </div>
    );
  }

  if (isCompleted) return null;

  const currentQuestion = test.questions[currentIndex];
  const answeredCount = Object.keys(test.answers).length;
  const progress = (answeredCount / test.totalQuestions) * 100;
  const isExamMode = test.mode === "exam_simulation";

  async function handleAnswer(answer: string) {
    const updated = { ...test!.answers, [currentQuestion.id]: answer };
    await db.tests.update(id, { answers: updated });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={14} />
          Exit Test
        </Link>
        <div className="flex items-center gap-3">
          {isExamMode && (
            <Badge variant="accent">Exam Mode</Badge>
          )}
          <TestTimer
            mode={isExamMode && test.timeLimitSeconds ? "countdown" : "elapsed"}
            totalSeconds={test.timeLimitSeconds}
            onTick={handleTick}
            onTimeUp={handleTimeUp}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-text">{test.title}</h1>
          <span className="text-sm text-muted">
            {answeredCount}/{test.totalQuestions} answered
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            answer={test.answers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            {currentIndex === test.questions.length - 1 ? (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send size={16} />
                Submit Test
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(test!.questions.length - 1, i + 1))
                }
              >
                Next
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>

        <div>
          <QuestionNav
            questions={test.questions}
            answers={test.answers}
            currentIndex={currentIndex}
            onNavigate={setCurrentIndex}
          />
        </div>
      </div>

      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        title="Submit Test"
      >
        <p className="text-sm text-muted">
          You have answered {answeredCount} out of {test.totalQuestions} questions.
          {answeredCount < test.totalQuestions && (
            <span className="text-warning">
              {" "}
              {test.totalQuestions - answeredCount} questions are unanswered and will be marked
              incorrect.
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowSubmitDialog(false)}>
            Continue Test
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
