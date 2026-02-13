"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PDFUploadZone } from "@/components/library/pdf-upload-zone";
import { PDFGrid } from "@/components/library/pdf-grid";

export default function LibraryPage() {
  return (
    <div>
      <PageHeader
        title="Library"
        description="Upload and manage your lecture PDFs"
      />
      <div className="space-y-6">
        <PDFUploadZone />
        <PDFGrid />
      </div>
    </div>
  );
}
