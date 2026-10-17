"""
XENTRO JWT Authentication Engine
Supports Bearer tokens and HttpOnly `xentro_session` / `xentro_admin_auth` cookies.
"""
import os
import datetime
import jwt
from rest_framework import authentication, exceptions
from integrations.mongodb import get_collection

INSECURE_FALLBACK_KEY = "xentro-jwt-access-secret-2026-sha256-key"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_EXPIRY_MINUTES = int(os.getenv("JWT_ACCESS_EXPIRY_MINUTES", "60"))
JWT_REFRESH_EXPIRY_DAYS = int(os.getenv("JWT_REFRESH_EXPIRY_DAYS", "30"))

def is_production_environment() -> bool:
    """Detects whether running in production (Render, cloud container, or non-DEBUG)."""
    return (
        not (os.getenv("DEBUG", "True").lower() in ("true", "1", "yes"))
        or bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))
        or os.getenv("DJANGO_ENV") == "production"
    )

def get_jwt_secret() -> str:
    """
    Returns authoritative JWT signing secret.
    In production: Strictly requires a high-entropy secret (>= 32 chars) and rejects known fallback.
    In development/testing: Allows environment JWT_SECRET or fallback test key.
    """
    secret = os.getenv("JWT_SECRET")
    if is_production_environment():
        if not secret:
            raise exceptions.AuthenticationFailed(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing in production."
            )
        if secret == INSECURE_FALLBACK_KEY or len(secret) < 32:
            raise exceptions.AuthenticationFailed(
                "CRITICAL SECURITY CONFIGURATION ERROR: Insecure or low-entropy JWT_SECRET detected in production."
            )
        return secret

    return secret or INSECURE_FALLBACK_KEY

# Module-level alias for backward compatibility in non-prod scripts
JWT_SECRET = os.getenv("JWT_SECRET", INSECURE_FALLBACK_KEY)

def create_access_token(payload: dict) -> str:
    """Creates a signed JWT access token."""
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=JWT_ACCESS_EXPIRY_MINUTES)
    token_payload = {
        **payload,
        "exp": exp,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "access"
    }
    return jwt.encode(token_payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Creates a signed JWT refresh token."""
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=JWT_REFRESH_EXPIRY_DAYS)
    token_payload = {
        "sub": user_id,
        "exp": exp,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "refresh"
    }
    return jwt.encode(token_payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token or session payload."""
    if not token:
        raise exceptions.AuthenticationFailed("No session token provided.")
    token_str = str(token).strip()
    if (token_str.startswith('"') and token_str.endswith('"')) or (token_str.startswith("'") and token_str.endswith("'")):
        token_str = token_str[1:-1].strip()
    if token_str.startswith("Bearer "):
        token_str = token_str[7:].strip()

    jwt_secret = get_jwt_secret()

    # In production, explicitly reject tokens signed with the known insecure fallback
    if is_production_environment() and jwt_secret != INSECURE_FALLBACK_KEY:
        try:
            jwt.decode(token_str, INSECURE_FALLBACK_KEY, algorithms=[JWT_ALGORITHM])
            raise exceptions.AuthenticationFailed("Insecure legacy session token rejected. Please authenticate with new credentials.")
        except (jwt.InvalidSignatureError, jwt.DecodeError):
            pass  # Expected: token is NOT signed with the insecure fallback
        except exceptions.AuthenticationFailed:
            raise
        except Exception:
            pass

    # 1. Strictly enforce cryptographic JWT verification
    try:
        payload = jwt.decode(token_str, jwt_secret, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed("Session token has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed("Invalid session token.")
    except Exception:
        raise exceptions.AuthenticationFailed("Authentication failed.")

    # Strictly disallow refresh tokens from accessing API endpoints
    if payload.get("type") == "refresh":
        raise exceptions.AuthenticationFailed("Refresh tokens cannot be used for resource authentication.")

    return payload

decode_jwt_token = decode_token


class XentroUserWrapper:
    """Lightweight user object conforming to Django REST Framework interface."""
    def __init__(self, data: dict, token_payload: dict = None):
        self.data = data
        self.id = data.get("id") or data.get("_id") or data.get("employeeId") or data.get("employee_id")
        self.email = data.get("email", "")
        self.full_name = data.get("full_name") or data.get("name", "")
        self.is_authenticated = True
        self.is_staff = data.get("is_staff", False) or bool(data.get("employeeId") or data.get("employee_id") or data.get("admin_employee_id"))
        self.is_superuser = data.get("is_superuser", False)
        self.admin_employee_id = data.get("admin_employee_id") or data.get("employeeId") or data.get("employee_id")
        self.admin_role = data.get("admin_role") or data.get("role")
        self.role = self.admin_role
        self.admin_permissions = data.get("admin_permissions") or data.get("permissions", [])
        self.active_roles = data.get("active_roles", ["Explorer"])
        self.account_type = data.get("accountType") or data.get("userType") or data.get("account_type") or "Explorer"
        self.user_type = self.account_type
        self.verification_status = data.get("verification_status", "NOT_SUBMITTED")

        # Phase 2: Session Context Attributes
        tp = token_payload or {}
        self.token_payload = tp
        self.context = tp.get("context", "PERSONAL")
        self.entity_id = tp.get("entityId") or tp.get("entity_id")
        self.session_id = tp.get("sessionId") or tp.get("session_id")
        self.membership_id = tp.get("membershipId") or tp.get("membership_id")
        self.is_head = bool(tp.get("isHead") or tp.get("is_head", False))

    def has_perm(self, perm: str) -> bool:
        if self.is_superuser:
            return True
        return perm in self.admin_permissions

    def __str__(self):
        return f"User({self.id} | {self.email} | {self.context})"

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

    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        token = None
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header:
            if "bearer " in auth_header.lower():
                token = auth_header.split(" ", 1)[1].strip()
            else:
                token = auth_header.strip()
        elif "xentro_session" in request.COOKIES:
            token = request.COOKIES.get("xentro_session")
        elif "xentro_admin_auth" in request.COOKIES:
            token = request.COOKIES.get("xentro_admin_auth")

        if not token:
            return None


        try:
            payload = decode_token(token)
        except exceptions.AuthenticationFailed:
            if auth_header and auth_header.startswith("Bearer "):
                raise
            return None
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id") or payload.get("employeeId")

        # Try to find user in MongoDB
        users_col = get_collection("users")
        user_doc = users_col.find_one({"id": user_id})

        if not user_doc:
            # Check admin team collection
            admin_col = get_collection("admin_users")
        if not user_doc:
            # Check built-in platform personnel
            try:
                from apps.admin_ops.views import DEFAULT_ADMINS
                emp_id = str(payload.get("employeeId") or user_id or "").strip().lower()
                for adm in DEFAULT_ADMINS:
                    if adm.get("employeeId", "").lower() == emp_id:
                        user_doc = {
                            "id": adm["employeeId"],
                            "email": f"{adm['employeeId']}@xentro.internal",
                            "full_name": adm.get("name", "Platform Admin"),
                            "is_staff": True,
                            "admin_employee_id": adm["employeeId"],
                            "admin_role": adm.get("role", "Super Admin"),
                            "admin_permissions": adm.get("permissions", []),
                            "active_roles": ["Admin"]
                        }
                        break
            except Exception:
                pass

        if not user_doc:
            # Strictly reject administrative claims if not found in database or personnel authority
            if payload.get("is_staff") or payload.get("employeeId") or payload.get("admin_role") or payload.get("admin_employee_id"):
                raise exceptions.AuthenticationFailed("Administrative identity not recognized or revoked.")
            # Standard fallback for valid personal user tokens
            user_doc = {
                "id": user_id,
                "email": payload.get("email", ""),
                "full_name": payload.get("name", "User"),
                "is_staff": False,
                "admin_employee_id": None,
                "admin_role": None,
                "admin_permissions": [],
                "active_roles": payload.get("active_roles", ["Explorer"])
            }

        return (XentroUserWrapper(user_doc, token_payload=payload), token)
