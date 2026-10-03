from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserOut


class ClassroomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    subject: str = Field(min_length=1, max_length=100)
    level: str = Field(min_length=1, max_length=100)
    teacher_id: int


class JoinRequest(BaseModel):
    student_id: int
    join_code: str = Field(min_length=4, max_length=8)


class ClassroomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subject: str
    level: str
    join_code: str
    teacher_id: int
    created_at: datetime


class ClassroomDetail(ClassroomOut):
    teacher: UserOut
    students: list[UserOut]