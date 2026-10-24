
import json

from fastapi import APIRouter, File, Form, UploadFile

from app.common import NivaraError, read_image, to_data_url
from app.schemas import MarkedCopy, MarkResponse, ScanResponse

router = APIRouter()


@router.post("/api/safeshare/mark", response_model=MarkResponse)
async def mark(
    image: UploadFile = File(...),
    recipients: str = Form(...),
):
    data = await read_image(image)

    try:
        ids = json.loads(recipients)
    except json.JSONDecodeError:
        ids = None

    if (
        not isinstance(ids, list)
        or not ids
        or not all(isinstance(i, str) for i in ids)
    ):
        raise NivaraError(
            400, "bad_request", "recipients must be a JSON list of ids"
        )

    # ---- MOCK: returns the same image unmarked; real watermark in Part 6 ----
    url = to_data_url(data, image.content_type)
    return MarkResponse(
        copies=[
            MarkedCopy(recipient_id=i, image=url)
            for i in ids
        ]
    )


@router.post("/api/safeshare/scan", response_model=ScanResponse)
async def scan(image: UploadFile = File(...)):
    await read_image(image)

    # ---- MOCK: real watermark reading in Part 11 ----
    return ScanResponse(found=False)
