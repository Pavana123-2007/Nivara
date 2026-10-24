from fastapi import APIRouter, File, UploadFile
from starlette.concurrency import run_in_threadpool

from app.common import now_utc, read_image, sha256_hex
from app.imaging import blurred_thumb, decode_image, run_comparison
from app.schemas import CompareResponse, Region
from app.storage import save_verification

router = APIRouter()


@router.post("/api/compare", response_model=CompareResponse)
async def compare(fake: UploadFile = File(...), original: UploadFile = File(...)):
    fake_bytes = await read_image(fake)
    original_bytes = await read_image(original)
    fake_img = decode_image(fake_bytes)
    orig_img = decode_image(original_bytes)

    result = await run_in_threadpool(run_comparison, fake_img, orig_img)

    checked_at = now_utc()
    fake_hash = sha256_hex(fake_bytes)
    verify_id = None
    if result.verdict == "manipulated":
        verify_id = save_verification(
            {
                "verdict": "manipulated",
                "similarity": result.similarity,
                "fake_sha256": fake_hash,
                "blurred_thumb": blurred_thumb(fake_img),
                "checked_at": checked_at,
            }
        )

    return CompareResponse(
        verdict=result.verdict,
        similarity=result.similarity,
        heatmap_png=result.heatmap_png,
        regions=[Region(**r) for r in result.regions],
        aligned=result.aligned,
        fake_sha256=fake_hash,
        original_sha256=sha256_hex(original_bytes),
        verify_id=verify_id,
        checked_at=checked_at,
    )