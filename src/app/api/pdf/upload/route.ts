import { NextRequest, NextResponse } from "next/server";
import { renderPages, ocrWithVision, isValidPDF } from "@/lib/pdf-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Invalid PDF file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidPDF(buffer)) {
      return NextResponse.json({ error: "Invalid PDF file format" }, { status: 400 });
    }

    // Step 1: Render pages — only sparse pages get JPEG images
    const { pageTexts: basicTexts, ocrPages, pageCount } = await renderPages(buffer, file.name);

    // Step 2: OCR only pages that need it (< 100 chars native text)
    let ocrTexts: string[];
    if (ocrPages.length === 0) {
      console.log(`PDF has good native text on all ${pageCount} pages — skipping OCR`);
      ocrTexts = basicTexts;
    } else {
      console.log(`OCR needed for ${ocrPages.length}/${pageCount} pages — running parallel Vision OCR`);
      ocrTexts = await ocrWithVision(ocrPages, basicTexts);
    }

    const fullText = ocrTexts.join("\n\n");

    return NextResponse.json({
      text: fullText,
      pageTexts: ocrTexts,
      pageCount,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract PDF content" },
      { status: 500 },
    );
  }
}
