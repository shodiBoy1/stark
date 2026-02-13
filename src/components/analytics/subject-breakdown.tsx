"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface SubjectBreakdownProps {
  data: { name: string; count: number; avgScore: number }[];
}

export function SubjectBreakdown({ data }: SubjectBreakdownProps) {
  if (data.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-text mb-4">By Subject</h3>
        <p className="text-sm text-muted text-center py-8">No data yet</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-medium text-text mb-4">By Subject</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9B9493", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fill: "#9B9493", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 12,
              color: "#1A1A1A",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Bar dataKey="avgScore" fill="#D4A5B5" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
