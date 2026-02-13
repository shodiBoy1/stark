"use client";

import { useState } from "react";
import { Library } from "lucide-react";
import { PDFCard } from "./pdf-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePDFs } from "@/hooks/usePDFs";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import type { PDFRecord } from "@/lib/db";
import { CardSkeleton } from "@/components/ui/skeleton";

export function PDFGrid() {
  const { pdfs, deletePDF } = usePDFs();
  const { projects } = useProjects();
  const [deleteTarget, setDeleteTarget] = useState<PDFRecord | null>(null);

  if (pdfs === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="No PDFs yet"
        description="Upload your first PDF to start studying"
      />
    );
  }

  const projectMap = new Map(projects?.map((p) => [p.id, p.name]) || []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map((pdf) => (
          <PDFCard
            key={pdf.id}
            pdf={pdf}
            onDelete={() => setDeleteTarget(pdf)}
            projectName={pdf.projectId ? projectMap.get(pdf.projectId) : undefined}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete PDF"
        description={<>Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This will also delete all associated tests.</>}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePDF(deleteTarget.id);
            toast.success("PDF deleted");
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
