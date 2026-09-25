from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from db.models import User, EncodedFile
from api.auth import get_current_user
import logging

logger = logging.getLogger("helixvault")

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized admin access attempt by {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

@router.get("/stats", dependencies=[Depends(require_admin)])
def get_platform_stats(db: Session = Depends(get_db)):
    try:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_files = db.query(func.count(EncodedFile.id)).scalar() or 0
        total_dna_length = db.query(func.sum(EncodedFile.dna_length_bp)).scalar() or 0
        
        # Calculate size metrics (in MB)
        total_bytes = db.query(func.sum(EncodedFile.original_size_bytes)).scalar() or 0
        total_storage_mb = total_bytes / (1024 * 1024)

        return {
            "status": "success",
            "stats": {
                "total_users": total_users,
                "total_encoded_files": total_files,
                "total_dna_synthesized_bp": total_dna_length,
                "total_storage_mb": round(total_storage_mb, 2)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve platform statistics"
        )
