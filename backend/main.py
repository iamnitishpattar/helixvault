from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import uvicorn
import time
import re

from api.dna_storage import router as dna_router
from core.rate_limiter import limiter
from api.bio_integration import router as bio_router
from api.auth import router as auth_router
from api.developer import router as dev_router
from api.compute_api import router as compute_router
from api.plasmid_api import router as plasmid_router
from db.database import engine, Base
from db import models  # noqa: F401

import logging
import sys

# Configure structured enterprise logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("helixvault")
logger.info("Starting HelixVault Enterprise Backend...")

# Track server start time for uptime reporting
SERVER_START_TIME = time.time()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HelixVault API",
    description=(
        "**HelixVault** — Next-Gen DNA Data Storage Platform.\n\n"
        "Converts digital files into synthesized biological DNA sequences using:\n"
        "- **Base-3 Encoding** (homopolymer-free)\n"
        "- **AES-256 Encryption**\n"
        "- **Reed-Solomon Error Correction** (corrects up to 25 byte errors per chunk)\n"
        "- **DNA Steganography** (hides payload inside *E. coli* genome)"
    ),
    version="2.0.0",
    contact={"name": "HelixVault", "url": "https://helixvault-omega.vercel.app"},
    license_info={"name": "MIT"},
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


_UNSAFE_ERROR_DETAIL_RE = re.compile(
    r"traceback|stack trace|\bFile \"|\b[A-Za-z]:[\\/]|/(app|home|users|usr|var|tmp|mnt|etc|opt|workspace)/|"
    r"\b(sqlite3|sqlalchemy|psycopg2|psycopg|operationalerror|integrityerror|programmingerror|databaseerror)\b|"
    r"\b(select|insert|update|delete|alter|drop)\s+.+\s+(from|into|table|where)\b",
    re.IGNORECASE,
)

GENERIC_SERVER_ERROR = "An internal server error occurred. Please try again later."
GENERIC_VALIDATION_ERROR = "Invalid request. Please check your input and try again."
GENERIC_DATABASE_ERROR = "The service is temporarily unavailable. Please try again later."


def _contains_internal_error_detail(detail):
    if detail is None:
        return False
    text = detail if isinstance(detail, str) else repr(detail)
    return bool(_UNSAFE_ERROR_DETAIL_RE.search(text))


def _safe_http_detail(exc: HTTPException):
    if exc.status_code >= 500:
        return GENERIC_SERVER_ERROR
    if _contains_internal_error_detail(exc.detail):
        return GENERIC_SERVER_ERROR
    return exc.detail


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = _safe_http_detail(exc)
    if detail != exc.detail:
        logger.warning(
            "Sanitized HTTP %s response on %s %s: %r",
            exc.status_code,
            request.method,
            request.url.path,
            exc.detail,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": GENERIC_DATABASE_ERROR}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": GENERIC_VALIDATION_ERROR}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": GENERIC_SERVER_ERROR}
    )

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
        "https://helixvault-omega.vercel.app",  # Production Vercel frontend
    ],
    allow_origin_regex="https?://.*",  # Allow local network IPs and tunnel URLs (ngrok, cloudflare, localtunnel)
    allow_credentials=True,  # Allow cookies for secure auth
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dna_router, prefix="/api/dna", tags=["DNA Storage"])
app.include_router(bio_router, prefix="/api/bio", tags=["Bio Integration"])
app.include_router(dev_router, prefix="/api/developer", tags=["Developer DaaS"])
app.include_router(compute_router, prefix="/api/compute", tags=["Live Bio-Compute & AI Co-Pilot"])
app.include_router(plasmid_router, prefix="/api/plasmid", tags=["Synthetic Biology Plasmid Workbench"])


@app.get("/")
def read_root():
    return {"message": "Welcome to HelixVault API", "version": "2.0.0", "status": "operational"}


@app.get("/health", tags=["System"])
def health_check():
    """
    System health check endpoint.
    Returns DB connectivity status, server uptime, and version info.
    Useful for monitoring, load balancers, and CI/CD deployment verification.
    """
    from db.database import SessionLocal
    from sqlalchemy import text

    db_status = "healthy"
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception:
        logger.error("Health check DB connectivity failure", exc_info=True)
        db_status = "unhealthy"
    finally:
        if db is not None:
            db.close()

    uptime_seconds = round(time.time() - SERVER_START_TIME)
    uptime_str = f"{uptime_seconds // 3600}h {(uptime_seconds % 3600) // 60}m {uptime_seconds % 60}s"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "version": "2.0.0",
        "database": db_status,
        "uptime": uptime_str,
        "uptime_seconds": uptime_seconds,
        "encoding_algorithm": "Base-3 (Homopolymer-Free)",
        "encryption": "AES-256-CBC + PBKDF2-HMAC-SHA256",
        "error_correction": "Reed-Solomon (50 ECC bytes, corrects up to 25 byte errors/chunk)",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
