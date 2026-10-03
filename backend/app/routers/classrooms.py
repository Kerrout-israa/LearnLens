from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomDetail,
    ClassroomOut,
    JoinRequest,
)
from app.services import classroom_service

router = APIRouter(prefix="/classrooms", tags=["classrooms"])


@router.post("", response_model=ClassroomOut, status_code=201)
def create_classroom(data: ClassroomCreate, db: Session = Depends(get_db)):
    return classroom_service.create_classroom(db, data)


@router.post("/{classroom_id}/join", response_model=ClassroomDetail)
def join_classroom(classroom_id: int, data: JoinRequest, db: Session = Depends(get_db)):
    return classroom_service.join_classroom(db, classroom_id, data)


@router.get("/{classroom_id}", response_model=ClassroomDetail)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    return classroom_service.get_classroom_or_404(db, classroom_id)