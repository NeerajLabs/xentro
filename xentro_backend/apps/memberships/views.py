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

    PROHIBITED_INVITATION_ROLES = {"OWNER", "HEAD", "FOUNDER", "MANAGING_PARTNER", "MANAGING PARTNER", "PRIMARY OWNER"}

    def post(self, request):
        data = request.data
        entity_id = data.get("entityId")
        invitee_email = data.get("email", "").strip().lower()
        role = data.get("role", "MEMBER").strip()

        if not entity_id or not invitee_email:
            return api_error("Entity ID and invitee email are required.")

        # 1. Verify target entity exists
        entities_col = get_collection("entities")
        entity = entities_col.find_one({"id": entity_id})
        if not entity:
            return api_error(f"Organization '{entity_id}' not found.", status_code=404)

        # 2. Verify inviter holds authorized governing or Admin role in target entity
        is_head = (
            entity.get("currentOwnerUserId") == request.user.id
            or entity.get("primaryOwnerId") == request.user.id
            or entity.get("createdByUserId") == request.user.id
        )

        mem_col = get_collection("memberships")
        inviter_membership = mem_col.find_one({
            "entityId": entity_id,
            "userId": request.user.id,
            "status": {"$in": ["ACTIVE", "APPROVED", "Active"]}
        })

        inviter_role = str(inviter_membership.get("role", "")).upper() if inviter_membership else ""
        inviter_perms = [str(p).upper() for p in (inviter_membership.get("permissions") or [])] if inviter_membership else []

        can_invite = is_head or ("OWNER" in inviter_perms) or ("ADMIN" in inviter_perms) or ("MANAGE_TEAM" in inviter_perms) or ("ADMIN" in inviter_role)

        if not can_invite:
            return api_error("Access denied. You do not hold team invitation authority for this organization.", status_code=403)

        # 3. Prohibit Head/Owner role assignment through invitations
        normalized_role = role.upper()
        if normalized_role in self.PROHIBITED_INVITATION_ROLES:
            return api_error("Governing Head and Owner roles cannot be assigned through team invitations.", status_code=403)

        # 3b. Enforce Head approval for Admin role invitations
        if "ADMIN" in normalized_role and not is_head:
            return api_error("Head approval required. Only the governing Head may appoint or invite Administrator roles.", status_code=403)

        # 4. Check if invitee is already an active member
        existing_active = mem_col.find_one({
            "entityId": entity_id,
            "userEmail": invitee_email,
            "status": {"$in": ["ACTIVE", "APPROVED", "Active"]}
        })
        if existing_active:
            return api_error(f"User {invitee_email} is already an active member of this organization.", status_code=409)

        # 5. Check if active pending invitation already exists
        inv_col = get_collection("invitations")
        existing_inv = inv_col.find_one({
            "entityId": entity_id,
            "inviteeEmail": invitee_email,
            "status": "INVITED"
        })
        if existing_inv:
            return api_error(f"An active invitation has already been dispatched to {invitee_email}.", status_code=409)

        inv_id = f"inv_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{str(request.user.id)[-4:]}"
        doc = {
            "id": inv_id,
            "entityId": entity_id,
            "inviterId": request.user.id,
            "inviteeEmail": invitee_email,
            "role": role,
            "status": "INVITED",
            "invitedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        inv_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"invitation": doc}, f"Invitation sent to {invitee_email}.")


class AcceptInvitationView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, invitation_id):
        inv_col = get_collection("invitations")
        inv = inv_col.find_one({"id": invitation_id})
        if not inv:
            return api_error("Invitation not found.", status_code=404)

        if inv.get("status") not in ("INVITED", "PENDING"):
            return api_error(f"Invitation cannot be accepted. Status is {inv.get('status')}.", status_code=409)

        user_email = (getattr(request.user, "email", "") or "").lower().strip()
        inv_email = (inv.get("inviteeEmail") or inv.get("email") or "").lower().strip()
        inv_user_id = inv.get("inviteeUserId")

        if (inv_user_id and inv_user_id != request.user.id) and (inv_email and inv_email != user_email):
            return api_error("Access denied. You are not the intended recipient of this invitation.", status_code=403)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        res = inv_col.find_one_and_update(
            {"id": invitation_id, "status": {"$in": ["INVITED", "PENDING"]}},
            {"$set": {"status": "ACCEPTED", "acceptedByUserId": request.user.id, "acceptedAt": now_iso}}
        )
        if not res:
            return api_error("Invitation already accepted or modified.", status_code=409)

        mem_col = get_collection("memberships")
        entities_col = get_collection("entities")
        entity = entities_col.find_one({"id": inv.get("entityId")})

        mem_id = f"mem_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{str(request.user.id)[-4:]}"
        mem_doc = {
            "id": mem_id,
            "entityId": inv.get("entityId"),
            "entityName": entity.get("name") if entity else inv.get("entityName", "Organization"),
            "userId": request.user.id,
            "userEmail": user_email,
            "userName": getattr(request.user, "full_name", None) or getattr(request.user, "username", "Team Member"),
            "role": inv.get("role", "Viewer"),
            "status": "ACTIVE",
            "isAccepted": True,
            "acceptedAt": now_iso,
            "invitationId": invitation_id,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        mem_col.update_one(
            {"entityId": inv.get("entityId"), "userId": request.user.id},
            {"$set": mem_doc},
            upsert=True
        )
        mem_doc.pop("_id", None)
        return api_success({"membership": mem_doc}, f"Invitation accepted. You are now an active member of {mem_doc['entityName']}.")

