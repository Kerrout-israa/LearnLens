import logging

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.ai.client import AIError
from app.ai.generator import MAX_ANALYSIS_CHARS, analyze_content
from app.ai.schemas import ContentAnalysis
from app.models import Classroom
from app.schemas.analysis import AnalysisOut
from app.services.document_service import get_document_or_404

logger = logging.getLogger("learnlens")


def analyze_document(db: Session, document_id: int, force: bool = False) -> AnalysisOut:
    doc = get_document_or_404(db, document_id)
    if doc.status not in ("processed", "analyzed") or not doc.content.strip():
        raise HTTPException(422, "Document has no processed text to analyze")

    truncated = len(doc.content) > MAX_ANALYSIS_CHARS

    if doc.analysis_json and not force:
        try:
            analysis = ContentAnalysis.model_validate_json(doc.analysis_json)
            return AnalysisOut(
                document_id=doc.id, status=doc.status, cached=True,
                source_truncated=truncated, analysis=analysis,
            )
        except ValidationError:
            logger.warning("Stored analysis for document %s is invalid; re-analyzing", doc.id)

    classroom = db.get(Classroom, doc.classroom_id)
    try:
        analysis = analyze_content(
            doc.content,
            subject=classroom.subject if classroom else "unknown",
            level=classroom.level if classroom else "unknown",
        )
    except AIError as exc:
        raise HTTPException(exc.status_code, exc.message)
    except Exception:
        logger.exception("Content analysis failed (document %s)", doc.id)
        raise HTTPException(500, "Content analysis failed")

    doc.analysis_json = analysis.model_dump_json()
    doc.status = "analyzed"
    db.commit()
    return AnalysisOut(
        document_id=doc.id, status=doc.status, cached=False,
        source_truncated=truncated, analysis=analysis,
    )