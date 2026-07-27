from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks, Request, Path
import re
from sqlalchemy.orm import Session
from sqlalchemy import func
import base64
from typing import Optional
import uuid
import time
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings

# ── File validation constants ────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/msword",  # .doc
    "video/mp4", "video/webm", "video/quicktime",
}
TASK_TTL_SECONDS = 600  # tasks expire after 10 minutes

from core.encoder import encode_data_to_dna, decode_dna_to_data
from core.bio_utils import (
    calculate_metrics,
    generate_fasta,
    generate_genbank,
    extract_sequence_from_file
)
from core.security import encrypt_data, decrypt_data
from core.error_correction import (
    apply_error_correction,
    remove_error_correction,
    get_ecc_info
)
from core.media_encoder import apply_media_compression, remove_media_compression
from core.fountain_codes import apply_fountain_code, remove_fountain_code
from core.constraints import apply_biological_constraints, remove_biological_constraints
from core.steganography import embed_in_host, extract_from_host
from core.bio_validator import validate_sequence_biosecurity
from db.database import get_db, SessionLocal
from db.models import EncodedFile, User
from api.auth import get_current_user

import logging
logger = logging.getLogger("helixvault")

router = APIRouter()

# In-memory dictionary for task status (for enterprise PoC)
# Each entry: { "status": ..., "created_at": float, ... }
task_store = {}


def _cleanup_expired_tasks():
    """Remove tasks older than TASK_TTL_SECONDS to prevent memory leaks."""
    now = time.time()
    expired = [tid for tid, t in task_store.items() if now - t.get("created_at", now) > TASK_TTL_SECONDS]
    for tid in expired:
        del task_store[tid]


def _validate_upload(contents: bytes, content_type: Optional[str], filename: str):
    """Raise HTTPException if the file violates size or type constraints."""
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB. "
                   f"Received {len(contents) / (1024*1024):.1f} MB."
        )
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{content_type}'. Allowed: PDF, PNG, JPG, GIF, WEBP, TXT, DOCX, MP4."
        )
    if not filename or len(filename) > 255:
        raise HTTPException(
            status_code=422,
            detail="Invalid filename length. Must be between 1 and 255 characters."
        )
    if re.search(r"(\.\./|\.\.\\|/|\\)", filename):
        raise HTTPException(
            status_code=422,
            detail="Filename contains invalid path characters."
        )

def process_encode(task_id: str, contents: bytes, filename: str, password: Optional[str], 
                   use_error_correction: bool, use_steganography: bool, user_id: int, use_fountain: bool = False, fountain_overhead: float = 1.5):
    try:
        logger.info(f"Task {task_id}: Starting encoding for {filename}")
        original_size = len(contents)

        if password:
            contents = encrypt_data(contents, password)
            
        contents = apply_media_compression(contents, filename)
            
        if use_fountain:
            contents = apply_fountain_code(contents, overhead=fountain_overhead)
        elif use_error_correction:
            contents = apply_error_correction(contents)

        dna_seq = encode_data_to_dna(contents, filename)
        
        dna_seq = apply_biological_constraints(dna_seq)

        if use_steganography:
            dna_seq = embed_in_host(dna_seq)

        biosecurity_report = validate_sequence_biosecurity(dna_seq)
        metrics = calculate_metrics(dna_seq)

        fasta_str = generate_fasta(dna_seq, sequence_id=f"HV_{filename.replace('.', '_')}")
        genbank_str = generate_genbank(dna_seq, sequence_id=f"HV_{filename.replace('.', '_')}")

        db = SessionLocal()
        try:
            new_file = EncodedFile(
                filename=filename,
                user_id=user_id,
                original_size_bytes=original_size,
                dna_length_bp=metrics["length"],
                gc_content=metrics["gc_content"],
                is_encrypted=bool(password),
                has_error_correction=use_error_correction,
                has_steganography=use_steganography,
                dna_sequence=dna_seq,
                text_preview=filename
            )
            db.add(new_file)
            db.commit()
            db.refresh(new_file)
            file_id = new_file.id
        finally:
            db.close()

        task_store[task_id] = {
            "status": "success",
            "filename": filename,
            "dna_sequence": dna_seq,
            "metrics": metrics,
            "biosecurity_report": biosecurity_report,
            "fasta": fasta_str,
            "genbank": genbank_str,
            "id": file_id
        }
        
        if use_error_correction:
            task_store[task_id]["ecc_info"] = get_ecc_info()
            
        logger.info(f"Task {task_id}: Completed successfully")
    except Exception as e:
        logger.error(f"Task {task_id}: Failed with error: {e}", exc_info=True)
        task_store[task_id] = {"status": "failed", "error": "File encoding failed due to an internal error or invalid format."}

def process_decode(task_id: str, contents: bytes, filename: str, password: Optional[str], 
                   use_error_correction: bool, use_steganography: bool, use_fountain: bool = False):
    try:
        logger.info(f"Task {task_id}: Starting decoding for {filename}")
        dna_sequence = extract_sequence_from_file(contents, filename)

        if use_steganography:
            dna_sequence = extract_from_host(dna_sequence)
            
        dna_sequence = remove_biological_constraints(dna_sequence)

        data_bytes, orig_filename = decode_dna_to_data(dna_sequence)

        if use_fountain:
            data_bytes = remove_fountain_code(data_bytes)
        elif use_error_correction:
            data_bytes = remove_error_correction(data_bytes)
            
        data_bytes = remove_media_compression(data_bytes)

        if password:
            data_bytes = decrypt_data(data_bytes, password)
        elif "salt" not in orig_filename:
            pass

        b64_data = base64.b64encode(data_bytes).decode('utf-8')

        task_store[task_id] = {
            "status": "success",
            "filename": orig_filename,
            "file_data_b64": b64_data
        }
        logger.info(f"Task {task_id}: Completed successfully")
    except Exception as e:
        logger.error(f"Task {task_id}: Failed with error: {e}", exc_info=True)
        task_store[task_id] = {"status": "failed", "error": "File decoding failed. Incorrect password, corrupted sequence, or invalid format."}

@router.post("/encode")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
async def encode_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None, min_length=8, max_length=64, description="Encryption password"),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    use_fountain: bool = Form(False),
    fountain_overhead: float = Form(1.5, ge=1.0, le=5.0),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    _validate_upload(contents, file.content_type, file.filename or "")
    _cleanup_expired_tasks()
    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_encode, task_id, contents, file.filename or "unknown", password, use_error_correction, use_steganography, int(current_user.id), use_fountain, fountain_overhead)  # type: ignore
    return {"task_id": task_id, "status": "processing"}

@router.post("/decode")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
async def decode_dna(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None, min_length=8, max_length=64, description="Decryption password"),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    use_fountain: bool = Form(False),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    _cleanup_expired_tasks()
    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing", "created_at": time.time()}
    background_tasks.add_task(process_decode, task_id, contents, file.filename or "unknown", password, use_error_correction, use_steganography, use_fountain)
    return {"task_id": task_id, "status": "processing"}

@router.get("/status/{task_id}")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def get_task_status(
    request: Request,
    task_id: str = Path(..., min_length=36, max_length=36, pattern=r"^[0-9a-fA-F\-]{36}$", description="Task ID UUID")
):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_store[task_id]

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(EncodedFile).filter(EncodedFile.user_id == current_user.id).order_by(EncodedFile.created_at.desc()).all()
    return files


@router.get("/stats")
def get_user_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns aggregate statistics for the authenticated user.
    Powers the live Dashboard metrics panel.
    """
    files = db.query(EncodedFile).filter(EncodedFile.user_id == current_user.id).all()
    if not files:
        return {
            "total_files": 0,
            "total_bp_encoded": 0,
            "avg_gc_content": 0.0,
            "files_encrypted": 0,
            "files_with_ecc": 0,
            "files_with_stego": 0,
            "total_synthesis_cost_usd": 0.0,
        }

    total_bp = sum(f.dna_length_bp or 0 for f in files)
    avg_gc = round(sum(f.gc_content or 0 for f in files) / len(files), 2)
    encrypted_count = sum(1 for f in files if f.is_encrypted)
    ecc_count = sum(1 for f in files if f.has_error_correction)
    stego_count = sum(1 for f in files if f.has_steganography)
    synthesis_cost = round(total_bp * 0.10, 2)

    return {
        "total_files": len(files),
        "total_bp_encoded": total_bp,
        "avg_gc_content": avg_gc,
        "files_encrypted": encrypted_count,
        "files_with_ecc": ecc_count,
        "files_with_stego": stego_count,
        "total_synthesis_cost_usd": synthesis_cost,
    }
