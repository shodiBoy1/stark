"use client";

import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { PDFRecord } from "@/lib/db";

interface PDFCardProps {
  pdf: PDFRecord;
  onDelete: (id: string) => void;
  projectName?: string;
}

export function PDFCard({ pdf, onDelete, projectName }: PDFCardProps) {
  return (
    <GlassCard hover className="group">
      <Link href={`/library/${pdf.id}`} className="block p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-soft/15 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-accent-soft" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm text-text truncate">{pdf.name}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
              <span>{pdf.pageCount} pages</span>
              <span>{formatFileSize(pdf.fileSize)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {pdf.pdfType === "old_exam" && (
                <Badge variant="warning">Old Exam</Badge>
              )}
              {projectName && (
                <Badge variant="accent">{projectName}</Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="px-5 pb-3 flex items-center justify-between">
        <p className="text-xs text-muted">{formatDate(pdf.createdAt)}</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(pdf.id);
          }}
          aria-label="Delete PDF"
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 text-muted hover:text-error transition-all duration-200 cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </GlassCard>
  );
}
