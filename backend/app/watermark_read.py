import re

import cv2
import numpy as np

ID_RE = re.compile(r"^[a-z0-9]{4}$")  # agreed with Member 1: 4 lowercase letters/digits
MIN_SIDE = 256  # dwtDct needs at least 256x256


def _decode_once(img: np.ndarray) -> str | None:
    from app.imwatermark_safe import WatermarkDecoder  # imported here so the app runs without it

    raw = WatermarkDecoder("bytes", 32).decode(img, "dwtDctSvd")
    try:
        text = bytes(raw).decode("ascii")
    except (UnicodeDecodeError, TypeError, ValueError):
        return None
    return text if ID_RE.match(text) else None


def read_recipient(img: np.ndarray) -> tuple[str | None, str | None]:
    if min(img.shape[:2]) < MIN_SIDE:
        return None, None
    first = _decode_once(img)
    second = _decode_once(cv2.GaussianBlur(img, (3, 3), 0))
    if first and first == second:
        return first, "high"
    if first or second:
        return first or second, "low"
    return None, None