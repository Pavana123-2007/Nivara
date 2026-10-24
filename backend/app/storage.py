import json
import os
import secrets
import threading
from pathlib import Path

STORE_FILE = Path(os.getenv("STORAGE_DIR", "storage")) / "verify.json"
_lock = threading.Lock()


def _read() -> dict:
    if not STORE_FILE.exists():
        return {}
    try:
        return json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_verification(record: dict) -> str:
    with _lock:
        data = _read()
        verify_id = secrets.token_urlsafe(6)
        while verify_id in data:
            verify_id = secrets.token_urlsafe(6)
        data[verify_id] = {"verify_id": verify_id, **record}
        STORE_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = STORE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(data), encoding="utf-8")
        tmp.replace(STORE_FILE)
        return verify_id


def get_verification(verify_id: str) -> dict | None:
    with _lock:
        return _read().get(verify_id)