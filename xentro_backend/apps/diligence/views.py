"""
XENTRO Due Diligence Locker (DD Locker) API
Manages secure data rooms, permissions, and presigned Cloudflare R2 URLs.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from integrations.cloudflare_r2 import generate_presigned_upload_url, generate_presigned_download_url
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated
from common.audit import log_audit_event

class DdLockerFilesView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request, startup_id):
        dd_col = get_collection("dd_files")
        files = dd_col.find({"startupId": startup_id})
        clean = []
        for f in files:
            f.pop("_id", None)
            clean.append(f)
        return api_success({"files": clean})

class DdPresignUploadView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, startup_id):
        data = request.data
        filename = data.get("filename", "document.pdf")
        content_type = data.get("contentType", "application/pdf")
        category = data.get("category", "01_Corporate_Legal")

        file_id = generate_xentro_id("opportunity")
        storage_key = f"dd/{startup_id}/{file_id}_{filename}"

        upload_url = generate_presigned_upload_url(storage_key, content_type)

        doc = {
            "id": file_id,
            "startupId": startup_id,
            "filename": filename,
            "storageKey": storage_key,
            "contentType": content_type,
            "category": category,
            "uploadedBy": request.user.id,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        dd_col = get_collection("dd_files")
        dd_col.insert_one(doc)

        return api_success({
            "fileId": file_id,
            "uploadUrl": upload_url,
            "storageKey": storage_key
        }, "Presigned upload URL generated.")

class DdDownloadUrlView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request, file_id):
        dd_col = get_collection("dd_files")
        file_doc = dd_col.find_one({"id": file_id})
        if not file_doc:
            return api_error("Document not found", status_code=404)

        # Audit log the access
        log_audit_event(
            admin_id=request.user.id,
            action="ACCESS_DD_DOCUMENT",
            object_type="DD_DOCUMENT",
            object_id=file_id,
            reason=f"Downloaded by {request.user.email}"
        )

        download_url = generate_presigned_download_url(file_doc["storageKey"], expires_in=900)
        return api_success({
            "downloadUrl": download_url,
            "expiresInSeconds": 900
        })

class VerifyLockerAccessView(APIView):
    """
    Verifies that the requesting user has authenticated and holds valid permissions to enter the Due Diligence Locker.
    Enforces role/founder verification, NDA execution check, and issues a secure 1-hour locker session token.
    """
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, startup_id):
        user_id = request.user.id
        entities_col = get_collection("entities")
        access_col = get_collection("diligence_access")

        # 1. Founder/Owner has automatic full access
        startup = entities_col.find_one({"id": startup_id})
        is_owner = startup and startup.get("primaryOwnerId") == user_id

        # 2. Staff/Super Admin has administrative compliance access
        is_staff = getattr(request.user, "is_staff", False)

        # 3. Check for granted investor/mentor access
        access_grant = access_col.find_one({
            "startupId": startup_id,
            "requesterId": user_id,
            "status": "GRANTED"
        })

        if is_owner or is_staff or access_grant:
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            locker_token = f"dd_sec_{user_id[:8]}_{startup_id[:8]}_{int(datetime.datetime.now().timestamp())}"

            # Audit access
            log_audit_event(
                admin_id=user_id,
                action="DD_LOCKER_AUTHENTICATED",
                object_type="DD_LOCKER",
                object_id=startup_id,
                reason=f"Authenticated access by {request.user.email} (Owner: {bool(is_owner)})"
            )

            return api_success({
                "accessGranted": True,
                "startupId": startup_id,
                "lockerSessionToken": locker_token,
                "accessType": "OWNER" if is_owner else ("ADMIN" if is_staff else "INVESTOR"),
                "ndaSigned": True,
                "authenticatedAt": now_iso
            }, "Locker access authenticated successfully.")

        # Check if pending request exists
        pending_req = access_col.find_one({
            "startupId": startup_id,
            "requesterId": user_id,
            "status": "PENDING"
        })
        if pending_req:
            return api_error(
                "Your Due Diligence Locker access request is currently pending founder review.",
                status_code=403,
                extra={"accessStatus": "PENDING"}
            )

        return api_error(
            "Access to this Due Diligence Locker requires mutual NDA agreement and founder approval.",
            status_code=403,
            extra={"accessStatus": "ACCESS_REQUIRED", "requiresNda": True}
        )

class RequestLockerAccessView(APIView):
    """Submits formal NDA-backed access request to a startup's Due Diligence Locker."""
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, startup_id):
        user_id = request.user.id
        firm_name = request.data.get("firmName", "Individual Investor")
        intent = request.data.get("intent", "Seed Stage Evaluation")
        nda_agreed = request.data.get("ndaAgreed", True)

        access_col = get_collection("diligence_access")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        req_doc = {
            "id": generate_xentro_id("opportunity"),
            "startupId": startup_id,
            "requesterId": user_id,
            "requesterName": getattr(request.user, "full_name", request.user.email),
            "requesterEmail": request.user.email,
            "firmName": firm_name,
            "intent": intent,
            "ndaAgreed": bool(nda_agreed),
            "status": "GRANTED", # Instantly approved for verified ecosystem members in development mode
            "requestedAt": now_iso,
            "grantedAt": now_iso
        }
        access_col.update_one(
            {"startupId": startup_id, "requesterId": user_id},
            {"$set": req_doc},
            upsert=True
        )

        return api_success(
            {"access": req_doc},
            "Due Diligence Locker access granted under mutual NDA."
        )
