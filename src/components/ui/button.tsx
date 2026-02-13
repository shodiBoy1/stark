"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent hover:bg-accent-hover text-white": variant === "primary",
            "bg-white border border-card-border hover:border-card-border-hover text-text hover:bg-card-hover":
              variant === "secondary",
            "hover:bg-black/5 text-muted-strong hover:text-text": variant === "ghost",
            "bg-error/10 text-error hover:bg-error/20 border border-error/20": variant === "danger",
          },
          {
            "text-sm px-3 py-1.5": size === "sm",
            "text-sm px-5 py-2.5": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
