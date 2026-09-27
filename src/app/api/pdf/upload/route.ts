import { NextRequest, NextResponse } from "next/server";
import { extractPdf } from "@/lib/pdf-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractPdf(buffer);

    return NextResponse.json({
      text: extracted.text,
      pageTexts: extracted.pageTexts,
      pageCount: extracted.pageCount,
      warnings: extracted.warnings,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    const message = error instanceof Error ? error.message : "Failed to read PDF";
    const safe =
      message.includes("PDF") || message.includes("Python") || message.includes("API key")
        ? message
        : "Failed to read PDF";
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
