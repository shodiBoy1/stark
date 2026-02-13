"use client";

import { useCallback, useState } from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePDFs } from "@/hooks/usePDFs";
import { generateThumbnail } from "@/lib/utils";
import type { PDFRecord } from "@/lib/db";

const MAX_FILES = 10;

export function PDFUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const { addPDF } = usePDFs();

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".pdf")) {
        toast.error(`"${file.name}" is not a PDF file`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process "${file.name}"`);
      }

      const data = await response.json();
      const thumbnailDataUrl = generateThumbnail(file.name);

      const pdfRecord: PDFRecord = {
        id: crypto.randomUUID(),
        name: file.name,
        fileSize: file.size,
        pageCount: data.pageCount,
        extractedText: data.text,
        pageTexts: data.pageTexts || [],
        images: [],
        thumbnailDataUrl,
        pdfBlob: file,
        pdfType: "lecture",
        createdAt: new Date(),
      };

      await addPDF(pdfRecord);
    },
    [addPDF],
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      const pdfFiles = files.filter((f) => f.name.endsWith(".pdf"));
      if (pdfFiles.length === 0) {
        toast.error("Please upload PDF files");
        return;
      }
      if (pdfFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files at once`);
        return;
      }

      setIsProcessing(true);
      setUploadProgress({ current: 0, total: pdfFiles.length });

      let successCount = 0;
      for (let i = 0; i < pdfFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: pdfFiles.length });
        try {
          await processFile(pdfFiles[i]);
          successCount++;
        } catch {
          toast.error(`Failed to process "${pdfFiles[i].name}"`);
        }
      }

      setIsProcessing(false);
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? `"${pdfFiles[0].name}" uploaded successfully`
            : `${successCount} PDFs uploaded successfully`,
        );
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processFiles(files);
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) processFiles(files);
      e.target.value = "";
    },
    [processFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`card transition-card p-8 flex flex-col items-center justify-center text-center cursor-pointer border-dashed ${
        isDragging
          ? "border-accent bg-accent/5 border-2"
          : "border-card-border hover:border-card-border-hover"
      }`}
      onClick={() => !isProcessing && document.getElementById("pdf-upload")?.click()}
    >
      <input
        type="file"
        id="pdf-upload"
        accept=".pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {isProcessing ? (
        <>
          <Loader2 size={32} className="text-accent animate-spin mb-3" />
          {uploadProgress.total > 1 && (
            <p className="text-xs text-muted mb-1">
              PDF {uploadProgress.current} of {uploadProgress.total}
            </p>
          )}
          <p className="text-sm font-medium text-text">Processing PDF...</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-accent-soft/15 flex items-center justify-center mb-4">
            {isDragging ? (
              <FileUp size={24} className="text-accent-soft" />
            ) : (
              <Upload size={24} className="text-accent-soft" />
            )}
          </div>
          <p className="text-sm font-medium text-text">
            {isDragging ? "Drop your PDFs here" : "Upload PDFs"}
          </p>
          <p className="text-xs text-muted mt-1">
            Drag & drop or click to browse (up to {MAX_FILES} files)
          </p>
        </>
      )}
    </div>
  );
}
