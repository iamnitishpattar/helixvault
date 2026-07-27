from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User, EncodedFile
from api.auth import get_current_user, get_optional_current_user
from core.plasmid_engine import get_available_vectors, clone_payload_into_vector, export_circular_genbank
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings

router = APIRouter()

class CloneRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    file_id: Optional[int] = None
    dna_sequence: Optional[str] = None
    vector_name: str = Field("pUC19", pattern=r"^(pUC19|pBR322)$")
    payload_name: Optional[str] = "Synthetic_Data_Payload"

class ExportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cloned_data: Dict[str, Any]
    locus_name: Optional[str] = "pHV_CLONE"
    description: Optional[str] = "HelixVault Synthetic Biology Circular Plasmid Clone"

@router.get("/vectors")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def list_vectors(
    request: Request
):
    """Returns metadata for all available circular cloning plasmid backbones."""
    return {
        "status": "success",
        "vectors": get_available_vectors()
    }

@router.post("/clone")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def clone_plasmid(
    request: Request,
    body: CloneRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Clones an oligonucleotide sequence or an archived vault file into a circular bacterial plasmid vector.
    Returns the complete circular sequence, shifted feature map, and restriction enzyme statistics.
    """
    seq_to_clone = body.dna_sequence
    name_to_use = body.payload_name or "Synthetic_Data_Payload"

    if body.file_id is not None:
        if not current_user:
            raise HTTPException(status_code=401, detail="Please log in to clone archived files from your private HelixVault.")
        file_rec = db.query(EncodedFile).filter(
            EncodedFile.id == body.file_id,
            EncodedFile.user_id == current_user.id
        ).first()
        if not file_rec:
            raise HTTPException(status_code=404, detail="File not found in your vault.")
        
        name_to_use = file_rec.filename
        if file_rec.dna_sequence:
            seq_to_clone = file_rec.dna_sequence
        else:
            # Fallback for old files: generate a deterministic bio-representation
            import hashlib
            from core.bio_compute import generate_fallback_dna
            seq_to_clone = generate_fallback_dna(file_rec.id, file_rec.filename, file_rec.original_size_bytes)

    if not seq_to_clone:
        seq_to_clone = "GAATTCGGATCCAAGCTT"  # Default fallback sequence

    try:
        cloned_res = clone_payload_into_vector(
            payload_dna=seq_to_clone,
            vector_name=body.vector_name,
            payload_name=name_to_use
        )
        return cloned_res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plasmid cloning failed: {str(e)}")

@router.post("/export")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def export_genbank(
    request: Request,
    body: ExportRequest
):
    """
    Exports a cloned plasmid map as a circular GenBank (.gb) file string
    compatible with SnapGene, Benchling, and NCBI.
    """
    try:
        gb_str = export_circular_genbank(
            cloned_data=body.cloned_data,
            locus_name=body.locus_name or "pHV_CLONE",
            description=body.description or "HelixVault Circular Plasmid Clone"
        )
        return PlainTextResponse(content=gb_str, media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GenBank export failed: {str(e)}")
