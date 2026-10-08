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
