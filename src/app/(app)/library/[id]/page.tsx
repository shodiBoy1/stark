"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Clock, HardDrive, FileQuestion, ScanSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePDF, usePDFs } from "@/hooks/usePDFs";
import { PageHeader } from "@/components/layout/page-header";
import { PDFViewer } from "@/components/library/pdf-viewer";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize, truncate } from "@/lib/utils";

export default function PDFDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pdf = usePDF(id);
  const { updatePDF } = usePDFs();
  const [isScanning, setIsScanning] = useState(false);

  async function handleRescan() {
    if (!pdf || isScanning || !pdf.pdfBlob) return;

    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append("file", pdf.pdfBlob);

      const res = await fetch("/api/pdf/rescan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Rescan failed");
      const data = await res.json();

      await updatePDF(pdf.id, {
        pageTexts: data.pageTexts,
        extractedText: data.text,
        pageCount: data.pageCount,
      });

      toast.success("Text extraction complete!");
    } catch (error) {
      console.error("Rescan failed:", error);
      toast.error("Re-scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  if (pdf === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">PDF not found</p>
        <Link href="/library" className="text-accent-soft text-sm mt-2 inline-block">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Library
      </Link>

      <PageHeader
        title={pdf.name}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRescan} disabled={isScanning}>
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
              {isScanning ? "Scanning..." : "Re-scan with AI"}
            </Button>
            <Link href={`/tests/new?pdfId=${pdf.id}`}>
              <Button>
                <FileQuestion size={16} />
                Generate Test
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PDFViewer pageTexts={pdf.pageTexts || []} pageCount={pdf.pageCount} />
        </div>

        <div className="space-y-4">
          <GlassCard className="p-5 space-y-4">
            <h3 className="font-medium text-sm text-text">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FileText size={16} className="text-muted" />
                <span className="text-muted">Pages:</span>
                <span className="text-text">{pdf.pageCount}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <HardDrive size={16} className="text-muted" />
                <span className="text-muted">Size:</span>
                <span className="text-text">{formatFileSize(pdf.fileSize)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-muted" />
                <span className="text-muted">Added:</span>
                <span className="text-text">{formatDate(pdf.createdAt)}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <h3 className="font-medium text-sm text-text">Extracted Text Preview</h3>
            <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
              {truncate(pdf.extractedText, 1000) || "No text extracted"}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
