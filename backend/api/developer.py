from fastapi import APIRouter, Depends, HTTPException, Request, Query, Path
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings
from sqlalchemy.orm import Session
import secrets
import hashlib
from db.database import get_db
from db.models import ApiKey, User
from api.auth import get_current_user

router = APIRouter()

def generate_api_key():
    return secrets.token_urlsafe(32)

def hash_api_key(api_key: str):
    return hashlib.sha256(api_key.encode()).hexdigest()

@router.post("/keys")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def create_api_key(
    request: Request,
    name: str = Query("Default Key", min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_\- ]+$", description="API Key Name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new API key for the user."""
    raw_key = generate_api_key()
    hashed_key = hash_api_key(raw_key)
    
    new_key = ApiKey(
        user_id=current_user.id,
        key_hash=hashed_key,
        name=name
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    # We only return the raw key once!
    return {"id": new_key.id, "name": new_key.name, "api_key": raw_key}

@router.get("/keys")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def list_api_keys(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lists all API keys for the user (hashes only, not raw keys)."""
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    return [{"id": k.id, "name": k.name, "created_at": k.created_at, "is_active": k.is_active} for k in keys]

@router.delete("/keys/{key_id}")
@limiter.limit(rate_limit_settings.RATE_LIMIT_AUTH)
def revoke_api_key(
    request: Request,
    key_id: int = Path(..., ge=1, description="API Key ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revokes an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    db.delete(key)
    db.commit()
    return {"status": "success", "message": "API key revoked"}
