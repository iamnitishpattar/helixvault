import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_otp_email(to_email: str, otp: str):
    is_placeholder = (
        not SMTP_EMAIL 
        or not SMTP_PASSWORD 
        or "your_email" in SMTP_EMAIL 
        or "your_app_password" in SMTP_PASSWORD
    )
    if is_placeholder:
        print(f"\n[WARNING] SMTP credentials not configured in .env. Could not send OTP to {to_email}")
        print(f"[SIMULATED EMAIL] Your OTP is: {otp}\n")
        return False
        
    msg = EmailMessage()
    msg.set_content(f"""
    Hello,
    
    Welcome to HelixVault! Your OTP for registration is: {otp}
    
    This OTP will expire in 10 minutes.
    
    If you did not request this, please ignore this email.
    
    Best regards,
    HelixVault Team
    """)
    
    msg["Subject"] = "HelixVault - Verification Code"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    try:
        # Added timeout=3 to prevent hanging on Render Free Tier (blocks port 587)
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=3)
        server.starttls()
        server.login(str(SMTP_EMAIL), str(SMTP_PASSWORD))
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        print(f"\n[RENDER DEMO MODE] Render Free tier blocks emails.")
        print(f"YOUR OTP IS: {otp}\n")
        return False
