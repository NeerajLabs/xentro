"""
XENTRO Authentication & Session Handoff API
"""
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.jwt_auth import decode_token, create_access_token
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refreshToken") or request.COOKIES.get("xentro_refresh")
        if not refresh_token:
            return api_error("Refresh token is required.")

        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                return api_error("Invalid token type.")

            user_id = payload.get("sub")
            users_col = get_collection("users")
            user = users_col.find_one({"id": user_id})

            if not user:
                return api_error("User not found.", status_code=404)

            new_access_token = create_access_token({
                "sub": user["id"],
                "email": user["email"],
                "name": user.get("fullName", ""),
                "active_roles": user.get("activeRoles", ["Explorer"]),
                "is_staff": user.get("is_staff", False)
            })

            return api_success({"accessToken": new_access_token})
        except Exception as e:
            return api_error(str(e), status_code=401)

class SwitchActiveRoleView(APIView):
    permission_classes = [IsXentroAuthenticated]

    ALLOWED_PERSONAL_ROLES = {"Explorer", "Mentor", "Individual Investor"}

    def post(self, request):
        new_role = request.data.get("role", "").strip()
        if not new_role:
            return api_error("Role is required.", status_code=400)

        # 1. Reject any arbitrary or non-personal roles (e.g. Admin, Founder, Managing Partner)
        if new_role not in self.ALLOWED_PERSONAL_ROLES:
            return api_error(
                f"Unauthorized role '{new_role}'. Personal account roles are restricted to Explorer, Mentor, and Individual Investor. Organizational authority requires verified entity membership.",
                status_code=403
            )

        users_col = get_collection("users")
        user = users_col.find_one({"id": request.user.id})
        if not user:
            return api_error("User account not found.", status_code=404)

        # 2. Check if user legitimately holds this role in accountType or activeRoles
        user_account_type = user.get("accountType", "Explorer")
        active_roles = user.get("activeRoles") or user.get("participationModes") or [user_account_type]

        # Case: If switching to Mentor or Individual Investor, user MUST possess that role in activeRoles
        if new_role in ["Mentor", "Individual Investor"] and new_role not in active_roles and user_account_type != new_role:
            return api_error(
                f"Cannot switch to {new_role} without completing the verified personal account upgrade workflow.",
                status_code=403
            )

        # 3. Update activeRole only (do not mutate permanent accountType)
        users_col.update_one(
            {"id": request.user.id},
            {"$set": {"activeRole": new_role}}
        )

        new_access_token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("fullName", ""),
            "active_roles": active_roles,
            "current_role": new_role,
            "is_staff": user.get("is_staff", False)
        })

        return api_success({
            "activeRole": new_role,
            "accessToken": new_access_token
        }, f"Active persona switched to {new_role}.")
