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

    def post(self, request):
        new_role = request.data.get("role", "Explorer")

        users_col = get_collection("users")
        users_col.update_one(
            {"id": request.user.id},
            {"$set": {"activeRole": new_role}}
        )

        new_access_token = create_access_token({
            "sub": request.user.id,
            "email": request.user.email,
            "name": request.user.full_name,
            "active_roles": getattr(request.user, "active_roles", [new_role]),
            "current_role": new_role,
            "is_staff": request.user.is_staff
        })

        return api_success({
            "activeRole": new_role,
            "accessToken": new_access_token
        }, f"Active persona switched to {new_role}.")
