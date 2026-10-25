
import os

from dotenv import load_dotenv

load_dotenv()  # reads backend/.env before anything else

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.common import NivaraError
from app.routes import alert, compare, safeshare, verify

app = FastAPI(title="Nivara API", version="0.1.0")

origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,"
        "https://localhost:5173,"
        "https://localhost:5174,"
        "https://192.168.0.146:5173,"
        "https://192.168.0.146:5174",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # The app running on this computer, on any port: Vite moves to 5174, 5175... when 5173 is busy
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NivaraError)
async def nivara_error_handler(request: Request, exc: NivaraError):
    return JSONResponse(
        status_code=exc.status,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "bad_request",
                "message": "Missing or invalid fields",
            }
        },
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(compare.router)
app.include_router(verify.router)
app.include_router(alert.router)
app.include_router(safeshare.router)
