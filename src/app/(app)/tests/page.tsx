"use client";

import Link from "next/link";
import { Plus, FileQuestion, Play, CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useTests } from "@/hooks/useTests";
import { formatDate, formatDuration } from "@/lib/utils";
import type { TestRecord } from "@/lib/db";

export default function TestsPage() {
  const { tests, deleteTest } = useTests();
  const [deleteTarget, setDeleteTarget] = useState<TestRecord | null>(null);

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Generate and take AI-powered tests"
        action={
          <Link href="/tests/new">
            <Button>
              <Plus size={16} />
              New Test
            </Button>
          </Link>
        }
      />

      {tests === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No tests yet"
          description="Generate your first test from a PDF in your library"
          action={
            <Link href="/tests/new">
              <Button>Generate Test</Button>
            </Link>
          }
        />
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
                        <span>{test.pdfName}</span>
                        <span>{test.totalQuestions} questions</span>
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(test);
                      }}
                      aria-label="Delete test"
                      className="p-2 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            </GlassCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Test"
        description="Are you sure you want to delete this test? This action cannot be undone."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTest(deleteTarget.id);
            toast.success("Test deleted");
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
