#!/usr/bin/env python3
"""Extract PDF text and render sparse pages for OCR."""

import json
import sys
import os
import base64
import io
import re

MIN_CHARS = 100


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = text.replace("\u00ad", "")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 120
    ocr_cap = int(sys.argv[3]) if len(sys.argv) > 3 else 16

    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": "PDF file was not found"}))
        sys.exit(1)

    try:
        import pypdfium2 as pdfium
    except ImportError:
        print(json.dumps({"error": "Python environment is missing pypdfium2. Run pnpm setup and restart the server."}))
        sys.exit(1)

    try:
        pdf = pdfium.PdfDocument(pdf_path)
        total_pages = len(pdf)
        processed = min(total_pages, max_pages)

        page_texts = []
        for i in range(processed):
            page = pdf[i]
            textpage = page.get_textpage()
            page_texts.append(clean_text(textpage.get_text_range() or ""))

        sparse = [i for i in range(processed) if len(page_texts[i]) < MIN_CHARS]
        partial = [i for i in sparse if len(page_texts[i]) > 0]
        empty = [i for i in sparse if len(page_texts[i]) == 0]
        ordered = partial + empty
        selected = ordered[:ocr_cap]
        skipped = ordered[ocr_cap:]

        ocr_pages = []
        for i in selected:
            page = pdf[i]
            bitmap = page.render(scale=1.1)
            image = bitmap.to_pil()
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=65)
            encoded = base64.b64encode(buf.getvalue()).decode()
            ocr_pages.append({
                "index": i,
                "image": f"data:image/jpeg;base64,{encoded}",
            })

        warnings = []
        if total_pages > processed:
            warnings.append(
                f"Only the first {processed} of {total_pages} pages were read. Split the PDF if you need the rest."
            )
        if skipped:
            shown = ", ".join(str(i + 1) for i in skipped[:12])
            extra = "" if len(skipped) <= 12 else f" and {len(skipped) - 12} more"
            warnings.append(
                f"OCR ran on {len(selected)} sparse pages. Pages {shown}{extra} kept their extracted text only."
            )

        print(json.dumps({
            "pageTexts": page_texts,
            "ocrPages": ocr_pages,
            "pageCount": total_pages,
            "processedPages": processed,
            "warnings": warnings,
        }))
    except Exception as exc:
        print(json.dumps({"error": f"Could not read this PDF: {exc}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
