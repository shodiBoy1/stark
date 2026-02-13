"use client";

import Link from "next/link";
import {
  FileText,
  Trash2,
  ScanSearch,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { formatFileSize } from "@/lib/utils";
import type { PDFRecord } from "@/lib/db";

interface ProjectPdfListProps {
  pdfs: PDFRecord[] | undefined;
  type: "lecture" | "old_exam";
  selectedPdfIds: Set<string>;
  onToggleSelect: (pdfId: string) => void;
  onSelectAll: (pdfs: PDFRecord[]) => void;
  onRescan: (pdf: PDFRecord) => void;
  onDelete: (pdf: PDFRecord) => void;
  isRescanning: string | null;
}

export function ProjectPdfList({
  pdfs,
  type,
  selectedPdfIds,
  onToggleSelect,
  onSelectAll,
  onRescan,
  onDelete,
  isRescanning,
}: ProjectPdfListProps) {
  if (!pdfs || pdfs.length === 0) return null;

  const allSelected = pdfs.every((p) => selectedPdfIds.has(p.id));

  return (
    <div className="space-y-2">
      {pdfs.length > 1 && (
        <button
          onClick={() => onSelectAll(pdfs)}
          className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors mb-1 cursor-pointer"
        >
          {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      )}
      {pdfs.map((pdf) => (
        <GlassCard key={pdf.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => onToggleSelect(pdf.id)}
                aria-label={selectedPdfIds.has(pdf.id) ? "Deselect PDF" : "Select PDF"}
                className="text-muted hover:text-text transition-colors cursor-pointer shrink-0"
              >
                {selectedPdfIds.has(pdf.id) ? (
                  <CheckSquare size={16} className="text-accent-soft" />
                ) : (
                  <Square size={16} />
                )}
              </button>
              <Link href={`/library/${pdf.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <FileText size={16} className={type === "old_exam" ? "text-warning shrink-0" : "text-accent-soft shrink-0"} />
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{pdf.name}</p>
                  <p className="text-xs text-muted">
                    {pdf.pageCount} pages &middot; {formatFileSize(pdf.fileSize)}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRescan(pdf)}
                disabled={isRescanning === pdf.id}
                className="p-2 rounded-lg hover:bg-accent-soft/10 text-muted hover:text-accent-soft transition-all cursor-pointer disabled:opacity-50"
                title="Re-scan with AI"
                aria-label="Re-scan with AI"
              >
                {isRescanning === pdf.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ScanSearch size={14} />
                )}
              </button>
              <button
                onClick={() => onDelete(pdf)}
                aria-label="Remove PDF"
                className="p-2 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
