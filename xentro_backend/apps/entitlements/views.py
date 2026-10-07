"""
XENTRO Multi-Source Entitlement Engine
Resolves: ACCESS SOURCE -> ENTITLEMENT -> FEATURE ACCESS
Access Sources: Paid Subscription, ESP Endorsement, Xentro Partnership, Administrative Grant.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated, IsXentroAdmin
from common.audit import log_audit_event

FEATURE_CATALOGUE = {
    "Startup Pro": [
        "startup.dd_locker",
        "startup.advanced_analytics",
        "startup.investor_connect",
        "startup.custom_domain"
    ],
    "Investor Pro": [
        "investor.deal_flow_unlimited",
        "investor.dd_access",
        "investor.syndicate_broadcast"
    ],
    "Mentor Pro": [
        "mentor.paid_sessions",
        "mentor.structured_mentorship",
        "mentor.analytics"
    ]
}

class EntityEntitlementsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request, entity_id):
        ent_col = get_collection("entitlements")
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Query all active non-expired entitlements
        active_entitlements = ent_col.find({
            "targetEntityId": entity_id,
            "status": "ACTIVE"
        })

        features_granted = set()
        resolved_sources = []

        for ent in active_entitlements:
            ent.pop("_id", None)
            resolved_sources.append({
                "entitlement": ent.get("entitlement"),
                "source": ent.get("accessSource"),
                "expiresAt": ent.get("expiresAt")
            })
            ent_features = FEATURE_CATALOGUE.get(ent.get("entitlement", ""), [])
            features_granted.update(ent_features)

        return api_success({
            "entityId": entity_id,
            "activeSources": resolved_sources,
            "resolvedFeatures": list(features_granted)
        })

class AdminGrantEntitlementView(APIView):
    permission_classes = [IsXentroAdmin]

    def post(self, request):
        data = request.data
        entity_id = data.get("entityId")
        entitlement = data.get("entitlement", "Startup Pro")
        duration_days = int(data.get("durationDays", 90))
        reason = data.get("reason", "Pilot Cohort Support")

        if not entity_id:
            return api_error("Entity ID is required.")

        now = datetime.datetime.now(datetime.timezone.utc)
        expires_at = (now + datetime.timedelta(days=duration_days)).isoformat()

        ent_id = generate_xentro_id("entitlement")
        doc = {
            "id": ent_id,
            "targetEntityId": entity_id,
            "entitlement": entitlement,
            "accessSource": "Administrative Grant",
            "grantedBy": getattr(request.user, "admin_employee_id", "ADMIN"),
            "reason": reason,
            "status": "ACTIVE",
            "grantedAt": now.isoformat(),
            "expiresAt": expires_at
        }

        ent_col = get_collection("entitlements")
        ent_col.insert_one(doc)

        log_audit_event(
            admin_id=getattr(request.user, "admin_employee_id", "ADMIN"),
            action="GRANT_ENTITLEMENT",
            object_type="ENTITLEMENT",
            object_id=ent_id,
            new_state={"entityId": entity_id, "entitlement": entitlement, "expiresAt": expires_at},
            reason=reason
        )

        doc.pop("_id", None)
        return api_success({"entitlement": doc}, f"{entitlement} granted for {duration_days} days.")
