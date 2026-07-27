from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from db.database import Base
from datetime import datetime, timezone

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp_code = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=get_utc_now)

class EncodedFile(Base):
    __tablename__ = "encoded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True) # Connect to user, nullable for backwards compatibility
    filename = Column(String, index=True)
    original_size_bytes = Column(Integer)
    dna_length_bp = Column(Integer)
    gc_content = Column(Float)
    is_encrypted = Column(Boolean, default=False)
    has_error_correction = Column(Boolean, default=False)
    has_steganography = Column(Boolean, default=False)
    dna_sequence = Column(String, nullable=True)
    text_preview = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    key_hash = Column(String, unique=True, index=True)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

class AuthRateLimit(Base):
    __tablename__ = "auth_rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    identifier = Column(String, index=True, nullable=True) # e.g. email
    endpoint = Column(String, index=True)
    attempt_count = Column(Integer, default=1)
    last_attempt_at = Column(DateTime, default=get_utc_now)
