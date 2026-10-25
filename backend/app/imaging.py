import io
import threading
from dataclasses import dataclass, field

import cv2
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

from app.common import NivaraError, to_data_url

# ---- Tuning knobs (Part 13a tells you if these need changing) ----
MAX_SIDE = 1024        # work size; bigger images are shrunk first
DIFF_THRESHOLD = 0.45  # how different a patch must be to count as edited (0-1)
MIN_REGION = 0.002     # ignore edited blobs smaller than 0.2% of the image
MIN_MATCHES = 15       # alignment needs at least this many matching points
MIN_VALID = 0.30       # alignment must cover at least 30% of the original
MIN_COLOUR_DIFF = 12   # also require a visible colour change (ignores JPEG noise on flat walls)

# The free server has 512 MB: a 12 MP phone photo used ~360 MB, a 48 MP one or two at once crashed it.
READ_SIDE = 2048                  # photos are read at most this big (still 2x the work size)
HEAVY_JOB = threading.Lock()      # one image job at a time; a double tap waits instead of crashing

@dataclass
class CompareResult:
    verdict: str
    similarity: float
    heatmap_png: str
    regions: list = field(default_factory=list)
    aligned: bool = True


def longest_side(data: bytes) -> int:
    """Reads only the file header, so it is cheap even for huge photos. 0 if unknown."""
    try:
        with Image.open(io.BytesIO(data)) as im:
            return max(im.size)
    except Exception:
        return 0


def decode_image(data: bytes, max_side: int | None = None) -> np.ndarray:
    flag = cv2.IMREAD_COLOR
    if max_side:
        side = longest_side(data)
        # JPEGs can be decoded straight at 1/2, 1/4 or 1/8 size, never building the full picture
        for reduced, n in ((cv2.IMREAD_REDUCED_COLOR_8, 8), (cv2.IMREAD_REDUCED_COLOR_4, 4), (cv2.IMREAD_REDUCED_COLOR_2, 2)):
            if side // n >= max_side:
                flag = reduced
                break
    img = cv2.imdecode(np.frombuffer(data, np.uint8), flag)
    if img is None:
        raise NivaraError(400, "bad_image", "Could not read the image")
    return _shrink(img, max_side) if max_side else img


def _shrink(img: np.ndarray, max_side: int = MAX_SIDE) -> np.ndarray:
    h, w = img.shape[:2]
    scale = max_side / max(h, w)
    if scale >= 1:
        return img
    return cv2.resize(img, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)


def _align(fake: np.ndarray, orig: np.ndarray):
    """Returns (fake warped onto the original, mask of valid pixels, aligned?)."""
    h, w = orig.shape[:2]
    fallback = (
        cv2.resize(fake, (w, h), interpolation=cv2.INTER_AREA),
        np.full((h, w), 255, np.uint8),
        False,
    )

    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(fake, cv2.COLOR_BGR2GRAY), None)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY), None)
    if d1 is None or d2 is None or len(k1) < MIN_MATCHES or len(k2) < MIN_MATCHES:
        return fallback

    matches = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2)
    matches = sorted(matches, key=lambda m: m.distance)[:500]
    if len(matches) < MIN_MATCHES:
        return fallback

    src = np.float32([k1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst = np.float32([k2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    H, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
    if H is None or int(inliers.sum()) < MIN_MATCHES:
        return fallback

    warped = cv2.warpPerspective(fake, H, (w, h))
    valid = cv2.warpPerspective(np.full(fake.shape[:2], 255, np.uint8), H, (w, h))
    valid = cv2.erode(valid, np.ones((7, 7), np.uint8))  # drop the ragged border
    if (valid > 0).mean() < MIN_VALID:
        return fallback
    return warped, valid, True


def run_comparison(fake_img: np.ndarray, orig_img: np.ndarray) -> CompareResult:
    orig = _shrink(orig_img)
    fake = _shrink(fake_img)
    back = orig_img.shape[1] / orig.shape[1]  # to report boxes in full-size pixels

    aligned, valid, ok = _align(fake, orig)

    # Blur slightly (hides JPEG noise), then compare all 3 LAB channels
    a = cv2.cvtColor(cv2.GaussianBlur(aligned, (5, 5), 0), cv2.COLOR_BGR2LAB)
    o = cv2.cvtColor(cv2.GaussianBlur(orig, (5, 5), 0), cv2.COLOR_BGR2LAB)
    _, ssim_map = structural_similarity(o, a, channel_axis=2, full=True, data_range=255)
    dissim = np.clip(1.0 - ssim_map, 0, 1).max(axis=2)
    dissim[valid == 0] = 0

    # Turn the difference map into clean blobs
    colour_diff = cv2.absdiff(o, a).max(axis=2)
    raw = ((dissim > DIFF_THRESHOLD) & (colour_diff > MIN_COLOUR_DIFF)).astype(np.uint8) * 255
    kernel = np.ones((5, 5), np.uint8)
    raw = cv2.morphologyEx(raw, cv2.MORPH_OPEN, kernel)
    raw = cv2.dilate(raw, kernel, iterations=2)
    contours, _ = cv2.findContours(raw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = orig.shape[:2]
    clean = np.zeros_like(raw)
    boxes = []
    for c in contours:
        if cv2.contourArea(c) < MIN_REGION * h * w:
            continue
        cv2.drawContours(clean, [c], -1, 255, thickness=cv2.FILLED)
        boxes.append(cv2.boundingRect(c))
    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    boxes = boxes[:5]

    valid_px = max(int((valid > 0).sum()), 1)
    changed = int((clean > 0).sum()) / valid_px
    similarity = round(100 * (1 - changed), 1)
    verdict = "manipulated" if boxes else "no_major_edits"

    # Heatmap drawn on HER ORIGINAL, never on the fake
    heat = cv2.applyColorMap((dissim * 255).astype(np.uint8), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(orig, 0.5, heat, 0.5, 0)
    out = orig.copy()
    out[clean > 0] = overlay[clean > 0]
    for x, y, bw, bh in boxes:
        cv2.rectangle(out, (x, y), (x + bw, y + bh), (0, 0, 255), 2)
    _, png = cv2.imencode(".png", _shrink(out, 800))

    regions = [
        {"x": round(x * back), "y": round(y * back), "w": round(bw * back), "h": round(bh * back)}
        for x, y, bw, bh in boxes
    ]
    return CompareResult(verdict, similarity, to_data_url(png.tobytes()), regions, ok)


def blurred_thumb(img: np.ndarray) -> str:
    """A tiny, heavily blurred preview for the public page: nothing recognisable."""
    small = _shrink(img, 160)
    for _ in range(3):
        small = cv2.GaussianBlur(small, (31, 31), 0)
    _, jpg = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return to_data_url(jpg.tobytes(), "image/jpeg")