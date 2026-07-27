from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User
from api.auth import get_current_user
from core.bio_compute import search_in_dna, execute_dna_query
from core.ai_copilot import ask_copilot
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings

router = APIRouter()

class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(..., min_length=1, max_length=100)
    mode: str = Field("motif", pattern=r"^(motif|keyword|vector|semantic)$")

class FilterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    min_gc: float = Field(0.0, ge=0.0, le=100.0)
    max_gc: float = Field(100.0, ge=0.0, le=100.0)
    min_length_bp: int = Field(0, ge=0)
    must_be_encrypted: Optional[bool] = None

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(..., min_length=1, max_length=1000)

@router.post("/search")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def compute_search(
    request: Request,
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute direct in-memory biological motif or keyword searching over stored DNA sequence strings without decoding.
    """
    try:
        results = search_in_dna(db, current_user.id, req.query, mode=req.mode)
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Biological compute error: {str(e)}")

@router.post("/filter")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def compute_filter(
    request: Request,
    req: FilterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute biological property filtering over stored archives.
    """
    try:
        results = execute_dna_query(
            db, 
            current_user.id, 
            min_gc=req.min_gc, 
            max_gc=req.max_gc, 
            min_length_bp=req.min_length_bp, 
            must_be_encrypted=req.must_be_encrypted
        )
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Biological filter error: {str(e)}")

@router.post("/chat")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def copilot_chat(
    request: Request,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Autonomous 'DNA-RAG' AI Co-Pilot endpoint for conversational biological vault analysis.
    """
    try:
        reply = ask_copilot(db, current_user.id, req.question)
        return {"status": "success", "data": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Co-Pilot error: {str(e)}")
