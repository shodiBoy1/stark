import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function generateThumbnail(name: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 260;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#F9F7F4";
  ctx.fillRect(0, 0, 200, 260);

  ctx.fillStyle = "#B8A9C9";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PDF", 100, 130);

  ctx.fillStyle = "#9B9493";
  ctx.font = "11px sans-serif";
  const shortName = name.length > 20 ? name.slice(0, 17) + "..." : name;
  ctx.fillText(shortName, 100, 155);

  return canvas.toDataURL();
}
