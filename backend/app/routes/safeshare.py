import json
import re

import cv2
from fastapi import APIRouter, File, Form, UploadFile
from starlette.concurrency import run_in_threadpool

from app.common import NivaraError, read_image, to_data_url

from app.schemas import MarkedCopy, MarkResponse, ScanResponse

router = APIRouter()


ID_RE = re.compile(r"^[a-z0-9]{4}$")  # agreed with Member 2


def _embed(img, recipient_id: str):
    from app.imwatermark_safe import WatermarkEncoder

    encoder = WatermarkEncoder()
    encoder.set_watermark("bytes", recipient_id.encode("ascii"))  # 4 chars = 32 bits
    return encoder.encode(img, "dwtDctSvd")  # must match scan() in watermark_read.py


@router.post("/api/safeshare/mark", response_model=MarkResponse)
async def mark(image: UploadFile = File(...), recipients: str = Form(...)):
    data = await read_image(image)
    try:
        ids = json.loads(recipients)
    except json.JSONDecodeError:
        ids = None
    if not isinstance(ids, list) or not 0 < len(ids) <= 10 or not all(isinstance(i, str) and ID_RE.match(i) for i in ids):
        raise NivaraError(400, "bad_request", "recipients must be a JSON list of up to 10 four-character ids")

    copies = await run_in_threadpool(_mark_job, data, ids)
    return MarkResponse(copies=copies)


def _mark_job(data: bytes, ids: list[str]) -> list[MarkedCopy]:
    from app.imaging import HEAVY_JOB, READ_SIDE, decode_image

    with HEAVY_JOB:
        img = decode_image(data, READ_SIDE)  # copies are at most 2048 px; WhatsApp sends ~1600 px anyway
        if min(img.shape[:2]) < 256:
            raise NivaraError(400, "too_small", "The photo must be at least 256 x 256 pixels")
        return [MarkedCopy(recipient_id=rid, image=_marked_copy(img, rid)) for rid in ids]


def _marked_copy(img, rid: str) -> str:
    """JPEG 95 when the mark survives it (photos); lossless PNG otherwise (screenshots, flat graphics)."""
    from app.watermark_read import read_recipient

    marked = _embed(img, rid)
    _, buf = cv2.imencode(".jpg", marked, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if read_recipient(cv2.imdecode(buf, cv2.IMREAD_COLOR))[0] == rid:
        return to_data_url(buf.tobytes(), "image/jpeg")
    _, buf = cv2.imencode(".png", marked)
    return to_data_url(buf.tobytes(), "image/png")




@router.post("/api/safeshare/scan", response_model=ScanResponse)
async def scan(image: UploadFile = File(...)):
    data = await read_image(image)
    recipient_id, confidence = await run_in_threadpool(_scan_job, data)
    return ScanResponse(found=recipient_id is not None, recipient_id=recipient_id, confidence=confidence)


def _scan_job(data: bytes):
    from app.imaging import HEAVY_JOB, READ_SIDE, decode_image
    from app.watermark_read import read_recipient

    with HEAVY_JOB:
        # marked copies are never bigger than READ_SIDE, so this never shrinks one (shrinking would erase the mark)
        return read_recipient(decode_image(data, READ_SIDE))
