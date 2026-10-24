
import secrets

from fastapi import APIRouter, File, UploadFile

from app.common import TINY_PNG, now_utc, read_image, sha256_hex
from app.routes.verify import VERIFY_STORE
from app.schemas import CompareResponse, Region

router = APIRouter()


@router.post("/api/compare", response_model=CompareResponse)
async def compare(
    fake: UploadFile = File(...),
    original: UploadFile = File(...),
):
    fake_bytes = await read_image(fake)
    original_bytes = await read_image(original)

    # ---- MOCK: Member 2 replaces this block with OpenCV + SSIM in Part 7 ----
    verify_id = secrets.token_urlsafe(6)
    checked_at = now_utc()
    fake_hash = sha256_hex(fake_bytes)

    VERIFY_STORE[verify_id] = {
        "verify_id": verify_id,
        "verdict": "manipulated",
        "similarity": 92.4,
        "fake_sha256": fake_hash,
        "blurred_thumb": TINY_PNG,
        "checked_at": checked_at,
    }

    return CompareResponse(
        verdict="manipulated",
        similarity=92.4,
        heatmap_png=TINY_PNG,
        regions=[Region(x=120, y=80, w=60, h=90)],
        aligned=True,
        fake_sha256=fake_hash,
        original_sha256=sha256_hex(original_bytes),
        verify_id=verify_id,
        checked_at=checked_at,
    )
    # ---- END MOCK ----
