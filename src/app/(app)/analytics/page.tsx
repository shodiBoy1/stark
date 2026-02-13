"use client";

import { BookOpen, CheckCircle, Trophy, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ScoreTrendChart } from "@/components/analytics/score-trend-chart";
import { DifficultyBreakdown } from "@/components/analytics/difficulty-breakdown";
import { SubjectBreakdown } from "@/components/analytics/subject-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/useStats";
import { formatDuration } from "@/lib/utils";

export default function AnalyticsPage() {
  const stats = useStats();

  if (!stats) {
    return (
      <div>
        <PageHeader title="Analytics" description="Track your study performance" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const overviewCards = [
    {
      label: "Total PDFs",
      value: stats.totalPDFs,
      icon: BookOpen,
      color: "text-accent-soft",
    },
    {
      label: "Tests Completed",
      value: stats.totalTests,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Average Score",
      value: `${stats.averageScore}%`,
      icon: Trophy,
      color: "text-accent-pink",
    },
    {
      label: "Study Time",
      value: formatDuration(stats.totalStudyTime),
      icon: Clock,
      color: "text-muted-strong",
    },
  ];

  return (
    <div>
      <PageHeader title="Analytics" description="Track your study performance" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="space-y-6">
        <ScoreTrendChart data={stats.scoreTrend} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DifficultyBreakdown data={stats.difficultyBreakdown} />
          <SubjectBreakdown data={stats.subjectBreakdown} />
        </div>
      </div>
    </div>
  );
}
