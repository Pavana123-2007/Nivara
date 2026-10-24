
from typing import Literal, Optional

from pydantic import BaseModel


class Region(BaseModel):
    x: int
    y: int
    w: int
    h: int


class CompareResponse(BaseModel):
    verdict: Literal["manipulated", "no_major_edits"]
    similarity: float
    heatmap_png: str
    regions: list[Region]
    aligned: bool
    fake_sha256: str
    original_sha256: str
    verify_id: Optional[str]
    checked_at: str


class VerifyResponse(BaseModel):
    verify_id: str
    verdict: Literal["manipulated"]
    similarity: float
    fake_sha256: str
    blurred_thumb: str
    checked_at: str


class AlertRequest(BaseModel):
    chat_id: str
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class AlertResponse(BaseModel):
    sent: bool


class MarkedCopy(BaseModel):
    recipient_id: str
    image: str


class MarkResponse(BaseModel):
    copies: list[MarkedCopy]


class ScanResponse(BaseModel):
    found: bool
    recipient_id: Optional[str] = None
    confidence: Optional[Literal["high", "low"]] = None
