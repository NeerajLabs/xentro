"""
XENTRO Security & Permission Engine
Enforces 10-tier RBAC, workspace roles, and strictly isolates Aadhaar/KYC access.
"""
from rest_framework import permissions

class IsXentroAuthenticated(permissions.BasePermission):
    """Requires verified authentication."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsXentroAdmin(permissions.BasePermission):
    """Requires internal administrative staff status."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return bool(request.user.is_staff or request.user.admin_employee_id)

class IsXentroMasterAdmin(permissions.BasePermission):
    """
    CRITICAL SECURITY ENFORCEMENT:
    Only Master Admin (Super Admin) can edit or delete user accounts.
    Non-master admins (Operations Admin, Support Admin, etc.) receive 403 Forbidden.
    """
    message = "Only the Master Admin (Super Admin) is authorized to perform this operation."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if not (request.user.is_staff or getattr(request.user, "admin_employee_id", None)):
            return False
        admin_role = getattr(request.user, "admin_role", None) or getattr(request.user, "role", None)
        return admin_role in ("Super Admin", "Master Admin")

class HasAdminPermission:
    """Factory creating a permission class for a specific administrative capability."""
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self):
        class DynamicAdminPermission(permissions.BasePermission):
            required_perm = self.required_permission

            def has_permission(self, request, view):
                if not (request.user and request.user.is_authenticated):
                    return False
                if not (request.user.is_staff or request.user.admin_employee_id):
                    return False
                # Super Admin bypasses general permissions, EXCEPT identity_verification.review
                if request.user.admin_role == "Super Admin" and self.required_perm != "identity_verification.review":
                    return True
                return self.required_perm in getattr(request.user, "admin_permissions", [])

        return DynamicAdminPermission()

class RequiresAadhaarReviewPermission(permissions.BasePermission):
    """
    CRITICAL SECURITY RULE:
    Raw Aadhaar & Government ID documents are strictly isolated.
    Even Super Admins cannot access raw KYC documents without this specific capability.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if not (request.user.is_staff or request.user.admin_employee_id):
            return False
        admin_perms = getattr(request.user, "admin_permissions", [])
        return "identity_verification.review" in admin_perms


class IsEntityMaster(permissions.BasePermission):
    """
    PHASE 2 SECURITY RULE:
    Strictly requires verified ENTITY_MASTER session context bound to governing Head.
    Personal sessions, Workspace sessions, and Admin roles receive 403 Forbidden.
    """
    message = "Verified Entity Master Access bound to governing Head is required for this operation."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if getattr(request.user, "context", None) != "ENTITY_MASTER":
            return False

        session_id = getattr(request.user, "session_id", None)
        if not session_id:
            return False

        # Target entity resolution
        target_entity_id = (
            getattr(request.user, "entity_id", None)
            or (view.kwargs.get("entity_id") if hasattr(view, "kwargs") else None)
            or (view.kwargs.get("startup_id") if hasattr(view, "kwargs") else None)
            or request.headers.get("X-Entity-Id")
        )
        if not target_entity_id:
            return False

        # Validate against token entity binding
        token_entity_id = getattr(request.user, "entity_id", None)
        if token_entity_id and token_entity_id != target_entity_id:
            return False  # Cross-tenant violation

        # Query session state and entity in MongoDB
        try:
            from integrations.mongodb import get_collection
            sessions_col = get_collection("entity_sessions")
            session_doc = sessions_col.find_one({"sessionId": session_id, "status": "ACTIVE"})
            if not session_doc:
                return False

            entities_col = get_collection("entities")
            entity = entities_col.find_one({"id": target_entity_id})
            if not entity:
                return False

            if entity.get("is_deleted") or entity.get("deleted") or entity.get("status") == "DELETED":
                return False

            # Authoritative head resolution (fail closed on conflict)
            curr_owner = (entity.get("currentOwnerUserId") or "").strip()
            prim_owner = (entity.get("primaryOwnerId") or "").strip()
            if curr_owner and prim_owner and curr_owner != prim_owner:
                return False  # Data conflict fail-closed

            head_id = curr_owner or prim_owner
            return request.user.id == head_id
        except Exception:
            return False


class IsEntityWorkspace(permissions.BasePermission):
    """
    PHASE 2 SECURITY RULE:
    Strictly requires verified ENTITY_WORKSPACE session context bound to an active accepted membership.
    """
    message = "Active Entity Workspace session required for internal dashboard access."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if getattr(request.user, "context", None) != "ENTITY_WORKSPACE":
            return False

        session_id = getattr(request.user, "session_id", None)
        if not session_id:
            return False

        target_entity_id = (
            getattr(request.user, "entity_id", None)
            or (view.kwargs.get("entity_id") if hasattr(view, "kwargs") else None)
            or (view.kwargs.get("startup_id") if hasattr(view, "kwargs") else None)
            or request.headers.get("X-Entity-Id")
        )
        if not target_entity_id:
            return False

        token_entity_id = getattr(request.user, "entity_id", None)
        if token_entity_id and token_entity_id != target_entity_id:
            return False

        try:
            from integrations.mongodb import get_collection
            sessions_col = get_collection("entity_sessions")
            session_doc = sessions_col.find_one({"sessionId": session_id, "status": "ACTIVE"})
            if not session_doc:
                return False

            entities_col = get_collection("entities")
            entity = entities_col.find_one({"id": target_entity_id})
            if not entity or entity.get("is_deleted") or entity.get("status") == "DELETED":
                return False

            memberships_col = get_collection("memberships")
            membership = memberships_col.find_one({
                "entityId": target_entity_id,
                "$or": [{"userId": request.user.id}, {"userEmail": getattr(request.user, "email", "")}]
            })
            if not membership:
                return False

            status = str(membership.get("status", "")).upper().strip()
            if status in ("SUSPENDED", "REVOKED", "PENDING", "INVITED"):
                return False
            if status == "APPROVED":
                return bool(membership.get("isAccepted") or membership.get("accepted") or membership.get("acceptedAt"))
            return status == "ACTIVE"
        except Exception:
            return False


class IsEntityMasterOrWorkspace(permissions.BasePermission):
    """Permits either ENTITY_MASTER or ENTITY_WORKSPACE for internal dashboard endpoints."""
    def has_permission(self, request, view):
        master_perm = IsEntityMaster()
        if master_perm.has_permission(request, view):
            return True
        workspace_perm = IsEntityWorkspace()
        return workspace_perm.has_permission(request, view)

