from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentUploadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    classroom_id: int
    filename: str
    status: str
    created_at: datetime
    content_length: int


class DocumentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    classroom_id: int
    filename: str
    status: str
    created_at: datetime
    error_message: str | None = None
    content_length: int
    content: str