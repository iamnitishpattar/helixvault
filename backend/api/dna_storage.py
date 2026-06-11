from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends

from sqlalchemy.orm import Session

import base64
from typing import Optional

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
from db.database import get_db
from db.models import EncodedFile, User
from api.auth import get_current_user

router = APIRouter()


@router.post("/encode")
async def encode_file(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        original_size = len(contents)
        filename = file.filename

        # 1. Encryption
        if password:
            contents = encrypt_data(contents, password)

        # 2. Error Correction
        if use_error_correction:
            contents = apply_error_correction(contents)

        # 3. Encode to DNA
        dna_seq = encode_data_to_dna(contents, filename)

        # 4. Steganography
        if use_steganography:
            dna_seq = embed_in_host(dna_seq)

        # Calculate metrics
        metrics = calculate_metrics(dna_seq)

        # Save to Vault (Database)
        new_file = EncodedFile(
            filename=filename,
            user_id=current_user.id,
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

        # Generate formats
        fasta_str = generate_fasta(
            dna_seq, sequence_id=f"HV_{filename.replace('.', '_')}")
        genbank_str = generate_genbank(
            dna_seq, sequence_id=f"HV_{filename.replace('.', '_')}")

        return {
            "status": "success",
            "filename": filename,
            "dna_sequence": dna_seq,
            "metrics": metrics,
            "fasta": fasta_str,
            "genbank": genbank_str,
            "id": new_file.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decode")
async def decode_dna(
    file: UploadFile = File(...),
    password: Optional[str] = Form(None),
    use_error_correction: bool = Form(False),
    use_steganography: bool = Form(False),
    current_user: User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        filename = file.filename

        # Extract DNA sequence from file
        dna_sequence = extract_sequence_from_file(contents, filename)

        # 1. Reverse Steganography
        if use_steganography:
            dna_sequence = extract_from_host(dna_sequence)

        # 2. Decode from DNA
        data_bytes, orig_filename = decode_dna_to_data(dna_sequence)

        # 3. Reverse Error Correction
        if use_error_correction:
            data_bytes = remove_error_correction(data_bytes)

        # 4. Decrypt
        if password:
            data_bytes = decrypt_data(data_bytes, password)
        elif "salt" not in orig_filename:
            # Simple heuristic, if it fails decoding it's likely missing password
            pass

        # Convert bytes to base64 for frontend consumption
        b64_data = base64.b64encode(data_bytes).decode('utf-8')

        return {
            "status": "success",
            "filename": orig_filename,
            "file_data_b64": b64_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to decode: {str(e)}")


@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(EncodedFile).filter(EncodedFile.user_id == current_user.id).order_by(EncodedFile.created_at.desc()).all()
    return files
