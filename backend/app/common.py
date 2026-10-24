
import base64
import hashlib
from datetime import datetime, timezone

from fastapi import UploadFile

MAX_BYTES = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

# 1x1 placeholder image used by the mock endpoints
TINY_PNG = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "YAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


class NivaraError(Exception):
    """Raise this anywhere; main.py turns it into the contract's error JSON."""

    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message


async def read_image(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise NivaraError(
            400, "bad_image", "Only JPG, PNG or WEBP images are allowed"
        )

    data = await file.read()

    if not data:
        raise NivaraError(400, "bad_image", "The image file is empty")

    if len(data) > MAX_BYTES:
        raise NivaraError(413, "too_large", "Image is larger than 10 MB")

    return data


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def to_data_url(data: bytes, mime: str = "image/png") -> str:
    return f"data:{mime};base64," + base64.b64encode(data).decode()
