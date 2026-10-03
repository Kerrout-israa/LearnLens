from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import User


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    subject: Mapped[str] = mapped_column(String(100))
    level: Mapped[str] = mapped_column(String(100))
    join_code: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    teacher: Mapped[User] = relationship(foreign_keys=[teacher_id])
    students: Mapped[list[User]] = relationship(secondary="classroom_students")


class ClassroomStudent(Base):
    __tablename__ = "classroom_students"

    classroom_id: Mapped[int] = mapped_column(
        ForeignKey("classrooms.id"), primary_key=True
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)