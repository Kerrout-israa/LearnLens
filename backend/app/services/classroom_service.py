import secrets

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Classroom, ClassroomStudent, User
from app.schemas.classroom import ClassroomCreate, JoinRequest
from app.schemas.user import UserCreate

# No 0/O/1/I to avoid confusion when students type the code
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def create_user(db: Session, data: UserCreate) -> User:
    user = User(name=data.name.strip(), role=data.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, f"User {user_id} not found")
    return user


def get_classroom_or_404(db: Session, classroom_id: int) -> Classroom:
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(404, f"Classroom {classroom_id} not found")
    return classroom


def _generate_join_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        exists = db.scalar(select(Classroom.id).where(Classroom.join_code == code))
        if not exists:
            return code
    raise HTTPException(500, "Could not generate a unique join code")


def create_classroom(db: Session, data: ClassroomCreate) -> Classroom:
    teacher = _get_user(db, data.teacher_id)
    if teacher.role != "teacher":
        raise HTTPException(403, "Only teachers can create classrooms")

    classroom = Classroom(
        name=data.name.strip(),
        subject=data.subject.strip(),
        level=data.level.strip(),
        teacher_id=teacher.id,
        join_code=_generate_join_code(db),
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


def join_classroom(db: Session, classroom_id: int, data: JoinRequest) -> Classroom:
    classroom = get_classroom_or_404(db, classroom_id)
    student = _get_user(db, data.student_id)

    if student.role != "student":
        raise HTTPException(403, "Only students can join a classroom")
    if data.join_code.strip().upper() != classroom.join_code:
        raise HTTPException(403, "Invalid join code")

    already = db.get(ClassroomStudent, (classroom.id, student.id))
    if already:
        raise HTTPException(409, "Student already joined this classroom")

    db.add(ClassroomStudent(classroom_id=classroom.id, student_id=student.id))
    db.commit()
    db.refresh(classroom)
    return classroom