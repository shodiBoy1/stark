"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface TestTimerProps {
  mode?: "elapsed" | "countdown";
  totalSeconds?: number;
  onTick: (seconds: number) => void;
  onTimeUp?: () => void;
}

export function TestTimer({ mode = "elapsed", totalSeconds, onTick, onTimeUp }: TestTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onTick(next);

        if (mode === "countdown" && totalSeconds && next >= totalSeconds) {
          clearInterval(interval);
          onTimeUp?.();
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onTick, onTimeUp, mode, totalSeconds]);

  if (mode === "countdown" && totalSeconds) {
    const remaining = Math.max(0, totalSeconds - seconds);
    const remainingMins = remaining / 60;
    const isWarning = remainingMins <= 5 && remainingMins > 1;
    const isCritical = remainingMins <= 1;

    return (
      <div
        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
          isCritical
            ? "bg-error/10 text-error animate-pulse"
            : isWarning
              ? "bg-warning/10 text-warning"
              : "text-muted"
        }`}
      >
        {isCritical ? <AlertTriangle size={14} /> : <Clock size={14} />}
        <span className="font-mono font-medium">{formatDuration(remaining)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Clock size={14} />
      <span className="font-mono">{formatDuration(seconds)}</span>
    </div>
  );
}
