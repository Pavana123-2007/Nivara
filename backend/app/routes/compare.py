from fastapi import APIRouter, File, UploadFile
from starlette.concurrency import run_in_threadpool

from app.clues import analyze_clues
from app.common import now_utc, read_image, sha256_hex
from app.imaging import HEAVY_JOB, READ_SIDE, blurred_thumb, decode_image, longest_side, run_comparison
from app.schemas import CompareResponse, Region
from app.storage import save_verification

router = APIRouter()


@router.post("/api/compare", response_model=CompareResponse)
async def compare(fake: UploadFile = File(...), original: UploadFile = File(...)):
    fake_bytes = await read_image(fake)
    original_bytes = await read_image(original)

    result, thumb, read_side = await run_in_threadpool(_compare_job, fake_bytes, original_bytes)

    # regions are in the original's full-size pixels, even when it was read smaller
    back = (longest_side(original_bytes) or read_side) / read_side
    regions = [Region(**{k: round(v * back) for k, v in r.items()}) for r in result.regions]

    checked_at = now_utc()
    fake_hash = sha256_hex(fake_bytes)
    verify_id = None
    if result.verdict == "manipulated":
        verify_id = save_verification(
            {
                "verdict": "manipulated",
                "similarity": result.similarity,
                "fake_sha256": fake_hash,
                "blurred_thumb": thumb,
                "checked_at": checked_at,
            }
        )

    return CompareResponse(
        verdict=result.verdict,
        similarity=result.similarity,
        heatmap_png=result.heatmap_png,
        regions=regions,
        aligned=result.aligned,
        fake_sha256=fake_hash,
        original_sha256=sha256_hex(original_bytes),
        verify_id=verify_id,
        checked_at=checked_at,
    )


def _compare_job(fake_bytes: bytes, original_bytes: bytes):
    with HEAVY_JOB:
        fake_img = decode_image(fake_bytes, READ_SIDE)
        orig_img = decode_image(original_bytes, READ_SIDE)
        result = run_comparison(fake_img, orig_img)
        thumb = blurred_thumb(fake_img) if result.verdict == "manipulated" else None
        return result, thumb, max(orig_img.shape[:2])


# Member 2 - Clues lite: single-image clues when no original is found. Nothing is stored.
@router.post("/api/clues")
async def clues(fake: UploadFile = File(...)):
    data = await read_image(fake)
    decode_image(data, READ_SIDE)  # same image checks and error messages as /api/compare
    return await run_in_threadpool(analyze_clues, data)