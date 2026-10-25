import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))  # lets us import "app"

from app.imwatermark_safe import WatermarkDecoder, WatermarkEncoder  # noqa: E402 (plain imwatermark needs PyTorch)

METHOD = "dwtDctSvd"  # same method as safeshare.py mark() and watermark_read.py

img = cv2.imread(str(ROOT / "samples" / "public" / "share_test.jpg"))
if img is None:
    sys.exit("Put a photo at samples/public/share_test.jpg")

enc = WatermarkEncoder()
enc.set_watermark("bytes", b"r1a9")
marked = enc.encode(img, METHOD)


def jpeg(i, q):
    _, b = cv2.imencode(".jpg", i, [cv2.IMWRITE_JPEG_QUALITY, q])
    return cv2.imdecode(b, cv2.IMREAD_COLOR)


def read(i):
    try:
        return bytes(WatermarkDecoder("bytes", 32).decode(i, METHOD)).decode("ascii")
    except Exception:
        return ""


h, w = marked.shape[:2]
tests = {
    "As is": marked,
    "JPEG 90": jpeg(marked, 90),
    "JPEG 70": jpeg(marked, 70),
    "JPEG 50": jpeg(marked, 50),
    "Resized 50%": cv2.resize(marked, (w // 2, h // 2)),
    "Cropped 5%": marked[int(h * 0.025) : int(h * 0.975), int(w * 0.025) : int(w * 0.975)],
}
for name, t in tests.items():
    print(f"{name:12} {'FOUND' if read(t) == 'r1a9' else 'lost'}")
