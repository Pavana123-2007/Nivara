from fastapi import APIRouter

from app.common import NivaraError
from app.schemas import VerifyResponse
from app.storage import get_verification

router = APIRouter()


@router.get("/api/verify/{verify_id}", response_model=VerifyResponse)
async def get_verify(verify_id: str):
    record = get_verification(verify_id)
    if record is None:
        raise NivaraError(404, "not_found", "No verification found for this link")
    return record