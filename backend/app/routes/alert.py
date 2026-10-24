import os

import httpx
from fastapi import APIRouter

from app.common import NivaraError
from app.schemas import AlertRequest, AlertResponse

router = APIRouter()


@router.post("/api/alert", response_model=AlertResponse)
async def send_alert(body: AlertRequest):
    chat_id = body.chat_id.strip()

    if not chat_id:
        raise NivaraError(400, "bad_request", "chat_id is required")

    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()

    if not token or token == "put-your-bot-token-here":
        raise NivaraError(
            500,
            "configuration_error",
            "Telegram bot is not configured. Check your backend .env file.",
        )

    who = body.name or "Your contact"
    message = f"Nivara alert: {who} needs help now"

    if body.lat is not None and body.lng is not None:
        message += (
            f"\nLocation: "
            f"https://www.google.com/maps?q={body.lat},{body.lng}"
        )

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": message,
                },
            )

    except httpx.RequestError as exc:
        # Print the actual error in the backend terminal for debugging.
        print(
            f"Telegram connection error: "
            f"{type(exc).__name__}: {exc}"
        )
        raise NivaraError(
            502,
            "telegram_unreachable",
            "Could not connect to Telegram. Check the backend terminal.",
        )

    try:
        result = response.json()
    except ValueError:
        result = {}

    if not response.is_success or not result.get("ok"):
        print(
            f"Telegram API error: HTTP {response.status_code}; "
            f"{result.get('description', 'Unknown Telegram API error')}"
        )
        raise NivaraError(
            502,
            "telegram_error",
            "Telegram could not deliver the alert. "
            "Check the bot token and recipient chat ID.",
        )

    return AlertResponse(sent=True)