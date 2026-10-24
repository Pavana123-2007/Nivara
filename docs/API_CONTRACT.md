
# Nivara API Contract

## General rules

- **Base URL:** `http://localhost:8000` locally; the Hugging Face URL after deploy (Part 14).
- All responses are JSON. Images go up as `multipart/form-data`; images come back as data URLs (`data:image/png;base64,...`).
- Max upload 10 MB per image; types jpg, png, webp.
- Every error looks the same: `{"error": {"code": "bad_image", "message": "Could not read the image"}}` with status 400 (bad input), 404 (not found), 413 (too big), 429 (too many requests) or 500.
- Times are UTC in ISO format: `2026-10-24T18:30:00Z`.

**What runs where:** Most of Nivara never touches the server, which is the privacy story judges will ask about.

| Feature | Runs on | Owner |
|---|---|---|
| Calculator, secret code, shake, decoy PIN | Phone only | Member 1 |
| Evidence vault (AES-GCM, SHA-256) | Phone only | Member 1 |
| Coded alert | Server (`/api/alert`) | Member 1 |
| Prove it's fake | Server (`/api/compare`) | Member 2 |
| Verified Manipulated page | Server (`/api/verify`) | Member 2 |
| Evidence report PDF, takedown complaint, help finder | Phone only | Member 2 |
| Safe Share mark / scan (stretch) | Server (`/api/safeshare/*`) | M1 / M2 |

---

## GET /api/health

Checks that the server is up.

Response:

`{"status": "ok"}`

## POST /api/compare (Member 2)

Request (`multipart/form-data`): `fake` = the suspected fake image file, `original` = her original image file.

Response 200:

```json
{
  "verdict": "manipulated",
  "similarity": 92.4,
  "heatmap_png": "data:image/png;base64,iVBORw0KGgo...",
  "regions": [{"x": 120, "y": 80, "w": 60, "h": 90}],
  "aligned": true,
  "fake_sha256": "9f86d081884c7d65...",
  "original_sha256": "2c26b46b68ffc68f...",
  "verify_id": "k3J9xQ2a",
  "checked_at": "2026-10-24T18:30:00Z"
}
```

- `verdict` is `"manipulated"` or `"no_major_edits"`.
- `similarity` is 0–100 (one decimal).
- `regions` are pixel boxes in the original's coordinates; an empty list when nothing changed.
- `aligned` is false if alignment failed and a plain resize was used.
- `verify_id` is null when the verdict is `"no_major_edits"`.
- The server keeps NOTHING from this call except `/api/verify` needs, and never the original.

## GET /api/verify/{verify_id} (Member 2)

Response 200:

```json
{
  "verify_id": "k3J9xQ2a",
  "verdict": "manipulated",
  "similarity": 92.4,
  "fake_sha256": "9f86d081884c7d65...",
  "blurred_thumb": "data:image/jpeg;base64,/9j/4AAQ...",
  "checked_at": "2026-10-24T18:30:00Z"
}
```

Unknown id → 404 with `{"error": {"code": "not_found", ...}}`. There is no field for the original, ever.

## POST /api/alert (Member 1)

Request (JSON):

```json
{
  "chat_id": "123456789",
  "name": "Lakshmi",
  "lat": null,
  "lng": null
}
```

- `chat_id` = the trusted contact's Telegram chat id (saved in her vault).
- `name` is optional; `lat` / `lng` are only sent if she turned location on.
- The server writes the real message itself, e.g. "Nivara alert: Lakshmi needs help now (18:30 UTC)." plus a map link if a location was sent.

Response 200: `{"sent": true}`. If Telegram rejects it: 400 with `{"error": {"code": "telegram_failed", ...}}`. More than 5 alerts a minute from one device: 429.

## POST /api/safeshare/mark (stretch, Member 1)

Request (`multipart/form-data`): `image` = the photo; `recipients` = a JSON string of short ids, e.g. `["r1a9","r7kq"]`. The ids are made in the browser; names never leave her phone.

Response 200:

```json
{
  "copies": [
    {
      "recipient_id": "r1a9",
      "image": "data:image/png;base64,..."
    }
  ]
}
```

## POST /api/safeshare/scan (stretch, Member 2)

Request (`multipart/form-data`): `image` = the leaked photo.

Response 200:

```json
{
  "found": true,
  "recipient_id": "r1a9",
  "confidence": "high"
}
```

Confidence is `"high"` or `"low"`. Nothing found → `{"found": false, "recipient_id": null, "confidence": null}`.

---

## Freeze check

Read every field above, agree, then Member 1 commits `docs/API_CONTRACT.md` and both members use this file as the reference.
