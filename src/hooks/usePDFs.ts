"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type PDFRecord } from "@/lib/db";

export function usePDFs(projectId?: string) {
  const pdfs = useLiveQuery(() => {
    if (projectId) {
      return db.pdfs.where("projectId").equals(projectId).reverse().sortBy("createdAt");
    }
    return db.pdfs.orderBy("createdAt").reverse().toArray();
  }, [projectId]);

  async function addPDF(pdf: PDFRecord) {
    await db.pdfs.add(pdf);
  }

  async function deletePDF(id: string) {
    await db.transaction("rw", [db.pdfs, db.tests], async () => {
      await db.pdfs.delete(id);
      await db.tests.where("pdfId").equals(id).delete();
    });
  }

  async function getPDF(id: string) {
    return db.pdfs.get(id);
  }

  async function updatePDF(id: string, updates: Partial<Omit<PDFRecord, "id">>) {
    await db.pdfs.update(id, updates);
  }

  return { pdfs, addPDF, deletePDF, getPDF, updatePDF };
}

export function usePDF(id: string) {
  const pdf = useLiveQuery(() => db.pdfs.get(id), [id]);
  return pdf;
}
