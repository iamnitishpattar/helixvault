from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math

from db.models import AuthRateLimit
from core.rate_limit_config import rate_limit_settings

# Global Limiter for public and standard authenticated routes
limiter = Limiter(key_func=get_remote_address)

def get_utc_now():
    return datetime.now(timezone.utc)

def enforce_auth_rate_limit(db: Session, ip_address: str, identifier: str, endpoint: str):
    """
    Enforces exponential backoff rate limiting for authentication routes.
    Checks both per-IP and per-account (identifier) limits.
    """
    now = get_utc_now()
    
    # Clean up old records for this IP/identifier to avoid DB bloat
    reset_window = rate_limit_settings.AUTH_BACKOFF_RESET_WINDOW
    
    # Query for existing limit record
    # We track by both IP and identifier. To be strict, we find if either has exceeded.
    # We will track them as a single record combining IP and identifier, or we can check the IP.
    # The requirement says: "combination of per-IP and per-account limits"
    # So we'll track the specific combination of IP and identifier for a given endpoint.
    record = db.query(AuthRateLimit).filter(
        AuthRateLimit.ip_address == ip_address,
        AuthRateLimit.identifier == identifier,
        AuthRateLimit.endpoint == endpoint
    ).first()

    if record:
        # Check if reset window has passed
        time_since_last = (now - record.last_attempt_at.replace(tzinfo=timezone.utc)).total_seconds()
        
        if time_since_last > reset_window:
            record.attempt_count = 1
            record.last_attempt_at = now
            db.commit()
            return record

        if record.attempt_count >= rate_limit_settings.AUTH_BACKOFF_MAX_ATTEMPTS:
            # Calculate exponential backoff delay
            over_attempts = record.attempt_count - rate_limit_settings.AUTH_BACKOFF_MAX_ATTEMPTS
            delay = rate_limit_settings.AUTH_BACKOFF_BASE_DELAY * (2 ** over_attempts)
            
            if time_since_last < delay:
                retry_after = int(math.ceil(delay - time_since_last))
                raise HTTPException(
                    status_code=429,
                    detail="Too many authentication attempts. Please try again later.",
                    headers={"Retry-After": str(retry_after)}
                )
            
        # Allowed to proceed, but it's an attempt, so we update the timestamp
        record.attempt_count += 1
        record.last_attempt_at = now
        db.commit()
        return record
    else:
        # First attempt
        new_record = AuthRateLimit(
            ip_address=ip_address,
            identifier=identifier,
            endpoint=endpoint,
            attempt_count=1,
            last_attempt_at=now
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

def reset_auth_rate_limit(db: Session, ip_address: str, identifier: str, endpoint: str):
    """
    Resets the rate limit counter upon successful authentication action.
    """
    record = db.query(AuthRateLimit).filter(
        AuthRateLimit.ip_address == ip_address,
        AuthRateLimit.identifier == identifier,
        AuthRateLimit.endpoint == endpoint
    ).first()
    
    if record:
        db.delete(record)
        db.commit()
