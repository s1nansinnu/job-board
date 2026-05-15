"""
Email notification module.
Sends emails for application events using fastapi-mail.
Falls back to console logging if SMTP is not configured.
"""
import os
from .config import (
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM,
    MAIL_PORT, MAIL_SERVER, MAIL_STARTTLS, MAIL_SSL_TLS
)

# Check if email is configured
EMAIL_ENABLED = bool(MAIL_USERNAME and MAIL_PASSWORD)

if EMAIL_ENABLED:
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=MAIL_FROM,
        MAIL_PORT=MAIL_PORT,
        MAIL_SERVER=MAIL_SERVER,
        MAIL_STARTTLS=MAIL_STARTTLS,
        MAIL_SSL_TLS=MAIL_SSL_TLS,
        USE_CREDENTIALS=True,
    )


def _status_color(status):
    """Get a color for the application status."""
    colors = {
        "applied": "#3b82f6",
        "reviewing": "#f59e0b",
        "shortlisted": "#10b981",
        "interview": "#8b5cf6",
        "offered": "#10b981",
        "rejected": "#ef4444",
        "withdrawn": "#6b7280",
    }
    return colors.get(status, "#6b7280")


def _email_template(title, body_content):
    """Wrap content in a styled email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#0a0e1a; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:600px; margin:0 auto; padding:40px 20px;">
            <div style="background:linear-gradient(135deg, #6366f1, #8b5cf6); padding:3px; border-radius:16px;">
                <div style="background:#111827; border-radius:14px; padding:40px;">
                    <h1 style="color:#f1f5f9; font-size:24px; margin:0 0 8px 0;">
                        JobBoard
                    </h1>
                    <h2 style="color:#a78bfa; font-size:18px; margin:0 0 24px 0; font-weight:400;">
                        {title}
                    </h2>
                    <div style="color:#94a3b8; font-size:15px; line-height:1.6;">
                        {body_content}
                    </div>
                    <hr style="border:none; border-top:1px solid rgba(148,163,184,0.1); margin:32px 0;">
                    <p style="color:#64748b; font-size:12px; margin:0;">
                        This is an automated notification from JobBoard Platform.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


async def send_application_confirmation(candidate_email, candidate_name, job_title, company):
    """Send confirmation email when a candidate applies for a job."""
    subject = f"Application Confirmed — {job_title} at {company}"
    body = f"""
        <p style="color:#f1f5f9;">Hi <strong>{candidate_name}</strong>,</p>
        <p>Your application for <strong style="color:#a78bfa;">{job_title}</strong> at
        <strong>{company}</strong> has been submitted successfully.</p>
        <div style="background:#1e293b; border-radius:8px; padding:16px; margin:16px 0;">
            <p style="margin:0; color:#94a3b8;">Status:
                <span style="background:#3b82f6; color:white; padding:4px 12px; border-radius:12px; font-size:13px;">
                    Applied
                </span>
            </p>
        </div>
        <p>We'll notify you when there are updates on your application.</p>
    """
    html = _email_template(subject, body)

    if EMAIL_ENABLED:
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[candidate_email],
                body=html,
                subtype=MessageType.html
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            print(f"[EMAIL] Application confirmation sent to {candidate_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send to {candidate_email}: {e}")
    else:
        print(f"[EMAIL DISABLED] Would send to {candidate_email}: {subject}")


async def send_status_update(candidate_email, candidate_name, job_title, company, old_status, new_status):
    """Send notification when application status changes."""
    color = _status_color(new_status)
    subject = f"Application Update — {job_title} at {company}"
    body = f"""
        <p style="color:#f1f5f9;">Hi <strong>{candidate_name}</strong>,</p>
        <p>Your application for <strong style="color:#a78bfa;">{job_title}</strong> at
        <strong>{company}</strong> has been updated.</p>
        <div style="background:#1e293b; border-radius:8px; padding:16px; margin:16px 0;">
            <p style="margin:0 0 8px 0; color:#64748b; font-size:13px;">Previous status:
                <span style="text-decoration:line-through;">{old_status.replace('_', ' ').title()}</span>
            </p>
            <p style="margin:0; color:#94a3b8;">New status:
                <span style="background:{color}; color:white; padding:4px 12px; border-radius:12px; font-size:13px;">
                    {new_status.replace('_', ' ').title()}
                </span>
            </p>
        </div>
        <p>Log in to your dashboard to view more details.</p>
    """
    html = _email_template(subject, body)

    if EMAIL_ENABLED:
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[candidate_email],
                body=html,
                subtype=MessageType.html
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            print(f"[EMAIL] Status update sent to {candidate_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send to {candidate_email}: {e}")
    else:
        print(f"[EMAIL DISABLED] Would send to {candidate_email}: {subject}")


async def send_new_application_alert(employer_email, employer_name, candidate_name, job_title):
    """Send alert to employer when they receive a new application."""
    subject = f"New Application — {job_title}"
    body = f"""
        <p style="color:#f1f5f9;">Hi <strong>{employer_name}</strong>,</p>
        <p>You have a new application for <strong style="color:#a78bfa;">{job_title}</strong>
        from <strong>{candidate_name}</strong>.</p>
        <p>Log in to your employer dashboard to review the application.</p>
    """
    html = _email_template(subject, body)

    if EMAIL_ENABLED:
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[employer_email],
                body=html,
                subtype=MessageType.html
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            print(f"[EMAIL] New application alert sent to {employer_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send to {employer_email}: {e}")
    else:
        print(f"[EMAIL DISABLED] Would send to {employer_email}: {subject}")
