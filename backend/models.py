from pydantic import BaseModel
from typing import Optional


class EntryCreate(BaseModel):
    text: str
    title: Optional[str] = ""
    timestamp: Optional[str] = None


class EntryResponse(BaseModel):
    id: str
    text: str
    timestamp: str
    source: str  # "text" | "voice"
    title: str
    vector: Optional[list[float]] = None
    vector_preview: Optional[list[float]] = None


class SimilarEntry(BaseModel):
    id: str
    text: str
    timestamp: str
    source: str
    title: str
    score: float  # cosine similarity


class SimilarEntriesResponse(BaseModel):
    source_id: str
    similar: list[SimilarEntry]
