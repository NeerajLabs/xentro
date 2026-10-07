"""
XENTRO Memberships & Workspace Binding API
Maps human users (XU-) to Organizations (ST-, VCI-, ES-) with explicit RBAC roles.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

class MyMembershipsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request):
        mem_col = get_collection("memberships")
        memberships = mem_col.find({"userId": request.user.id, "status": "ACTIVE"})
        clean = []
        for m in memberships:
            m.pop("_id", None)
            clean.append(m)
        return api_success({"workspaces": clean})

class InviteMemberView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request):
        data = request.data
        entity_id = data.get("entityId")
        invitee_email = data.get("email", "").strip().lower()
        role = data.get("role", "MEMBER")

        if not entity_id or not invitee_email:
            return api_error("Entity ID and invitee email are required.")

        inv_id = generate_xentro_id("opportunity")
        doc = {
            "id": inv_id,
            "entityId": entity_id,
            "inviterId": request.user.id,
            "inviteeEmail": invitee_email,
            "role": role,
            "status": "INVITED",
            "invitedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        inv_col = get_collection("invitations")
        inv_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"invitation": doc}, f"Invitation sent to {invitee_email}.")
