"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface ScoreTrendChartProps {
  data: { date: string; score: number; title: string }[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-text mb-4">Score Trend</h3>
        <p className="text-sm text-muted text-center py-8">
          Complete some tests to see your score trend
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-medium text-text mb-4">Score Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="date" tick={{ fill: "#9B9493", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#9B9493", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 12,
              color: "#1A1A1A",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#B8A9C9"
            strokeWidth={2}
            dot={{ fill: "#B8A9C9", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
