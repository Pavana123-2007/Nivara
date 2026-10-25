"""Member 2 - Clues lite: single-image clues for when there is no original.
These are clues, not proof. Nothing is stored."""

import io

from PIL import Image


def _cbor_text(data: bytes, pos: int):
    """Read one short text value from the label's data (best effort)."""
    if pos >= len(data):
        return None
    if data[pos] == 0xC0:  # date-time marker
        pos += 1
    if pos >= len(data):
        return None
    head = data[pos]
    if 0x60 <= head <= 0x77:
        n, start = head - 0x60, pos + 1
    elif head == 0x78 and pos + 1 < len(data):
        n, start = data[pos + 1], pos + 2
    else:
        return None
    try:
        return data[start:start + n].decode("utf-8")
    except UnicodeDecodeError:
        return None


def _after(data: bytes, key: bytes, sub: bytes, window: int = 200):
    i = data.find(key)
    if i < 0:
        return None
    j = data.find(sub, i, i + window)
    if j < 0:
        return None
    return _cbor_text(data, j + len(sub))


def _label_details(data: bytes) -> dict:
    """What the AI label says: which tool made the image, and when."""
    return {
        "tool": _after(data, b"softwareAgent", b"name"),
        "tool_version": _after(data, b"softwareAgent", b"version"),
        "issuer": _after(data, b"claim_generator_info", b"name"),
        "created": _after(data, b"c2pa.created", b"when"),
    }


def _clean(value):
    """Phones often pad EXIF text with empty (null) characters; remove them."""
    if value is None:
        return None
    text = str(value).replace("\x00", "").strip()
    return text or None


def _metadata(data: bytes) -> dict:
    info = {
        "format": None, "width": None, "height": None,
        "camera": None, "taken_at": None, "software": None,
        "has_exif": False, "ai_label": False, "ai_prompt": False,
        "label": None,
    }
    try:
        img = Image.open(io.BytesIO(data))
        info["format"] = img.format
        info["width"], info["height"] = img.size
        exif = img.getexif()
        if exif and len(exif) > 0:
            info["has_exif"] = True
            make, model = exif.get(271), exif.get(272)
            cam = " ".join(x for x in (_clean(make), _clean(model)) if x)
            info["camera"] = cam or None
            software = _clean(exif.get(305))
            info["software"] = software[:80] if software else None
            sub = exif.get_ifd(0x8769)
            info["taken_at"] = _clean(sub.get(36867)) or _clean(exif.get(306))
        text_keys = {str(k).lower() for k in (img.info or {}).keys()}
        # Stable Diffusion / ComfyUI tools write their settings into PNG text
        if text_keys & {"parameters", "prompt", "workflow"}:
            info["ai_prompt"] = True
        if not info["software"] and "software" in (img.info or {}):
            software = _clean(img.info["software"])
            info["software"] = software[:80] if software else None
    except Exception:
        pass
    low = data.lower()
    # Content Credentials (C2PA) or the IPTC "made by AI" source type
    if b"c2pa" in low or b"trainedalgorithmicmedia" in low:
        info["ai_label"] = True
        try:
            info["label"] = _label_details(data)
        except Exception:
            info["label"] = None
    return info


def analyze_clues(data: bytes) -> dict:
    meta = _metadata(data)
    label = meta["label"] or {}

    # One row per check, for the checklist on screen.
    # status: "alert" (points to AI), "warn" (worth noting), "ok" (normal sign), "clear" (nothing found)
    checks = []

    if meta["ai_label"]:
        tool = label.get("tool")
        version = label.get("tool_version")
        parts = []
        if tool:
            parts.append(f"Made with {tool}" + (f" ({version})" if version else ""))
        if label.get("issuer"):
            parts.append(f"label issued by {label['issuer']}")
        if label.get("created"):
            parts.append(f"created {label['created'][:16].replace('T', ' ')} UTC")
        detail = "; ".join(parts) or "The tool that made it marked it as AI-made or AI-edited."
        checks.append({"name": "AI label (Content Credentials)", "status": "alert", "detail": detail})
    else:
        checks.append({
            "name": "AI label (Content Credentials)",
            "status": "clear",
            "detail": "None found. WhatsApp, Instagram and screenshots remove these labels.",
        })

    checks.append({
        "name": "AI generator settings",
        "status": "alert" if meta["ai_prompt"] else "clear",
        "detail": "The file contains an AI image-generator prompt." if meta["ai_prompt"] else "None found.",
    })

    checks.append({
        "name": "Editing software",
        "status": "warn" if meta["software"] else "clear",
        "detail": f"Saved with {meta['software']}." if meta["software"] else "None recorded.",
    })

    if meta["camera"]:
        when = f", taken {meta['taken_at']}" if meta["taken_at"] else ""
        checks.append({"name": "Camera information", "status": "ok", "detail": f"{meta['camera']}{when}."})
    else:
        checks.append({
            "name": "Camera information",
            "status": "warn",
            "detail": "Missing. Common in AI-made and edited images, but WhatsApp also removes it from real photos.",
        })

    if meta["ai_label"] or meta["ai_prompt"]:
        level = "strong"
    elif meta["software"]:
        level = "some"
    else:
        level = "none"

    clues = [f"{c['name']}: {c['detail']}" for c in checks if c["status"] in ("alert", "warn")]

    return {"level": level, "checks": checks, "clues": clues, "metadata": meta}