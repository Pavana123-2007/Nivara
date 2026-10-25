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
    from app.imaging import decode_image

    data = await read_image(image)
    try:
        ids = json.loads(recipients)
    except json.JSONDecodeError:
        ids = None
    if not isinstance(ids, list) or not 0 < len(ids) <= 10 or not all(isinstance(i, str) and ID_RE.match(i) for i in ids):
        raise NivaraError(400, "bad_request", "recipients must be a JSON list of up to 10 four-character ids")

    img = decode_image(data)
    if min(img.shape[:2]) < 256:
        raise NivaraError(400, "too_small", "The photo must be at least 256 x 256 pixels")

    copies = []
    for rid in ids:
        data_url = await run_in_threadpool(_marked_copy, img, rid)
        copies.append(MarkedCopy(recipient_id=rid, image=data_url))
    return MarkResponse(copies=copies)


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
    from app.imaging import decode_image
    from app.watermark_read import read_recipient

    data = await read_image(image)
    recipient_id, confidence = read_recipient(decode_image(data))
    return ScanResponse(found=recipient_id is not None, recipient_id=recipient_id, confidence=confidence)
