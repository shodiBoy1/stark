import { NextRequest, NextResponse } from "next/server";
import { renderPages, ocrWithVision, isValidPDF } from "@/lib/pdf-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidPDF(buffer)) {
      return NextResponse.json({ error: "Invalid PDF file format" }, { status: 400 });
    }

    const { pageTexts: basicTexts, ocrPages, pageCount } = await renderPages(buffer, file.name || "rescan.pdf");

    let ocrTexts: string[];
    if (ocrPages.length === 0) {
      console.log(`Rescan: all ${pageCount} pages have good native text — skipping OCR`);
      ocrTexts = basicTexts;
    } else {
      console.log(`Rescan: OCR needed for ${ocrPages.length}/${pageCount} pages — running parallel Vision OCR`);
      ocrTexts = await ocrWithVision(ocrPages, basicTexts);
    }

    const fullText = ocrTexts.join("\n\n");

    return NextResponse.json({
      text: fullText,
      pageTexts: ocrTexts,
      pageCount,
    });
  } catch (error) {
    console.error("PDF rescan error:", error);
    return NextResponse.json(
      { error: "Failed to rescan PDF" },
      { status: 500 },
    );
  }
}
