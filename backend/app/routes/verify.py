
from fastapi import APIRouter

from app.common import NivaraError
from app.schemas import VerifyResponse

router = APIRouter()

# MOCK storage: in memory, wiped on every restart. Member 2 replaces this in Part 10.
VERIFY_STORE: dict[str, dict] = {}


@router.get("/api/verify/{verify_id}", response_model=VerifyResponse)
async def get_verify(verify_id: str):
    record = VERIFY_STORE.get(verify_id)
    if record is None:
        raise NivaraError(404, "not_found", "No verification found for this link")
    return record
