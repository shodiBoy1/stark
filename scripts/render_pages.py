#!/usr/bin/env python3
"""Extract PDF text, or render a small set of pages for OCR.

Usage:
  render_pages.py <pdf> text
  render_pages.py <pdf> render <comma-separated page indexes>
"""

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


def fail(message: str) -> None:
    print(json.dumps({"error": message}))
    sys.exit(1)


def open_pdf(pdf_path: str):
    if not os.path.isfile(pdf_path):
        fail("PDF file was not found")
    try:
        import pypdfium2 as pdfium
    except ImportError:
        fail("Python environment is missing pypdfium2. Run pnpm setup and restart the server.")
    return pdfium.PdfDocument(pdf_path)


def extract_text(pdf_path: str) -> None:
    try:
        pdf = open_pdf(pdf_path)
        page_texts = []
        for i in range(len(pdf)):
            textpage = pdf[i].get_textpage()
            page_texts.append(clean_text(textpage.get_text_range() or ""))

        sparse = [i for i, text in enumerate(page_texts) if len(text) < MIN_CHARS]
        partial = [i for i in sparse if len(page_texts[i]) > 0]
        empty = [i for i in sparse if len(page_texts[i]) == 0]

        print(json.dumps({
            "pageTexts": page_texts,
            "sparse": partial + empty,
            "pageCount": len(pdf),
        }))
    except SystemExit:
        raise
    except Exception as exc:
        fail(f"Could not read this PDF: {exc}")


def render_pages(pdf_path: str, indexes: list[int]) -> None:
    try:
        pdf = open_pdf(pdf_path)
        total = len(pdf)
        ocr_pages = []
        for i in indexes:
            if i < 0 or i >= total:
                continue
            bitmap = pdf[i].render(scale=1.1)
            image = bitmap.to_pil()
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=65)
            encoded = base64.b64encode(buf.getvalue()).decode()
            ocr_pages.append({
                "index": i,
                "image": f"data:image/jpeg;base64,{encoded}",
            })
        print(json.dumps({"ocrPages": ocr_pages}))
    except SystemExit:
        raise
    except Exception as exc:
        fail(f"Could not render PDF pages: {exc}")


def main() -> None:
    if len(sys.argv) < 3:
        fail("Expected a PDF path and a mode")

    pdf_path = sys.argv[1]
    mode = sys.argv[2]
    if mode == "text":
        extract_text(pdf_path)
        return
    if mode == "render":
        raw = sys.argv[3] if len(sys.argv) > 3 else ""
        indexes = []
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                indexes.append(int(part))
            except ValueError:
                fail("Page indexes must be numbers")
        render_pages(pdf_path, indexes)
        return
    fail("Unknown mode")


if __name__ == "__main__":
    main()
