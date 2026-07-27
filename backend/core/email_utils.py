import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging

logger = logging.getLogger("helixvault")

load_dotenv()

def send_email_via_smtp(to_email: str, subject: str, html_content: str):
    load_dotenv(override=True)
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_pwd = os.getenv("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_pwd:
        import re
        otp_match = re.search(r'\b\d{6}\b', html_content)
        otp_display = f" >>> YOUR OTP CODE IS: {otp_match.group(0)} <<< " if otp_match else ""
        logger.warning(f"\n{'='*50}\n[SIMULATED EMAIL TO: {to_email}]\nSubject: {subject}\n{otp_display}\n{'='*50}")
        return True
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"HelixVault <{smtp_email}>"
        msg["To"] = to_email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(smtp_email, smtp_pwd)
        server.sendmail(smtp_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email} via SMTP ({smtp_email})")
        return True
    except Exception as e:
        logger.error(f"Exception sending email via SMTP to {to_email}: {e}", exc_info=True)
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
    return send_email_via_smtp(to_email, subject, html_content)

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
    return send_email_via_smtp(to_email, subject, html_content)
