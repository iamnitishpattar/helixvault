import os
import requests
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "HelixVault <onboarding@resend.dev>")

def send_email_via_resend(to_email: str, subject: str, html_content: str):
    if not RESEND_API_KEY or "your_resend_api_key_here" in RESEND_API_KEY:
        print(f"\n[WARNING] RESEND_API_KEY not configured. Could not send email to {to_email}")
        print(f"[SIMULATED EMAIL CONTENT]\n{html_content}\n")
        return False
        
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        response = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
        if response.status_code in (200, 201):
            return True
        else:
            print(f"Error sending email via Resend: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Exception sending email via Resend: {e}")
        return False

def send_otp_email(to_email: str, otp: str):
    subject = "HelixVault - Verification Code"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #6366f1;">Welcome to HelixVault!</h2>
        <p>Your verification code for registration is:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <strong style="font-size: 24px; letter-spacing: 5px; color: #1f2937;">{otp}</strong>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    return send_email_via_resend(to_email, subject, html_content)

def send_reset_password_email(to_email: str, otp: str):
    subject = "HelixVault - Password Reset"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #8b5cf6;">Password Reset Request</h2>
        <p>We received a request to reset your password for HelixVault. Your reset code is:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <strong style="font-size: 24px; letter-spacing: 5px; color: #1f2937;">{otp}</strong>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
    """
    return send_email_via_resend(to_email, subject, html_content)
