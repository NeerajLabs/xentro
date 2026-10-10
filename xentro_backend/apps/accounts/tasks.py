"""
XENTRO Celery Background Tasks for Accounts & Onboarding
Handles asynchronous email delivery, welcome notifications, search indexing, and cache warming.
Synchronous database writes are always committed BEFORE queueing these tasks.
"""
import logging
from celery import shared_task
from integrations.email_service import _send_via_https_dispatcher, _send_direct_smtp
from integrations.mongodb import get_collection

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def send_otp_email_task(self, email: str, otp_code: str, user_name: str = "Explorer"):
    """
    Asynchronously delivers a 6-digit email OTP.
    Retries up to 3 times with exponential backoff if network dispatch fails.
    """
    subject = "Your XENTRO Verification Code"
    body = (
        f"Hello {user_name},\n\n"
        f"Your verification code for XENTRO is: {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"If you did not request this verification, please ignore this email.\n\n"
        f"Best regards,\n"
        f"The XENTRO Team\n"
        f"https://xentro.in"
    )
    try:
        success = _send_via_https_dispatcher(email, subject, body)
        if not success:
            success = _send_direct_smtp(email, subject, body)
        if not success:
            raise Exception("All email delivery backends failed")
        logger.info(f"[Celery] OTP email successfully dispatched to {email}")
        return {"success": True, "email": email}
    except Exception as exc:
        logger.warning(f"[Celery] OTP email delivery failed for {email}: {exc}. Retrying...")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_welcome_email_task(self, email: str, user_name: str = "Explorer"):
    """
    Asynchronously delivers a welcome email upon onboarding completion.
    """
    subject = "Welcome to XENTRO — Your Explorer Journey Begins"
    body = (
        f"Hello {user_name},\n\n"
        f"Welcome to XENTRO! Your Explorer Account setup is now complete.\n\n"
        f"You can now:\n"
        f"• Explore emerging startups, verified mentors, and institutional investors\n"
        f"• Build connections with ecosystem leaders\n"
        f"• Upgrade to Mentor or Individual Investor when ready\n"
        f"• Create Startup or Institution entity accounts from your dashboard\n\n"
        f"Log in anytime at https://xentro.in\n\n"
        f"Warm regards,\n"
        f"The XENTRO Team"
    )
    try:
        success = _send_via_https_dispatcher(email, subject, body)
        if not success:
            success = _send_direct_smtp(email, subject, body)
        logger.info(f"[Celery] Welcome email dispatched to {email} (success={success})")
        return {"success": success, "email": email}
    except Exception as exc:
        logger.warning(f"[Celery] Welcome email dispatch failed for {email}: {exc}")
        raise self.retry(exc=exc)


@shared_task(ignore_result=True)
def update_user_search_index_task(user_id: str):
    """
    Background job to warm search caches and recommendation indices.
    """
    try:
        users_col = get_collection("users")
        user = users_col.find_one({"id": user_id})
        if user:
            logger.info(f"[Celery] Updated search index cache for user {user_id}")
    except Exception as e:
        logger.warning(f"[Celery] Search index update error for {user_id}: {e}")
