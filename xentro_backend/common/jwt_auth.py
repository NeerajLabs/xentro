"""
XENTRO JWT Authentication Engine
Supports Bearer tokens and HttpOnly `xentro_session` / `xentro_admin_auth` cookies.
"""
import os
import datetime
import jwt
from rest_framework import authentication, exceptions
from integrations.mongodb import get_collection

JWT_SECRET = os.getenv("JWT_SECRET", "xentro-jwt-access-secret-2026-sha256-key")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_EXPIRY_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", "60"))
JWT_REFRESH_EXPIRY_DAYS = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", "30"))

def create_access_token(payload: dict) -> str:
    """Creates a signed JWT access token."""
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=JWT_ACCESS_EXPIRY_MINUTES)
    token_payload = {
        **payload,
        "exp": exp,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "access"
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Creates a signed JWT refresh token."""
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=JWT_REFRESH_EXPIRY_DAYS)
    token_payload = {
        "sub": user_id,
        "exp": exp,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "refresh"
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed("Session token has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed("Invalid session token.")

class XentroUserWrapper:
    """Lightweight user object conforming to Django REST Framework interface."""
    def __init__(self, data: dict):
        self.data = data
        self.id = data.get("id") or data.get("_id")
        self.email = data.get("email", "")
        self.full_name = data.get("full_name", "")
        self.is_authenticated = True
        self.is_staff = data.get("is_staff", False)
        self.is_superuser = data.get("is_superuser", False)
        self.admin_employee_id = data.get("admin_employee_id")
        self.admin_role = data.get("admin_role")
        self.admin_permissions = data.get("admin_permissions", [])
        self.active_roles = data.get("active_roles", ["Explorer"])
        self.account_type = data.get("accountType") or data.get("userType") or data.get("account_type") or "Explorer"
        self.user_type = self.account_type
        self.verification_status = data.get("verification_status", "NOT_SUBMITTED")

    def has_perm(self, perm: str) -> bool:
        if self.is_superuser:
            return True
        return perm in self.admin_permissions

    def __str__(self):
        return f"User({self.id} | {self.email})"

class XentroAnonymousUser:
    """
    Lightweight anonymous user returned by DRF for unauthenticated requests.
    Replaces django.contrib.auth.models.AnonymousUser so that DRF never
    touches the Django auth system or any SQL database at runtime.
    """
    id = None
    email = ""
    full_name = "Anonymous"
    is_authenticated = False
    is_staff = False
    is_superuser = False
    admin_employee_id = None
    admin_role = None
    admin_permissions = []
    active_roles = []

    def has_perm(self, perm: str) -> bool:
        return False

    def __str__(self):
        return "AnonymousUser"


class XentroJWTAuthentication(authentication.BaseAuthentication):

    """DRF Authentication class supporting Header and Cookie."""
    def authenticate(self, request):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        elif "xentro_session" in request.COOKIES:
            token = request.COOKIES.get("xentro_session")
        elif "xentro_admin_auth" in request.COOKIES:
            token = request.COOKIES.get("xentro_admin_auth")

        if not token:
            return None

        payload = decode_token(token)
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id") or payload.get("employeeId")

        # Try to find user in MongoDB
        users_col = get_collection("users")
        user_doc = users_col.find_one({"id": user_id})

        if not user_doc:
            # Check admin team collection
            admin_col = get_collection("admin_users")
            user_doc = admin_col.find_one({"employee_id": user_id})

        if not user_doc:
            # Fallback to payload data
            user_doc = {
                "id": user_id,
                "email": payload.get("email", ""),
                "full_name": payload.get("name", "User"),
                "is_staff": payload.get("is_staff", False),
                "admin_employee_id": payload.get("employeeId"),
                "admin_role": payload.get("role"),
                "admin_permissions": payload.get("permissions", []),
                "active_roles": payload.get("active_roles", ["Explorer"])
            }

        return (XentroUserWrapper(user_doc), token)
