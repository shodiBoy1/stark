import { MAX_PDF_BYTES } from "./constants";

export interface PdfExtractionResponse {
  text: string;
  pageTexts: string[];
  pageCount: number;
  warnings?: string[];
  fileName?: string;
  fileSize?: number;
}

export async function requestPdfExtraction(
  file: Blob,
  name: string,
  endpoint: "/api/pdf/upload" | "/api/pdf/rescan",
): Promise<PdfExtractionResponse> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`"${name}" is larger than 20 MB. Split it into smaller PDFs.`);
  }
  if (file.size < 5) {
    throw new Error(`"${name}" is empty.`);
  }

  const formData = new FormData();
  const filename = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
  formData.append("file", file, filename);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Failed to read "${name}"`);
  }
  return data as PdfExtractionResponse;
}
