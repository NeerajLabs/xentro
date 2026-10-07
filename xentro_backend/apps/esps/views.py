"""
XENTRO Ecosystem Support Provider (ESP) Enabler API
Handles Incubators, Accelerators, Cohorts, and Endorsements.
"""
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id, clean_username
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated
from common.audit import log_audit_event

class EspRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = data.get("userId") or request.headers.get("X-User-Id")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        institution_name = data.get("institutionName", "").strip()
        esp_type = data.get("espType", "INCUBATOR") # PRE_INCUBATOR, INCUBATOR, ACCELERATOR, UNIVERSITY
        official_domain = data.get("officialDomain", "")
        auth_doc_url = data.get("authDocUrl", "")

        if not institution_name:
            return api_error("Institution name is required.")

        esp_id = generate_xentro_id("esp")
        username = clean_username(institution_name)
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        doc = {
            "id": esp_id,
            "entityType": "ESP",
            "accountType": "ESP",
            "name": institution_name,
            "username": username,
            "espType": esp_type,
            "primaryOwnerId": user_id,
            "officialDomain": official_domain,
            "authDocUrl": auth_doc_url,
            "verificationStatus": "PENDING",
            "activeCohorts": 1,
            "portfolioCount": 0,
            "alumniCount": 0,
            "createdAt": now_iso,
            "updatedAt": now_iso
        }

        entities_col = get_collection("entities")
        entities_col.insert_one(doc)

        users_col = get_collection("users")
        users_col.update_one(
            {"id": user_id},
            {
                "$set": {"accountType": "ESP", "primaryRole": "ESP", "entityId": esp_id},
                "$addToSet": {"activeRoles": "ESP Applicant"}
            }
        )

        doc.pop("_id", None)
        return api_success({"esp": doc, "entity": doc}, "ESP registration submitted. Awaiting Administrator verification.")

class EspEndorseStartupView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, esp_id):
        data = request.data
        startup_id = data.get("startupId")
        relationship_type = data.get("relationshipType", "INCUBATED_STARTUP")
        cohort_name = data.get("cohortName", "Cohort 2026")

        if not startup_id:
            return api_error("Startup ID is required.")

        endorsement_id = generate_xentro_id("endorsement")
        endorsement = {
            "id": endorsement_id,
            "espId": esp_id,
            "startupId": startup_id,
            "relationshipType": relationship_type,
            "cohortName": cohort_name,
            "status": "ENDORSED",
            "entitlementGranted": "Startup Pro",
            "issuedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "expiresAt": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)).isoformat()
        }

        endorse_col = get_collection("endorsements")
        endorse_col.insert_one(endorsement)

        # Automatically grant Startup Pro Entitlement to the startup!
        ent_col = get_collection("entitlements")
        ent_doc = {
            "id": generate_xentro_id("entitlement"),
            "targetEntityId": startup_id,
            "entitlement": "Startup Pro",
            "accessSource": "ESP Endorsement",
            "relatedEndorsementId": endorsement_id,
            "status": "ACTIVE",
            "grantedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "expiresAt": endorsement["expiresAt"]
        }
        ent_col.insert_one(ent_doc)

        log_audit_event(
            admin_id=request.user.id,
            action="ISSUE_ENDORSEMENT",
            object_type="ENDORSEMENT",
            object_id=endorsement_id,
            new_state={"startupId": startup_id, "espId": esp_id}
        )

        endorsement.pop("_id", None)
        return api_success({"endorsement": endorsement}, "Startup successfully endorsed. Pro Entitlement activated.")
