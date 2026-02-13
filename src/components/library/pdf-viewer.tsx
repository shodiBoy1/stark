"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface PDFViewerProps {
  pageTexts: string[];
  pageCount: number;
}

export function PDFViewer({ pageTexts, pageCount }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const currentText = pageTexts[currentPage - 1] ?? "";
  const trimmed = currentText.trim();

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-[70vh] rounded-lg bg-white border border-card-border p-6">
        {trimmed ? (
          <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{trimmed}</p>
        ) : (
          <p className="text-sm text-muted">(No text on this page)</p>
        )}
      </div>
    </GlassCard>
  );
}
