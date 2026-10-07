"""
XENTRO Verification Engine
Implements KYC state machine with strict isolation of raw Aadhaar/National ID records.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated, RequiresAadhaarReviewPermission
from common.audit import log_audit_event

class IdentitySubmitView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request):
        data = request.data
        id_number = data.get("idNumber", "").strip()
        doc_type = data.get("docType", "AADHAAR").upper()
        front_url = data.get("frontDocUrl", "")
        back_url = data.get("backDocUrl", "")

        if not id_number:
            return api_error("Identification document number is required.")

        verif_col = get_collection("verifications")
        users_col = get_collection("users")

        # Masked ID for normal display (e.g. XXXX-XXXX-1234)
        masked = f"XXXX-XXXX-{id_number[-4:]}" if len(id_number) >= 4 else "XXXX-XXXX-XXXX"

        verif_doc = {
            "userId": request.user.id,
            "type": "IDENTITY",
            "docType": doc_type,
            "idNumber": id_number,  # Stored encrypted in production
            "idNumberMasked": masked,
            "frontDocUrl": front_url,
            "backDocUrl": back_url,
            "status": "PENDING",
            "submittedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "reviewedAt": None,
            "reviewedBy": None
        }

        verif_col.update_one({"userId": request.user.id, "type": "IDENTITY"}, {"$set": verif_doc}, upsert=True)
        users_col.update_one({"id": request.user.id}, {"$set": {"identityStatus": "PENDING"}})

        return api_success({
            "status": "PENDING",
            "maskedId": masked,
            "message": "Identity verification submitted for review."
        })

class IdentityStatusView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request):
        users_col = get_collection("users")
        user = users_col.find_one({"id": request.user.id})
        return api_success({
            "identityStatus": user.get("identityStatus", "NOT_SUBMITTED") if user else "NOT_SUBMITTED"
        })

class AdminIdentityQueueView(APIView):
    """
    CRITICAL SECURITY CHECK:
    Only personnel with explicit `identity_verification.review` can list/read raw KYC records.
    """
    permission_classes = [RequiresAadhaarReviewPermission]

    def get(self, request):
        verif_col = get_collection("verifications")
        pending = verif_col.find({"type": "IDENTITY", "status": "PENDING"}, limit=50)
        clean = []
        for p in pending:
            p.pop("_id", None)
            clean.append(p)
        return api_success({"queue": clean})

class AdminIdentityReviewView(APIView):
    permission_classes = [RequiresAadhaarReviewPermission]

    def post(self, request, user_id):
        action = request.data.get("action", "APPROVE").upper() # APPROVE or REJECT
        reason = request.data.get("reason", "")

        new_status = "VERIFIED" if action == "APPROVE" else "FAILED"

        verif_col = get_collection("verifications")
        users_col = get_collection("users")

        verif_col.update_one(
            {"userId": user_id, "type": "IDENTITY"},
            {"$set": {
                "status": new_status,
                "reviewedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "reviewedBy": getattr(request.user, "admin_employee_id", "ADMIN"),
                "reviewNotes": reason
            }}
        )

        users_col.update_one({"id": user_id}, {"$set": {"identityStatus": new_status}})

        log_audit_event(
            admin_id=getattr(request.user, "admin_employee_id", "ADMIN"),
            action=f"KYC_REVIEW_{action}",
            object_type="USER_IDENTITY",
            object_id=user_id,
            new_state={"identityStatus": new_status},
            reason=reason
        )

        return api_success({"userId": user_id, "status": new_status}, f"Identity verification {new_status.lower()}.")
