"use client";

import Link from "next/link";
import { Plus, Play, CheckCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatDate, formatDuration } from "@/lib/utils";
import type { TestRecord } from "@/lib/db";

interface ProjectTestsTabProps {
  projectId: string;
  tests: TestRecord[] | undefined;
}

export function ProjectTestsTab({ projectId, tests }: ProjectTestsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/tests/new?projectId=${projectId}`}>
          <Button>
            <Plus size={16} />
            Generate Test
          </Button>
        </Link>
      </div>

      {tests === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">
          No tests generated for this project yet
        </p>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <GlassCard key={test.id} hover>
              <Link
                href={
                  test.status === "completed"
                    ? `/tests/${test.id}/results`
                    : `/tests/${test.id}`
                }
                className="block p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft/15 flex items-center justify-center shrink-0">
                      {test.status === "completed" ? (
                        <CheckCircle size={18} className="text-success" />
                      ) : (
                        <Play size={18} className="text-accent-soft" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-text truncate">{test.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span>{test.totalQuestions} questions</span>
                        <span>{test.mode === "exam_simulation" ? "Exam" : "Practice"}</span>
                        <span>{formatDate(test.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.status === "completed" && (
                      <>
                        <Badge
                          variant={
                            test.score >= 80
                              ? "success"
                              : test.score >= 50
                                ? "warning"
                                : "error"
                          }
                        >
                          {test.score}%
                        </Badge>
                        <span className="text-xs text-muted">
                          {formatDuration(test.timeSpentSeconds)}
                        </span>
                      </>
                    )}
                    {test.status === "in_progress" && (
                      <Badge variant="accent">In Progress</Badge>
                    )}
                  </div>
                </div>
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
