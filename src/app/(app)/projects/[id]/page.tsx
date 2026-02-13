"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  ListChecks,
  Plus,
  Trash2,
  FileUp,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectTestsTab } from "@/components/project/project-tests-tab";
import { ProjectPdfList } from "@/components/project/project-pdf-list";
import { useProject, useProjects } from "@/hooks/useProjects";
import { usePDFs } from "@/hooks/usePDFs";
import { useProjectTests } from "@/hooks/useProjects";
import { generateThumbnail } from "@/lib/utils";
import { OLD_EXAM_TEXT_BUDGET } from "@/lib/constants";
import type { PDFRecord } from "@/lib/db";

type Tab = "materials" | "tests";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = useProject(id);
  const { updateProject } = useProjects();
  const { pdfs: allPDFs, addPDF, updatePDF } = usePDFs();
  const projectTests = useProjectTests(id);

  const [activeTab, setActiveTab] = useState<Tab>("materials");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadPhase, setUploadPhase] = useState("");
  const [newExampleText, setNewExampleText] = useState("");
  const [showDeletePdf, setShowDeletePdf] = useState<PDFRecord | null>(null);
  const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [isRescanning, setIsRescanning] = useState<string | null>(null);
  const [isBatchRescanning, setIsBatchRescanning] = useState(false);

  const projectPDFs = allPDFs?.filter((p) => p.projectId === id);
  const lecturePDFs = projectPDFs?.filter((p) => p.pdfType === "lecture");
  const oldExamPDFs = projectPDFs?.filter((p) => p.pdfType === "old_exam");

  const toggleSelect = (pdfId: string) => {
    setSelectedPdfIds((prev) => {
      const next = new Set(prev);
      if (next.has(pdfId)) next.delete(pdfId);
      else next.add(pdfId);
      return next;
    });
  };

  const selectAll = (pdfs: PDFRecord[]) => {
    setSelectedPdfIds((prev) => {
      const next = new Set(prev);
      const allSelected = pdfs.every((p) => next.has(p.id));
      if (allSelected) {
        pdfs.forEach((p) => next.delete(p.id));
      } else {
        pdfs.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    for (const pdfId of selectedPdfIds) {
      await updatePDF(pdfId, { projectId: undefined });
    }
    toast.success(`${selectedPdfIds.size} PDF(s) removed from project`);
    setSelectedPdfIds(new Set());
    setShowBatchDelete(false);
  };

  const handleRescan = async (pdf: PDFRecord) => {
    if (!pdf.pdfBlob) {
      toast.error("PDF blob not available for rescan");
      return;
    }
    setIsRescanning(pdf.id);
    try {
      const formData = new FormData();
      formData.append("file", pdf.pdfBlob);
      const res = await fetch("/api/pdf/rescan", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Rescan failed");
      const data = await res.json();
      await updatePDF(pdf.id, {
        pageTexts: data.pageTexts,
        extractedText: data.text,
        pageCount: data.pageCount,
      });
      toast.success(`"${pdf.name}" re-scanned successfully`);
    } catch {
      toast.error(`Failed to re-scan "${pdf.name}"`);
    } finally {
      setIsRescanning(null);
    }
  };

  const handleBatchRescan = async () => {
    if (selectedPdfIds.size === 0) return;
    const pdfsToScan = projectPDFs?.filter((p) => selectedPdfIds.has(p.id)) || [];
    setIsBatchRescanning(true);
    let success = 0;
    for (const pdf of pdfsToScan) {
      if (!pdf.pdfBlob) continue;
      try {
        const formData = new FormData();
        formData.append("file", pdf.pdfBlob);
        const res = await fetch("/api/pdf/rescan", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Rescan failed");
        const data = await res.json();
        await updatePDF(pdf.id, {
          pageTexts: data.pageTexts,
          extractedText: data.text,
          pageCount: data.pageCount,
        });
        success++;
      } catch {
        console.warn(`Rescan failed for ${pdf.name}`);
      }
    }
    setIsBatchRescanning(false);
    setSelectedPdfIds(new Set());
    if (success > 0) toast.success(`${success} PDF(s) re-scanned`);
  };

  const processFiles = useCallback(
    async (files: FileList | File[], pdfType: "lecture" | "old_exam") => {
      const pdfFiles = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
      if (pdfFiles.length === 0) {
        toast.error("Please upload PDF files");
        return;
      }
      if (pdfFiles.length > 10) {
        toast.error("Maximum 10 files at once");
        return;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: pdfFiles.length });

      let successCount = 0;
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        setUploadProgress({ current: i + 1, total: pdfFiles.length });
        try {
          setUploadPhase("Processing...");
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/pdf/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Failed to process PDF");
          const data = await response.json();

          const thumbnailDataUrl = generateThumbnail(file.name);

          const pdfId = crypto.randomUUID();
          const pdfRecord: PDFRecord = {
            id: pdfId,
            name: file.name,
            fileSize: file.size,
            pageCount: data.pageCount,
            extractedText: data.text,
            pageTexts: data.pageTexts || [],
            images: [],
            thumbnailDataUrl,
            pdfBlob: file,
            projectId: id,
            pdfType,
            createdAt: new Date(),
          };

          await addPDF(pdfRecord);

          if (pdfType === "old_exam") {
            const currentTexts = project?.oldExamTexts || [];
            await updateProject(id, {
              oldExamTexts: [...currentTexts, data.text.slice(0, OLD_EXAM_TEXT_BUDGET)],
            });
          }

          successCount++;
        } catch {
          toast.error(`Failed to process "${file.name}"`);
        }
      }

      setIsUploading(false);
      setUploadPhase("");
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? `"${pdfFiles[0].name}" added to project`
            : `${successCount} PDFs added to project`,
        );
      }
    },
    [addPDF, updatePDF, id, project, updateProject],
  );

  if (project === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Project not found</p>
        <Link href="/projects" className="text-accent-soft text-sm mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "materials", label: "Materials", icon: FileText },
    { key: "tests", label: "Tests", icon: ListChecks },
  ];

  const hasSelection = selectedPdfIds.size > 0;

  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Projects
      </Link>

      <PageHeader title={project.name} description={project.description || "No description"} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-black/[0.03] p-1 rounded-[14px] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-white text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <div className="space-y-8">
          {/* Batch actions bar */}
          {hasSelection && (
            <div className="flex items-center gap-3 p-3 bg-accent-soft/10 rounded-xl">
              <span className="text-sm text-text font-medium">{selectedPdfIds.size} selected</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBatchRescan}
                disabled={isBatchRescanning}
              >
                {isBatchRescanning ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />}
                Re-scan selected
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBatchDelete(true)}
              >
                <Trash2 size={14} />
                Remove selected
              </Button>
              <button
                onClick={() => setSelectedPdfIds(new Set())}
                className="text-xs text-muted hover:text-text ml-auto cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Lecture PDFs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text">Lecture PDFs</h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files, "lecture");
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-2 text-sm text-accent-soft hover:text-accent cursor-pointer">
                  <Upload size={14} />
                  Upload Lectures (up to 10)
                </span>
              </label>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted mb-3">
                <Loader2 size={14} className="animate-spin" />
                PDF {uploadProgress.current}/{uploadProgress.total}{uploadPhase ? ` — ${uploadPhase}` : ""}
              </div>
            )}
            {lecturePDFs && lecturePDFs.length > 0 ? (
              <ProjectPdfList
                pdfs={lecturePDFs}
                type="lecture"
                selectedPdfIds={selectedPdfIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onRescan={handleRescan}
                onDelete={(pdf) => setShowDeletePdf(pdf)}
                isRescanning={isRescanning}
              />
            ) : (
              <p className="text-sm text-muted py-4 text-center">No lecture PDFs added yet</p>
            )}
          </section>

          {/* Old Exam PDFs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text">Old Exams (for AI context)</h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files, "old_exam");
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-2 text-sm text-accent-soft hover:text-accent cursor-pointer">
                  <FileUp size={14} />
                  Upload Old Exams (up to 10)
                </span>
              </label>
            </div>
            {oldExamPDFs && oldExamPDFs.length > 0 ? (
              <ProjectPdfList
                pdfs={oldExamPDFs}
                type="old_exam"
                selectedPdfIds={selectedPdfIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onRescan={handleRescan}
                onDelete={(pdf) => setShowDeletePdf(pdf)}
                isRescanning={isRescanning}
              />
            ) : (
              <p className="text-sm text-muted py-4 text-center">
                Upload old exams so AI can match the exam style
              </p>
            )}
          </section>

          {/* Exam Examples (text) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text">Exam Examples (text)</h3>
            </div>
            <div className="space-y-3">
              {project.examExamples.map((example, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-muted-strong line-clamp-3 flex-1">{example}</p>
                    <button
                      onClick={async () => {
                        const updated = project.examExamples.filter((_, idx) => idx !== i);
                        await updateProject(id, { examExamples: updated });
                        toast.success("Example removed");
                      }}
                      aria-label="Remove example"
                      className="p-2 rounded-lg hover:bg-error/10 text-muted hover:text-error transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassCard>
              ))}
              <div className="space-y-2">
                <textarea
                  placeholder="Paste an exam example or question format..."
                  value={newExampleText}
                  onChange={(e) => setNewExampleText(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-card-border rounded-[12px] px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors resize-none"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (!newExampleText.trim()) return;
                    await updateProject(id, {
                      examExamples: [...project.examExamples, newExampleText.trim()],
                    });
                    setNewExampleText("");
                    toast.success("Example added");
                  }}
                  disabled={!newExampleText.trim()}
                >
                  <Plus size={14} />
                  Add Example
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === "tests" && (
        <ProjectTestsTab projectId={id} tests={projectTests} />
      )}

      {/* Delete PDF Confirmation */}
      <ConfirmDialog
        open={!!showDeletePdf}
        onClose={() => setShowDeletePdf(null)}
        title="Remove PDF"
        description={<>Remove &ldquo;{showDeletePdf?.name}&rdquo; from this project? The PDF will remain in your library.</>}
        confirmLabel="Remove"
        onConfirm={async () => {
          if (showDeletePdf) {
            await updatePDF(showDeletePdf.id, { projectId: undefined });
            toast.success("PDF removed from project");
            setShowDeletePdf(null);
          }
        }}
      />

      {/* Batch Delete Confirmation */}
      <ConfirmDialog
        open={showBatchDelete}
        onClose={() => setShowBatchDelete(false)}
        title="Remove Selected PDFs"
        description={`Remove ${selectedPdfIds.size} PDF(s) from this project? They will remain in your library.`}
        confirmLabel={`Remove ${selectedPdfIds.size} PDF(s)`}
        onConfirm={handleBatchDelete}
      />
    </div>
  );
}
