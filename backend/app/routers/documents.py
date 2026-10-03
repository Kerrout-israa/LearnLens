from fastapi import APIRouter, Depends, File, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.analysis import AnalysisOut
from app.schemas.document import DocumentDetail, DocumentUploadOut
from app.services import analysis_service, document_service

router = APIRouter(tags=["documents"])


@router.post(
    "/classrooms/{classroom_id}/documents",
    response_model=DocumentUploadOut,
    status_code=201,
)
def upload_document(
    classroom_id: int,
    response: Response,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # read at most limit+1 bytes so oversized files are detected without loading them fully
    data = file.file.read(settings.max_pdf_mb * 1024 * 1024 + 1)
    doc, created = document_service.create_document(
        db, classroom_id, file.filename or "", data
    )
    if not created:
        response.status_code = 200  # identical document already processed
    return doc


@router.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document(document_id: int, db: Session = Depends(get_db)):
    return document_service.get_document_or_404(db, document_id)


@router.post("/documents/{document_id}/analyze", response_model=AnalysisOut)
def analyze_document(
    document_id: int, force: bool = False, db: Session = Depends(get_db)
):
    return analysis_service.analyze_document(db, document_id, force)