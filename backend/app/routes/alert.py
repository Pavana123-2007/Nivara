
from fastapi import APIRouter

from app.common import NivaraError
from app.schemas import AlertRequest, AlertResponse

router = APIRouter()


@router.post("/api/alert", response_model=AlertResponse)
async def send_alert(body: AlertRequest):
    if not body.chat_id.strip():
        raise NivaraError(400, "bad_request", "chat_id is required")

    # ---- MOCK: Member 1 replaces this with a real Telegram call in Part 5 ----
    who = body.name or "Your contact"
    print(f"[MOCK ALERT] to chat {body.chat_id}: Nivara alert: {who} needs help now")
    return AlertResponse(sent=True)
    # ---- END MOCK ----
