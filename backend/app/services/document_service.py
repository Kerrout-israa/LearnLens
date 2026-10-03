import logging
import os

import fitz  # PyMuPDF
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Document
from app.services.classroom_service import get_classroom_or_404
from app.utils.hashing import sha256_bytes
from app.utils.text_cleaning import clean_pages

logger = logging.getLogger("learnlens")

MIN_TEXT_CHARS = 50


class PDFError(Exception):
    """Unreadable / corrupted / protected PDF (client-side problem)."""


def _safe_filename(filename: str) -> str:
    name = os.path.basename((filename or "").replace("\\", "/")).strip()
    return name[:255] or "document.pdf"


def _validate_upload(filename: str, data: bytes) -> None:
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")
    if not data:
        raise HTTPException(400, "Uploaded file is empty")
    if len(data) > settings.max_pdf_mb * 1024 * 1024:
        raise HTTPException(413, f"PDF is larger than {settings.max_pdf_mb} MB")
    if b"%PDF-" not in data[:1024]:
        raise HTTPException(400, "File is not a valid PDF")


def _save_file(data: bytes, file_hash: str) -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)
    path = os.path.join(settings.upload_dir, f"{file_hash}.pdf")
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(data)


def _extract_pages(data: bytes) -> list[str]:
    try:
        pdf = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise PDFError("PDF is unreadable or corrupted") from exc
    with pdf:
        if pdf.needs_pass:
            raise PDFError("PDF is password-protected")
        if pdf.page_count == 0:
            raise PDFError("PDF has no pages")
        try:
            return [page.get_text("text", sort=True) for page in pdf]
        except Exception as exc:
            raise PDFError("PDF text could not be read") from exc


def _mark_failed(db: Session, doc: Document, message: str) -> None:
    db.rollback()
    doc.status = "failed"
    doc.error_message = message
    db.commit()


def create_document(
    db: Session, classroom_id: int, filename: str, data: bytes
) -> tuple[Document, bool]:
    """Returns (document, created). created=False means an identical processed
    document already exists in this classroom and is returned as-is."""
    get_classroom_or_404(db, classroom_id)
    filename = _safe_filename(filename)
    _validate_upload(filename, data)

    file_hash = sha256_bytes(data)
    existing = db.scalar(
        select(Document).where(
            Document.classroom_id == classroom_id,
            Document.file_hash == file_hash,
            Document.status.in_(["processed", "analyzed"]),
        )
    )
    if existing:
        return existing, False

    try:
        _save_file(data, file_hash)
    except OSError:
        logger.exception("Could not save upload %s", filename)
        raise HTTPException(500, "Could not save the uploaded file")

    doc = Document(
        classroom_id=classroom_id,
        filename=filename,
        file_hash=file_hash,
        markdown_content="",
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        text = clean_pages(_extract_pages(data))
    except PDFError as exc:
        _mark_failed(db, doc, str(exc))
        raise HTTPException(400, str(exc))
    except Exception:
        logger.exception("Document processing failed (document %s)", doc.id)
        _mark_failed(db, doc, "Unexpected processing error")
        raise HTTPException(500, "Document processing failed")

    if len(text) < MIN_TEXT_CHARS:
        msg = "No extractable text found (the PDF may be scanned or image-only)"
        _mark_failed(db, doc, msg)
        raise HTTPException(422, msg)

    doc.markdown_content = text
    doc.status = "processed"
    db.commit()
    db.refresh(doc)
    return doc, True


def get_document_or_404(db: Session, document_id: int) -> Document:
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, f"Document {document_id} not found")
    return doc