from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import base64
from typing import Optional
import uuid

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
    remove_error_correction
)
from core.steganography import embed_in_host, extract_from_host
from db.database import get_db, SessionLocal
from db.models import EncodedFile, User
from api.auth import get_current_user

import logging
logger = logging.getLogger("helixvault")

router = APIRouter()

# In-memory dictionary for task status (for enterprise PoC)
task_store = {}

def process_encode(task_id: str, contents: bytes, filename: str, password: Optional[str], 
                   use_error_correction: bool, use_steganography: bool, user_id: int):
    try:
        logger.info(f"Task {task_id}: Starting encoding for {filename}")
        original_size = len(contents)

        if password:
            contents = encrypt_data(contents, password)
        if use_error_correction:
            contents = apply_error_correction(contents)

        dna_seq = encode_data_to_dna(contents, filename)

        if use_steganography:
            dna_seq = embed_in_host(dna_seq)

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
                has_steganography=use_steganography
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
            "fasta": fasta_str,
            "genbank": genbank_str,
            "id": file_id
        }
        logger.info(f"Task {task_id}: Completed successfully")
    except Exception as e:
        logger.error(f"Task {task_id}: Failed with error: {str(e)}")
        task_store[task_id] = {"status": "failed", "error": str(e)}

def process_decode(task_id: str, contents: bytes, filename: str, password: Optional[str], 
                   use_error_correction: bool, use_steganography: bool):
    try:
        logger.info(f"Task {task_id}: Starting decoding for {filename}")
        dna_sequence = extract_sequence_from_file(contents, filename)

        if use_steganography:
            dna_sequence = extract_from_host(dna_sequence)

        data_bytes, orig_filename = decode_dna_to_data(dna_sequence)

        if use_error_correction:
            data_bytes = remove_error_correction(data_bytes)

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
        logger.error(f"Task {task_id}: Failed with error: {str(e)}")
        task_store[task_id] = {"status": "failed", "error": str(e)}

@router.post("/encode")
async def encode_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing"}
    background_tasks.add_task(process_encode, task_id, contents, file.filename or "unknown", password, use_error_correction, use_steganography, int(current_user.id)) # type: ignore
    return {"task_id": task_id, "status": "processing"}

@router.post("/decode")
async def decode_dna(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    task_id = str(uuid.uuid4())
    task_store[task_id] = {"status": "processing"}
    background_tasks.add_task(process_decode, task_id, contents, file.filename or "unknown", password, use_error_correction, use_steganography)
    return {"task_id": task_id, "status": "processing"}

@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_store[task_id]

@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(EncodedFile).filter(EncodedFile.user_id == current_user.id).order_by(EncodedFile.created_at.desc()).all()
    return files
