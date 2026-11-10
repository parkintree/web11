# -*- coding: utf-8 -*-
"""把生成的 docx 导出 PDF，并逐页渲染 PNG，便于检查分页与版式。"""

import sys
from pathlib import Path

import pymupdf
import win32com.client

ROOT = Path(__file__).resolve().parent.parent
DOCX = ROOT / "张衡 2024150167 AI协作日志W11.docx"
PDF = ROOT / "docs" / "_preview_w11.pdf"
PAGES = ROOT / "docs" / "preview"


def export_pdf() -> None:
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(str(DOCX))
        doc.ExportAsFixedFormat(str(PDF), 17)  # 17 = wdExportFormatPDF
        doc.Close(False)
    finally:
        word.Quit()


def render_pages() -> int:
    PAGES.mkdir(parents=True, exist_ok=True)
    for old in PAGES.glob("page-*.png"):
        old.unlink()
    pdf = pymupdf.open(PDF)
    for index, page in enumerate(pdf, start=1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6))
        pix.save(PAGES / f"page-{index:02d}.png")
    count = pdf.page_count
    pdf.close()
    return count


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    export_pdf()
    pages = render_pages()
    print(f"pages {pages}  pdf {PDF.stat().st_size} bytes")
