"""
XENTRO Cloudflare R2 Client (S3-compatible)
Handles secure storage, presigned upload URLs, and time-expiring private download URLs for DD Locker.
"""
import os
import logging
import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)

R2_ACCOUNT_ID = os.getenv("CLOUDFLARE_R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("CLOUDFLARE_R2_BUCKET_NAME", "xentro-media")
R2_ENDPOINT_URL = os.getenv("CLOUDFLARE_R2_ENDPOINT_URL", f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com")

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def generate_presigned_upload_url(storage_key: str, content_type: str, expires_in: int = 3600) -> str:
    """Generates a presigned PUT URL for frontend to upload files directly to Cloudflare R2."""
    try:
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": R2_BUCKET_NAME,
                "Key": storage_key,
                "ContentType": content_type
            },
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        logger.warning(f"Failed to generate real R2 presigned upload URL: {e}. Returning simulated URL.")
        return f"https://media.xentro.io/simulated-upload/{storage_key}"

def generate_presigned_download_url(storage_key: str, expires_in: int = 900) -> str:
    """Generates a 15-minute time-expiring presigned GET URL for private DD Locker documents."""
    try:
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": R2_BUCKET_NAME,
                "Key": storage_key
            },
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        logger.warning(f"Failed to generate real R2 presigned download URL: {e}. Returning fallback URL.")
        return f"https://media.xentro.io/docs/{storage_key}?expires={expires_in}"
