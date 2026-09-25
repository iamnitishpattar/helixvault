"""
HelixVault — 3-Tier Upload API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strategy selection (handled by frontend uploadManager.js):
  < 10 MB   → Direct upload  (/api/dna/encode, existing endpoint)
  10–500 MB → Chunked upload (/api/upload/chunk + /api/upload/finalize)
  > 500 MB  → S3 Multipart   (/api/upload/s3/init + presigned PUTs + /api/upload/s3/complete)

S3 is entirely optional. If AWS_ACCESS_KEY_ID / S3_BUCKET_NAME are not set in .env,
GET /api/upload/s3/config returns {s3_enabled: false} and the frontend falls back to
chunked upload for all file sizes.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from typing import Optional
import uuid
import os
import shutil
import time
import re
import json
import logging
from pathlib import Path

from db.models import User
from api.auth import get_current_user
from api.dna_storage import process_encode, task_store, _cleanup_expired_tasks, _validate_upload

logger = logging.getLogger("helixvault")
router = APIRouter()

# ── Constants ────────────────────────────────────────────────────────────────
CHUNK_SIZE_MAX_BYTES = 10 * 1024 * 1024   # 10 MB max per received chunk
MAX_TOTAL_CHUNKS     = 2000               # Practical limit: 2000 × 5 MB = ~10 GB
CHUNK_TTL_SECONDS    = 3600              # Orphaned chunk directories live 1 hour

# Temp storage: backend/temp_uploads/{user_id}_{upload_id}/chunk_00000 …
TEMP_DIR = Path(__file__).parent.parent / "temp_uploads"
TEMP_DIR.mkdir(exist_ok=True)

# UUID v4 validation pattern
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)

# ── S3 / boto3 optional import ───────────────────────────────────────────────
_BOTO3 = None
try:
    import boto3  # type: ignore
    _BOTO3 = boto3
    logger.info("boto3 available — S3 multipart upload enabled (if AWS creds provided).")
except ImportError:
    logger.info("boto3 not installed — S3 multipart upload disabled. Install with: pip install boto3")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_s3_cfg() -> Optional[dict]:
    """Returns S3 config dict if fully configured, else None."""
    if _BOTO3 is None:
        return None
    ak = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
    sk = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
    region = os.getenv("AWS_REGION", "ap-south-1").strip()
    bucket = os.getenv("S3_BUCKET_NAME", "").strip()
    expiry = int(os.getenv("S3_PRESIGN_EXPIRY_SECONDS", "3600"))
    if not (ak and sk and bucket):
        return None
    return {"access_key": ak, "secret_key": sk, "region": region, "bucket": bucket, "expiry": expiry}


def _s3_client():
    """Returns (boto3 s3 client, cfg). Raises 503 if S3 not configured."""
    cfg = _get_s3_cfg()
    if not cfg:
        raise HTTPException(status_code=503, detail="S3 is not configured on this server.")
    client = _BOTO3.client(
        "s3",
        aws_access_key_id=cfg["access_key"],
        aws_secret_access_key=cfg["secret_key"],
        region_name=cfg["region"],
    )
    return client, cfg


def _validate_upload_id(upload_id: str):
    if not _UUID_RE.match(upload_id.lower()):
        raise HTTPException(status_code=422, detail="Invalid upload_id — must be a UUID v4.")


def _cleanup_orphaned_chunks():
    """Remove chunk directories older than CHUNK_TTL_SECONDS (called on each chunk request)."""
    now = time.time()
    try:
        for d in TEMP_DIR.iterdir():
            if d.is_dir() and (now - d.stat().st_mtime) > CHUNK_TTL_SECONDS:
                shutil.rmtree(d, ignore_errors=True)
    except Exception as exc:
        logger.warning(f"Orphaned chunk cleanup error: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  CHUNKED UPLOAD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/chunk")
async def upload_chunk(
    upload_id: str = Form(..., description="Client-generated UUID v4 for this upload session"),
    chunk_index: int = Form(..., ge=0, le=1999),
    total_chunks: int = Form(..., ge=1, le=2000),
    filename: str = Form(..., min_length=1, max_length=255),
    chunk: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Receive a single chunk and persist it to the temp directory.

    The client sends chunks in any order; /finalize assembles them by index.
    Each upload session is namespaced to the authenticated user.
    """
    _validate_upload_id(upload_id)
    _cleanup_orphaned_chunks()

    chunk_data = await chunk.read()
    if len(chunk_data) > CHUNK_SIZE_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Chunk too large ({len(chunk_data) / (1024*1024):.1f} MB). Max {CHUNK_SIZE_MAX_BYTES // (1024*1024)} MB per chunk."
        )

    # Namespace by user to prevent cross-user directory collisions
    session_dir = TEMP_DIR / f"{current_user.id}_{upload_id}"
    session_dir.mkdir(exist_ok=True)

    chunk_path = session_dir / f"chunk_{chunk_index:05d}"
    chunk_path.write_bytes(chunk_data)

    logger.debug(f"Chunk {chunk_index + 1}/{total_chunks} saved for upload {upload_id} (user {current_user.id})")

    return {
        "received": True,
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "bytes_received": len(chunk_data),
    }


@router.post("/finalize")
async def finalize_chunked_upload(
    background_tasks: BackgroundTasks,
    upload_id: str = Form(...),
    filename: str = Form(..., min_length=1, max_length=255),
    total_chunks: int = Form(..., ge=1, le=2000),
    password: Optional[str] = Form(None, min_length=8, max_length=64),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    use_fountain: bool = Form(False),
    fountain_overhead: float = Form(1.5, ge=1.0, le=5.0),
    current_user: User = Depends(get_current_user),
):
    """
    Assemble all uploaded chunks in order, validate the resulting file,
    and kick off a background DNA-encoding task.

    Returns the same {task_id} response as /api/dna/encode so the existing
    frontend polling loop works unchanged.
    """
    _validate_upload_id(upload_id)

    session_dir = TEMP_DIR / f"{current_user.id}_{upload_id}"
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found or has expired. Please re-upload.")

    # Verify every chunk arrived
    missing = [i for i in range(total_chunks) if not (session_dir / f"chunk_{i:05d}").exists()]
    if missing:
        preview = ", ".join(str(i) for i in missing[:10])
        raise HTTPException(
            status_code=422,
            detail=f"Missing {len(missing)} chunk(s): [{preview}{'…' if len(missing) > 10 else ''}]. Re-upload the missing chunks."
        )

    # Assemble
    assembled = bytearray()
    for i in range(total_chunks):
        assembled.extend((session_dir / f"chunk_{i:05d}").read_bytes())
    contents = bytes(assembled)

    # Validate assembled file (size + path safety; MIME is unknown for assembled chunks so skip type check)
    _validate_upload(contents, None, filename)

    # Clean up temp files immediately — encoding runs in background
    shutil.rmtree(session_dir, ignore_errors=True)

    _cleanup_expired_tasks()
    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing", "created_at": time.time()}

    background_tasks.add_task(
        process_encode,
        task_id, contents, filename, password,
        use_error_correction, use_steganography,
        int(current_user.id),  # type: ignore
        use_fountain, fountain_overhead,
    )

    logger.info(
        f"Chunked upload finalized: '{filename}' "
        f"({len(contents) / (1024 * 1024):.1f} MB, {total_chunks} chunks) "
        f"→ task {task_id} (user {current_user.id})"
    )
    return {"task_id": task_id, "status": "processing", "assembled_mb": round(len(contents) / (1024 * 1024), 2)}


@router.delete("/{upload_id}")
async def cancel_upload(
    upload_id: str,
    current_user: User = Depends(get_current_user),
):
    """Cancel an in-progress chunked upload and delete all temp chunks."""
    _validate_upload_id(upload_id)
    session_dir = TEMP_DIR / f"{current_user.id}_{upload_id}"
    if session_dir.exists():
        shutil.rmtree(session_dir, ignore_errors=True)
        logger.info(f"Upload {upload_id} cancelled by user {current_user.id}")
        return {"cancelled": True, "upload_id": upload_id}
    return {"cancelled": False, "detail": "Upload session not found."}


# ═══════════════════════════════════════════════════════════════════════════════
#  S3 MULTIPART PRESIGNED URL ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/s3/config")
async def get_s3_config():
    """
    Returns the upload strategy configuration.
    The frontend calls this once on load to decide which upload path to use.
    """
    cfg = _get_s3_cfg()
    return {
        "s3_enabled": cfg is not None,
        "direct_threshold_mb": 10,
        "chunked_threshold_mb": 500,
        "chunk_size_mb": 5,
        "max_file_mb": 5000,
    }


@router.post("/s3/init")
async def init_s3_multipart(
    filename: str = Form(..., min_length=1, max_length=255),
    total_parts: int = Form(..., ge=1, le=10000),
    content_type: str = Form("application/octet-stream"),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate an S3 multipart upload and return one presigned PUT URL per part.

    The browser uploads each part directly to S3 — your server never handles
    the raw video bytes. After all parts are uploaded, call /s3/complete.
    """
    s3, cfg = _s3_client()

    # Sanitise filename for use as S3 key
    safe_name = re.sub(r"[^\w.\-]", "_", filename)
    object_key = f"helixvault-uploads/{current_user.id}/{uuid.uuid4().hex}/{safe_name}"

    try:
        response = s3.create_multipart_upload(
            Bucket=cfg["bucket"],
            Key=object_key,
            ContentType=content_type,
            Metadata={
                "user_id": str(current_user.id),
                "original_filename": filename,
            },
        )
        s3_upload_id = response["UploadId"]

        presigned_urls = [
            {
                "part_number": part_num,
                "url": s3.generate_presigned_url(
                    "upload_part",
                    Params={
                        "Bucket": cfg["bucket"],
                        "Key": object_key,
                        "UploadId": s3_upload_id,
                        "PartNumber": part_num,
                    },
                    ExpiresIn=cfg["expiry"],
                ),
            }
            for part_num in range(1, total_parts + 1)
        ]

        logger.info(
            f"S3 multipart initiated: {object_key} "
            f"({total_parts} parts, expiry {cfg['expiry']}s) for user {current_user.id}"
        )
        return {
            "s3_upload_id": s3_upload_id,
            "object_key": object_key,
            "presigned_urls": presigned_urls,
        }

    except Exception as exc:
        logger.error(f"S3 multipart init failed: {exc}", exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to initiate S3 upload. Check AWS configuration.")


@router.post("/s3/complete")
async def complete_s3_multipart(
    background_tasks: BackgroundTasks,
    s3_upload_id: str = Form(...),
    object_key: str = Form(...),
    filename: str = Form(..., min_length=1, max_length=255),
    parts_json: str = Form(..., description='JSON array: [{"part_number": 1, "etag": "abc123"}, …]'),
    password: Optional[str] = Form(None, min_length=8, max_length=64),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    use_fountain: bool = Form(False),
    fountain_overhead: float = Form(1.5, ge=1.0, le=5.0),
    current_user: User = Depends(get_current_user),
):
    """
    Complete the S3 multipart upload (S3 assembles parts server-side),
    download the assembled file, and trigger DNA encoding.

    Returns {task_id} — same contract as /api/dna/encode.
    """
    s3, cfg = _s3_client()

    # Parse and validate parts list
    try:
        raw_parts = json.loads(parts_json)
        multipart_parts = sorted(
            [{"PartNumber": int(p["part_number"]), "ETag": str(p["etag"])} for p in raw_parts],
            key=lambda p: p["PartNumber"],
        )
        if not multipart_parts:
            raise ValueError("Empty parts list")
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid parts_json. Expected [{part_number, etag}, …].")

    try:
        # Tell S3 to assemble all parts into the final object
        s3.complete_multipart_upload(
            Bucket=cfg["bucket"],
            Key=object_key,
            UploadId=s3_upload_id,
            MultipartUpload={"Parts": multipart_parts},
        )
        logger.info(f"S3 multipart completed: {object_key}")

        # Download the assembled object for encoding
        s3_obj = s3.get_object(Bucket=cfg["bucket"], Key=object_key)
        contents = s3_obj["Body"].read()
        logger.info(f"Downloaded {len(contents) / (1024*1024):.1f} MB from S3: {object_key}")

    except Exception as exc:
        logger.error(f"S3 complete/download failed: {exc}", exc_info=True)
        raise HTTPException(status_code=502, detail="S3 assembly or download failed. Please retry the upload.")

    # Validate then kick off background encoding
    _validate_upload(contents, None, filename)
    _cleanup_expired_tasks()

    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing", "created_at": time.time()}

    background_tasks.add_task(
        process_encode,
        task_id, contents, filename, password,
        use_error_correction, use_steganography,
        int(current_user.id),  # type: ignore
        use_fountain, fountain_overhead,
    )

    logger.info(f"S3 upload → encode task {task_id} created for '{filename}' (user {current_user.id})")
    return {"task_id": task_id, "status": "processing"}
