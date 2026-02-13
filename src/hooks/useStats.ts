"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useStats(projectId?: string) {
  const stats = useLiveQuery(async () => {
    const pdfs = projectId
      ? await db.pdfs.where("projectId").equals(projectId).count()
      : await db.pdfs.count();

    const projects = await db.projects.count();

    const allTests = projectId
      ? await db.tests.where("projectId").equals(projectId).toArray()
      : await db.tests.toArray();
    const completedTests = allTests.filter((t) => t.status === "completed");

    const totalTests = completedTests.length;
    const averageScore =
      totalTests > 0
        ? Math.round(completedTests.reduce((sum, t) => sum + t.score, 0) / totalTests)
        : 0;
    const totalStudyTime = completedTests.reduce((sum, t) => sum + t.timeSpentSeconds, 0);

    // Score trend: last 10 tests
    const scoreTrend = completedTests
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
      .slice(-10)
      .map((t) => ({
        date: t.completedAt!.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: t.score,
        title: t.title,
      }));

    // Difficulty breakdown
    const difficultyMap: Record<string, { total: number; avgScore: number }> = {};
    for (const t of completedTests) {
      if (!difficultyMap[t.difficulty]) {
        difficultyMap[t.difficulty] = { total: 0, avgScore: 0 };
      }
      difficultyMap[t.difficulty].total++;
      difficultyMap[t.difficulty].avgScore += t.score;
    }
    const difficultyBreakdown = Object.entries(difficultyMap).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.total,
      avgScore: data.total > 0 ? Math.round(data.avgScore / data.total) : 0,
    }));

    // Subject breakdown (by PDF)
    const subjectMap: Record<string, { total: number; avgScore: number }> = {};
    for (const t of completedTests) {
      const name = t.pdfName;
      if (!subjectMap[name]) {
        subjectMap[name] = { total: 0, avgScore: 0 };
      }
      subjectMap[name].total++;
      subjectMap[name].avgScore += t.score;
    }
    const subjectBreakdown = Object.entries(subjectMap).map(([name, data]) => ({
      name: name.replace(".pdf", ""),
      count: data.total,
      avgScore: data.total > 0 ? Math.round(data.avgScore / data.total) : 0,
    }));

    return {
      totalPDFs: pdfs,
      totalProjects: projects,
      totalTests,
      averageScore,
      totalStudyTime,
      scoreTrend,
      difficultyBreakdown,
      subjectBreakdown,
      recentTests: completedTests.slice(0, 5),
    };
  }, [projectId]);

  return stats;
}
