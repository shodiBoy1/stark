#!/usr/bin/env python3
"""Render PDF pages to JPEG base64 images using pypdfium2.

Two-pass approach:
  1. Extract native text from ALL pages (fast, no rendering).
  2. Only render to JPEG the pages with < 100 chars of native text.
"""

import json
import sys
import os
import base64
import io

MIN_CHARS = 100


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)

    try:
        import pypdfium2 as pdfium

        pdf = pdfium.PdfDocument(pdf_path)
        num_pages = len(pdf)

        # Pass 1: extract native text from every page (no rendering)
        page_texts = []
        for i in range(num_pages):
            page = pdf[i]
            tp = page.get_textpage()
            text = tp.get_text_range().strip()
            page_texts.append(text)

        # Pass 2: render only sparse pages (< MIN_CHARS of native text)
        ocr_pages = []
        for i in range(num_pages):
            if len(page_texts[i]) < MIN_CHARS:
                page = pdf[i]
                bitmap = page.render(scale=0.75)
                img = bitmap.to_pil()
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=60)
                b64 = base64.b64encode(buf.getvalue()).decode()
                ocr_pages.append({
                    "index": i,
                    "image": f"data:image/jpeg;base64,{b64}",
                })

        result = {
            "pageTexts": page_texts,
            "ocrPages": ocr_pages,
            "pageCount": num_pages,
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
