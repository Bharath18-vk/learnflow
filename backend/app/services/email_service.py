import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Tuple
from app.config import settings


def get_smtp_config():
    """Dynamically reads SMTP settings from app config or environment variables."""
    return {
        "SMTP_HOST": settings.SMTP_HOST or os.getenv("SMTP_HOST", ""),
        "SMTP_PORT": int(settings.SMTP_PORT or os.getenv("SMTP_PORT", "587")),
        "SMTP_USERNAME": settings.SMTP_USERNAME or os.getenv("SMTP_USERNAME", ""),
        "SMTP_PASSWORD": settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", ""),
        "SMTP_FROM": settings.SMTP_FROM or os.getenv("SMTP_FROM", "LearnWise <noreply@learnwise.app>"),
        "FRONTEND_URL": settings.FRONTEND_URL or os.getenv("FRONTEND_URL", "http://localhost:5173"),
    }


FRONTEND_URL = get_smtp_config()["FRONTEND_URL"]


def generate_email_template(
    title: str,
    preheader: str,
    greeting_name: str,
    body_paragraph: str,
    button_text: str,
    button_url: str,
    expiry_note: str,
    security_note: str
) -> str:
    """Renders a premium dark-themed HTML email template matching Linear/Vercel/GitHub quality."""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #020617;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #f8fafc;
            -webkit-font-smoothing: antialiased;
        }}
        .email-wrapper {{
            width: 100%;
            background-color: #020617;
            background-image: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 75%);
            padding: 40px 20px;
            box-sizing: border-box;
        }}
        .email-card {{
            max-width: 540px;
            margin: 0 auto;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 20px;
            padding: 40px 32px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            text-align: left;
        }}
        .brand-header {{
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .brand-header span {{
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: #a855f7;
        }}
        .email-heading {{
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 16px;
        }}
        .email-text {{
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 28px;
        }}
        .btn-wrapper {{
            text-align: center;
            margin: 32px 0;
        }}
        .btn-primary {{
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }}
        .expiry-box {{
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 10px;
            padding: 12px 16px;
            font-size: 13px;
            color: #a5b4fc;
            margin-bottom: 24px;
        }}
        .raw-link-box {{
            word-break: break-all;
            font-size: 12px;
            color: #64748b;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }}
        .raw-link-box a {{
            color: #818cf8;
            text-decoration: none;
        }}
        .footer {{
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 30px;
            line-height: 1.5;
        }}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-card">
            <div class="brand-header">
                Learn<span>Wise</span>
            </div>

            <h2 class="email-heading">{title}</h2>
            <p class="email-text">Hello {greeting_name},</p>
            <p class="email-text">{body_paragraph}</p>

            <div class="btn-wrapper">
                <a href="{button_url}" target="_blank" class="btn-primary">{button_text}</a>
            </div>

            <div class="expiry-box">
                ⏳ <strong>Expiry Notice:</strong> {expiry_note}
            </div>

            <p class="email-text" style="font-size: 13px; color: #94a3b8;">
                🔒 {security_note}
            </p>

            <div class="raw-link-box">
                Or copy and paste this URL into your browser:<br>
                <a href="{button_url}" target="_blank">{button_url}</a>
            </div>
        </div>

        <div class="footer">
            © 2026 LearnWise Inc. All rights reserved.<br>
            Personalized AI Learning Roadmaps • Built for Focused Learners
        </div>
    </div>
</body>
</html>
"""


def send_email(to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
    """Sends an email using configured SMTP parameters or logs cleanly to console if SMTP is unconfigured."""
    cfg = get_smtp_config()
    host = cfg["SMTP_HOST"]
    port = cfg["SMTP_PORT"]
    username = cfg["SMTP_USERNAME"]
    password = cfg["SMTP_PASSWORD"]
    from_addr = cfg["SMTP_FROM"]

    if not host or not username:
        print(f"\n==================================================")
        print(f"[DEV EMAIL MOCK SERVICE]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Status: Logged to console (Set SMTP_HOST in backend/.env for production inbox delivery)")
        print(f"==================================================\n")
        return {
            "success": True,
            "delivery_mode": "dev_mock",
            "error": None,
            "message": "Logged to dev console (SMTP not configured in backend/.env)"
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to_email

        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)

        if port == 465:
            # SSL Connection
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                if username and password:
                    server.login(username, password)
                server.sendmail(from_addr, to_email, msg.as_string())
        else:
            # STARTTLS / Standard Connection
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                if server.has_extn("starttls"):
                    server.starttls()
                    server.ehlo()
                if username and password:
                    server.login(username, password)
                server.sendmail(from_addr, to_email, msg.as_string())

        print(f"[SUCCESS] Real email successfully delivered to inbox of {to_email}")
        return {
            "success": True,
            "delivery_mode": "smtp",
            "error": None,
            "message": f"Email successfully delivered to {to_email}"
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Failed to send email via SMTP to {to_email}: {error_msg}")
        return {
            "success": False,
            "delivery_mode": "failed",
            "error": error_msg,
            "message": f"Failed to send email via SMTP: {error_msg}"
        }



def send_verification_email(to_email: str, name: str, raw_token: str) -> Dict[str, Any]:
    """Sends a brand-new verification email with raw token link."""
    cfg = get_smtp_config()
    button_url = f"{cfg['FRONTEND_URL']}/verify-email?token={raw_token}"
    html = generate_email_template(
        title="Verify your email address",
        preheader="Confirm your email to unlock your LearnWise dashboard",
        greeting_name=name,
        body_paragraph="Welcome to LearnWise! Please verify your email address to confirm your account and access your personalized AI learning roadmaps.",
        button_text="Verify Email Address →",
        button_url=button_url,
        expiry_note="This verification link expires in 24 hours.",
        security_note="If you did not create a LearnWise account, you can safely ignore this email."
    )
    return send_email(to_email, "Verify your LearnWise email address", html)


def send_password_reset_email(to_email: str, name: str, raw_token: str) -> Dict[str, Any]:
    """Sends a password reset email with raw token link."""
    cfg = get_smtp_config()
    button_url = f"{cfg['FRONTEND_URL']}/reset-password?token={raw_token}"
    html = generate_email_template(
        title="Reset your password",
        preheader="Instructions to reset your LearnWise password",
        greeting_name=name,
        body_paragraph="We received a request to reset the password for your LearnWise account. Click the button below to choose a new password.",
        button_text="Reset Password →",
        button_url=button_url,
        expiry_note="This reset link expires in 30 minutes and can only be used once.",
        security_note="If you did not request a password reset, please secure your email account immediately."
    )
    return send_email(to_email, "Reset your LearnWise password", html)

