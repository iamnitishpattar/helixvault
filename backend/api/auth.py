from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import string

from db.database import get_db
from db.models import User, OTP
from core.auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from core.email_utils import send_otp_email, send_reset_password_email
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class RegisterRequest(BaseModel):
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

def get_current_user(request: Request, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.cookies.get("access_token")
    if not token:
        raise credentials_exception
        
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        if user.is_active:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            # Re-send OTP if inactive
            db.delete(user)
            db.commit()

    hashed_password = get_password_hash(req.password)
    new_user = User(email=req.email, hashed_password=hashed_password, is_active=False)
    db.add(new_user)
    
    otp_code = "".join(random.choices(string.digits, k=6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Clean up old OTPs for this email
    db.query(OTP).filter(OTP.email == req.email).delete()
    
    new_otp = OTP(email=req.email, otp_code=otp_code, expires_at=expires)
    db.add(new_otp)
    db.commit()

    send_otp_email(req.email, otp_code)
    
    return {"status": "success", "message": "OTP sent to email"}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(OTP).filter(OTP.email == req.email).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # We strip tzinfo for comparison because SQLite stores naive datetimes by default
    if otp_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if otp_record.otp_code != req.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP")
        
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = True
    db.delete(otp_record)
    db.commit()
    
    return {"status": "success", "message": "Account verified successfully"}

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not verified. Please register to receive a new OTP.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False, # Set to True in production with HTTPS
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    
    return {"status": "success", "email": user.email}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp_code = "".join(random.choices(string.digits, k=6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    db.query(OTP).filter(OTP.email == req.email).delete()
    
    new_otp = OTP(email=req.email, otp_code=otp_code, expires_at=expires)
    db.add(new_otp)
    db.commit()

    send_reset_password_email(req.email, otp_code)
    
    return {"status": "success", "message": "Password reset code sent"}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    otp_record = db.query(OTP).filter(OTP.email == req.email).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if otp_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    if otp_record.otp_code != req.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP")
        
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.delete(otp_record)
    db.commit()
    
    return {"status": "success", "message": "Password reset successfully"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}
