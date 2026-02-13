"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ className, hover, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("card transition-card", hover && "card-hover cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  );
}
