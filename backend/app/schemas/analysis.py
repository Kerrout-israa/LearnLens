from pydantic import BaseModel

from app.ai.schemas import ContentAnalysis


class AnalysisOut(BaseModel):
    document_id: int
    status: str
    cached: bool
    source_truncated: bool
    analysis: ContentAnalysis