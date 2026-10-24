import csv
import sys
from pathlib import Path

import cv2

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))  # lets us import "app"

from app.imaging import run_comparison  # noqa: E402

SAMPLES = BACKEND.parent / "samples" / "public"
OUT = BACKEND / "tests" / "results"


def jpeg(img, quality):
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return cv2.imdecode(buf, cv2.IMREAD_COLOR)


def resize(img, factor):
    return cv2.resize(img, None, fx=factor, fy=factor, interpolation=cv2.INTER_AREA)


def crop(img, fraction):
    h, w = img.shape[:2]
    dy, dx = int(h * fraction / 2), int(w * fraction / 2)
    return img[dy : h - dy, dx : w - dx]


def whatsapp_like(img):
    h, w = img.shape[:2]
    scale = min(1.0, 1600 / max(h, w))
    return jpeg(resize(img, scale) if scale < 1 else img, 60)


CASES = {
    "As is": lambda i: i,
    "JPEG quality 90": lambda i: jpeg(i, 90),
    "JPEG quality 70": lambda i: jpeg(i, 70),
    "JPEG quality 50": lambda i: jpeg(i, 50),
    "Resized to 50%": lambda i: resize(i, 0.5),
    "Cropped 10%": lambda i: crop(i, 0.10),
    "WhatsApp-like (1600 px, q60)": whatsapp_like,
    "Screenshot-like (80%, q80)": lambda i: jpeg(resize(i, 0.8), 80),
}
CONTROL_CASES = ["JPEG quality 70", "WhatsApp-like (1600 px, q60)"]


def main():
    originals = sorted(SAMPLES.glob("*_original.*"))
    if not originals:
        print(f"No pairs found in {SAMPLES}. Add <name>_original.jpg and <name>_fake.jpg")
        return

    rows = []
    for orig_path in originals:
        name = orig_path.stem.replace("_original", "")
        fakes = list(SAMPLES.glob(f"{name}_fake.*"))
        if not fakes:
            print(f"Skipping {name}: no {name}_fake file")
            continue
        orig = cv2.imread(str(orig_path))
        fake = cv2.imread(str(fakes[0]))

        for case, transform in CASES.items():
            r = run_comparison(transform(fake), orig)
            caught = "Yes" if r.verdict == "manipulated" else "MISSED"
            rows.append([name, "Edited fake", case, caught, r.similarity])
            print(f"{name:12} fake     {case:30} {caught:8} {r.similarity}%")

        # Control: the untouched original, only compressed. Should NOT be flagged.
        for case in CONTROL_CASES:
            r = run_comparison(CASES[case](orig), orig)
            result = "FALSE ALARM" if r.verdict == "manipulated" else "Correct (no edits)"
            rows.append([name, "Untouched original", case, result, r.similarity])
            print(f"{name:12} control  {case:30} {result:8} {r.similarity}%")

    OUT.mkdir(parents=True, exist_ok=True)
    header = ["Sample", "Image", "Test", "Result", "Similarity %"]
    with open(OUT / "robustness.csv", "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows([header, *rows])

    md = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * len(header)) + " |"]
    md += ["| " + " | ".join(str(c) for c in row) + " |" for row in rows]
    fakes_total = [r for r in rows if r[1] == "Edited fake"]
    caught_total = sum(1 for r in fakes_total if r[3] == "Yes")
    controls = [r for r in rows if r[1] == "Untouched original"]
    false_alarms = sum(1 for r in controls if r[3] == "FALSE ALARM")
    summary = (
        f"Caught {caught_total} of {len(fakes_total)} edited fakes; "
        f"{false_alarms} false alarms in {len(controls)} untouched originals."
    )
    (OUT / "robustness.md").write_text(summary + "\n\n" + "\n".join(md), encoding="utf-8")
    print("\n" + summary)
    print(f"Saved: {OUT / 'robustness.csv'} and {OUT / 'robustness.md'}")


if __name__ == "__main__":
    main()