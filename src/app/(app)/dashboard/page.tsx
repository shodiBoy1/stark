"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  Trophy,
  Clock,
  Plus,
  FileUp,
  ArrowRight,
  FileQuestion,
  Play,
  FolderOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/useStats";
import { usePDFs } from "@/hooks/usePDFs";
import { useProjects } from "@/hooks/useProjects";
import { formatDate, formatDuration, formatFileSize, truncate } from "@/lib/utils";

export default function DashboardPage() {
  const stats = useStats();
  const { pdfs } = usePDFs();
  const { projects } = useProjects();

  if (!stats || pdfs === undefined) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "PDFs", value: stats.totalPDFs, icon: BookOpen, color: "text-accent-soft" },
    { label: "Tests Done", value: stats.totalTests, icon: CheckCircle, color: "text-success" },
    { label: "Avg Score", value: `${stats.averageScore}%`, icon: Trophy, color: "text-accent-pink" },
    {
      label: "Study Time",
      value: formatDuration(stats.totalStudyTime),
      icon: Clock,
      color: "text-muted-strong",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your study overview."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/library">
          <GlassCard hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-soft/15 flex items-center justify-center">
              <FileUp size={20} className="text-accent-soft" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-text">Upload PDF</h3>
              <p className="text-xs text-muted mt-0.5">Add a new lecture to your library</p>
            </div>
            <ArrowRight size={16} className="text-muted" />
          </GlassCard>
        </Link>
        <Link href="/tests/new">
          <GlassCard hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Plus size={20} className="text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-text">Generate Test</h3>
              <p className="text-xs text-muted mt-0.5">Create an AI-powered test from your PDFs</p>
            </div>
            <ArrowRight size={16} className="text-muted" />
          </GlassCard>
        </Link>
        <Link href="/projects">
          <GlassCard hover className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <FolderOpen size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-text">New Project</h3>
              <p className="text-xs text-muted mt-0.5">Organize a course with exam prep</p>
            </div>
            <ArrowRight size={16} className="text-muted" />
          </GlassCard>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-text">Recent Projects</h3>
            <Link href="/projects" className="text-xs text-accent-soft hover:underline">
              View all
            </Link>
          </div>
          {!projects || projects.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] transition-colors"
                >
                  <FolderOpen size={16} className="text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{project.name}</p>
                    <p className="text-xs text-muted">{formatDate(project.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent PDFs */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-text">Recent PDFs</h3>
            <Link href="/library" className="text-xs text-accent-soft hover:underline">
              View all
            </Link>
          </div>
          {pdfs.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No PDFs uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {pdfs.slice(0, 4).map((pdf) => (
                <Link
                  key={pdf.id}
                  href={`/library/${pdf.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] transition-colors"
                >
                  <FileQuestion size={16} className="text-accent-soft shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{pdf.name}</p>
                    <p className="text-xs text-muted">
                      {pdf.pageCount} pages &middot; {formatFileSize(pdf.fileSize)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Tests */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-text">Recent Tests</h3>
            <Link href="/tests" className="text-xs text-accent-soft hover:underline">
              View all
            </Link>
          </div>
          {stats.recentTests.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No tests completed yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTests.map((test) => (
                <Link
                  key={test.id}
                  href={`/tests/${test.id}/results`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] transition-colors"
                >
                  <Play size={16} className="text-success shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{truncate(test.title, 30)}</p>
                    <p className="text-xs text-muted">{formatDate(test.completedAt!)}</p>
                  </div>
                  <Badge
                    variant={
                      test.score >= 80 ? "success" : test.score >= 50 ? "warning" : "error"
                    }
                  >
                    {test.score}%
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
