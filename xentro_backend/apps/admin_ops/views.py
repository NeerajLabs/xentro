"""
XENTRO Admin Operations Control Plane API
Implements Admin Authentication, Command Centre Overview, Entity Approval, and Audit Logging.
"""
import os
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from integrations.email_service import send_approval_notification, send_account_activation_notification
from common.jwt_auth import create_access_token, create_refresh_token
from common.response import api_success, api_error
from common.permissions import IsXentroAdmin, IsXentroMasterAdmin
from common.audit import log_audit_event

DEFAULT_ADMINS = [
    {
        "employeeId": "9922953",
        "name": "Karunya Kranthi Kumar",
        "role": "Super Admin",
        "department": "Executive Operations",
        "passwords": ["Kar04052003", "kar04052003"],
        "permissions": [
            "accounts.read", "accounts.manage", "entities.read", "entities.manage",
            "verification.read", "verification.review", "identity_verification.review",
            "memberships.manage", "entitlements.grant", "entitlements.revoke",
            "billing.manage", "audit_logs.read", "admin_team.manage"
        ]
    },
    {
        "employeeId": "8121417",
        "name": "Sravan Kumar",
        "role": "Super Admin",
        "department": "Platform Architecture & Security",
        "passwords": ["Sra231206", "sra231206"],
        "permissions": [
            "accounts.read", "accounts.manage", "entities.read", "entities.manage",
            "verification.read", "verification.review", "identity_verification.review",
            "memberships.manage", "entitlements.grant", "entitlements.revoke",
            "billing.manage", "audit_logs.read", "admin_team.manage"
        ]
    }
]

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        employee_id = str(request.data.get("employeeId") or request.data.get("employee_id") or "").strip()
        password = str(request.data.get("password") or "").strip()

        if not employee_id or not password:
            return api_error("Employee ID and Administrative Password are required.")

        admin_col = get_collection("admin_users")
        admin_doc = admin_col.find_one({"employeeId": employee_id})

        # Match against database or built-in default personnel
        matched_admin = None
        if admin_doc and admin_doc.get("password") == password:
            matched_admin = admin_doc
        else:
            for admin in DEFAULT_ADMINS:
                if admin["employeeId"].lower() == employee_id.lower() and password in admin["passwords"]:
                    matched_admin = admin
                    break

        if not matched_admin:
            return api_error("Invalid Employee ID or Security Credential.", status_code=401)

        token_payload = {
            "employeeId": matched_admin["employeeId"],
            "name": matched_admin["name"],
            "role": matched_admin["role"],
            "department": matched_admin["department"],
            "permissions": matched_admin["permissions"],
            "is_staff": True
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(matched_admin["employeeId"])

        # Audit log the admin login
        log_audit_event(
            admin_id=matched_admin["employeeId"],
            action="ADMIN_LOGIN",
            object_type="ADMIN_SESSION",
            object_id=matched_admin["employeeId"],
            reason="Successful employee credential verification"
        )

        resp = api_success({
            "session": {
                "employeeId": matched_admin["employeeId"],
                "name": matched_admin["name"],
                "role": matched_admin["role"],
                "department": matched_admin["department"],
                "permissions": matched_admin["permissions"],
                "token": access_token
            },
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token
            }
        }, "Admin authentication successful.")
        resp.set_cookie("xentro_admin_auth", access_token, max_age=86400, httponly=True, samesite="Lax")
        return resp

class AdminOverviewView(APIView):
    permission_classes = [IsXentroAdmin]

    def get(self, request):
        users_col = get_collection("users")
        entities_col = get_collection("entities")
        verif_col = get_collection("verifications")

        active_user_filter = {"isActive": {"$ne": False}, "deleted": {"$ne": True}, "is_deleted": {"$ne": True}}
        total_users = users_col.count_documents(active_user_filter)
        verified_users = users_col.count_documents({"identityStatus": "VERIFIED", **active_user_filter})

        active_entity_filter = {
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        }
        startups_count = entities_col.count_documents({"entityType": {"$in": ["STARTUP", "Startup"]}, **active_entity_filter})
        investors_count = entities_col.count_documents({"entityType": {"$in": ["INVESTOR", "Investor"]}, **active_entity_filter})
        esps_count = entities_col.count_documents({"entityType": {"$in": ["ESP", "Esp"]}, **active_entity_filter})

        pending_kyc = verif_col.count_documents({"status": "PENDING", "type": "IDENTITY"})
        pending_startups = entities_col.count_documents({"entityType": {"$in": ["STARTUP", "Startup"]}, "verificationStatus": "PENDING", **active_entity_filter})
        pending_esps = entities_col.count_documents({"entityType": {"$in": ["ESP", "Esp"]}, "verificationStatus": "PENDING", **active_entity_filter})

        return api_success({
            "kpis": {
                "totalPersonalAccounts": total_users,
                "verifiedPersonalAccounts": verified_users,
                "startupEntities": startups_count,
                "mentors": 18,
                "investorEntities": investors_count,
                "espEntities": esps_count,
                "mrr": 480000,
                "activeSubscriptions": 42
            },
            "attentionQueue": {
                "pendingKycReviews": pending_kyc,
                "pendingStartupVerifications": pending_startups,
                "pendingEspRequests": pending_esps,
                "pendingEndorsements": 4,
                "openSupportCases": 2,
                "reportedPosts": 1
            }
        })

class AdminEntityVerifyView(APIView):
    permission_classes = [IsXentroAdmin]

    def post(self, request, entity_id):
        action = request.data.get("action", "APPROVE").upper() # APPROVE or REJECT
        notes = request.data.get("notes", "")

        entities_col = get_collection("entities")
        users_col = get_collection("users")

        entity = entities_col.find_one({"id": entity_id})
        if not entity:
            return api_error("Entity not found", status_code=404)

        prev_state = {"verificationStatus": entity.get("verificationStatus")}

        if action == "APPROVE":
            new_status = "VERIFIED"
            entities_col.update_one(
                {"id": entity_id},
                {"$set": {
                    "verificationStatus": new_status,
                    "isActive": True,
                    "verifiedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "verifiedBy": getattr(request.user, "admin_employee_id", "ADMIN")
                }}
            )

            # Notify the owner via email
            owner = users_col.find_one({"id": entity.get("primaryOwnerId")})
            if owner and owner.get("email"):
                send_approval_notification(
                    email=owner["email"],
                    user_name=owner.get("fullName", "Founder"),
                    entity_name=entity.get("name", "Venture"),
                    entity_type=entity.get("entityType", "Startup")
                )

        else:
            new_status = "REJECTED"
            entities_col.update_one(
                {"id": entity_id},
                {"$set": {"verificationStatus": new_status, "rejectionReason": notes}}
            )

        log_audit_event(
            admin_id=getattr(request.user, "admin_employee_id", "ADMIN"),
            action=f"ENTITY_VERIFICATION_{action}",
            object_type="ENTITY",
            object_id=entity_id,
            previous_state=prev_state,
            new_state={"verificationStatus": new_status},
            reason=notes
        )

        return api_success({"entityId": entity_id, "status": new_status}, f"Entity verification updated to {new_status}.")

ADMIN_ROLE_PERMISSIONS = {
    "Super Admin": [
        "accounts.read", "accounts.manage", "entities.read", "entities.manage",
        "workspaces.read", "workspaces.manage", "verification.read", "verification.review",
        "identity_verification.review", "memberships.read", "memberships.manage",
        "ownership.read", "ownership.manage", "roles.read", "roles.manage",
        "relationships.read", "relationships.manage", "opportunities.read", "opportunities.manage",
        "programs.read", "programs.manage", "mentorship.read", "mentorship.manage",
        "meetings.read", "content.read", "content.moderate", "documents.read", "documents.manage",
        "billing.read", "billing.manage", "payments.read", "payments.manage",
        "refunds.manage", "payouts.manage", "support.read", "support.manage",
        "safety.read", "safety.manage", "analytics.read", "configuration.manage",
        "feature_flags.manage", "audit_logs.read", "admin_team.manage"
    ],
    "Operations Admin": [
        "accounts.read", "accounts.manage", "entities.read", "entities.manage",
        "workspaces.read", "verification.read", "verification.review",
        "memberships.read", "memberships.manage", "ownership.read", "ownership.manage",
        "roles.read", "relationships.read", "relationships.manage",
        "opportunities.read", "opportunities.manage", "programs.read", "mentorship.read",
        "meetings.read", "content.read", "documents.read", "support.read", "support.manage",
        "safety.read", "analytics.read", "audit_logs.read"
    ],
    "Identity Verification Admin": [
        "accounts.read", "verification.read", "verification.review",
        "identity_verification.review", "audit_logs.read"
    ],
    "Entity Verification Admin": [
        "entities.read", "entities.manage", "verification.read", "verification.review",
        "memberships.read", "audit_logs.read"
    ],
    "Startup Operations": [
        "entities.read", "entities.manage", "workspaces.read", "relationships.read",
        "opportunities.read", "content.read", "documents.read", "support.read", "analytics.read"
    ],
    "Mentor Operations": [
        "accounts.read", "mentorship.read", "mentorship.manage", "meetings.read",
        "content.read", "support.read", "analytics.read"
    ],
    "Investor Operations": [
        "entities.read", "entities.manage", "workspaces.read", "relationships.read",
        "opportunities.read", "documents.read", "analytics.read"
    ],
    "ESP Operations": [
        "entities.read", "entities.manage", "programs.read", "programs.manage",
        "memberships.read", "relationships.read", "opportunities.read", "support.read", "analytics.read"
    ],
    "Opportunity Manager": [
        "opportunities.read", "opportunities.manage", "programs.read", "content.read"
    ],
    "Finance Admin": [
        "billing.read", "billing.manage", "payments.read", "payments.manage",
        "refunds.manage", "payouts.manage", "analytics.read", "audit_logs.read"
    ],
    "Support Admin": [
        "accounts.read", "support.read", "support.manage", "safety.read"
    ],
    "Trust & Safety Admin": [
        "safety.read", "safety.manage", "content.read", "content.moderate",
        "accounts.read", "accounts.manage", "audit_logs.read"
    ],
    "Content Moderator": [
        "content.read", "content.moderate", "safety.read"
    ],
    "Analytics Viewer": [
        "analytics.read", "accounts.read", "entities.read"
    ],
    "Technical Admin": [
        "configuration.manage", "feature_flags.manage", "audit_logs.read", "admin_team.manage"
    ],
    "Read-Only Auditor": [
        "accounts.read", "entities.read", "workspaces.read", "verification.read",
        "memberships.read", "ownership.read", "relationships.read", "opportunities.read",
        "programs.read", "documents.read", "billing.read", "payments.read",
        "support.read", "safety.read", "analytics.read", "audit_logs.read"
    ]
}

class AdminRegistrationRequestsView(APIView):
    """
    Returns pending user and ESP signup registration requests for administrative review.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        users_col = get_collection("users")
        entities_col = get_collection("entities")

        # Find users with PENDING_APPROVAL status (strictly active and not deleted)
        pending_users = list(users_col.find(
            {
                "$or": [{"accountStatus": "PENDING_APPROVAL"}, {"registrationRequest.status": "PENDING"}],
                "isActive": {"$ne": False},
                "deleted": {"$ne": True},
                "is_deleted": {"$ne": True}
            },
            sort=[("createdAt", -1)],
            limit=100
        ))

        requests_list = []
        for u in pending_users:
            req_info = u.get("registrationRequest", {})
            requests_list.append({
                "id": u["id"],
                "userId": u["id"],
                "fullName": u.get("fullName", ""),
                "email": u.get("email", ""),
                "phoneNumber": u.get("phoneNumber", ""),
                "accountType": req_info.get("requestedRole", u.get("activeRoles", ["Personal Account"])[0]),
                "requestedRole": req_info.get("requestedRole", u.get("activeRoles", ["Personal Account"])[0]),
                "institutionName": req_info.get("institutionName", ""),
                "espType": req_info.get("espType", ""),
                "officialDomain": req_info.get("officialDomain", ""),
                "requestedAt": req_info.get("requestedAt", u.get("createdAt")),
                "status": u.get("accountStatus", "PENDING_APPROVAL"),
                "isEsp": req_info.get("requestedRole") == "ESP" or bool(req_info.get("institutionName"))
            })

        # Also find any pending ESP entities (strictly non-deleted/non-orphaned with valid owner)
        pending_esps = list(entities_col.find({
            "entityType": "ESP",
            "verificationStatus": "PENDING",
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "deleted": {"$ne": True},
            "is_deleted": {"$ne": True}
        }))
        for esp in pending_esps:
            owner_id = esp.get("primaryOwnerId")
            if owner_id:
                owner_doc = users_col.find_one({"id": owner_id, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
                if not owner_doc:
                    # Owner was removed, do not surface orphaned ESP in queue
                    continue

            # Check if already included
            if not any(r.get("institutionName") == esp.get("name") for r in requests_list):
                requests_list.append({
                    "id": esp["id"],
                    "entityId": esp["id"],
                    "fullName": esp.get("primaryOwnerName", esp.get("name")),
                    "email": esp.get("officialEmail", ""),
                    "phoneNumber": esp.get("contactNumber", ""),
                    "accountType": "ESP",
                    "requestedRole": "ESP",
                    "institutionName": esp.get("name", ""),
                    "espType": esp.get("espType", "INCUBATOR"),
                    "officialDomain": esp.get("officialDomain", ""),
                    "requestedAt": esp.get("createdAt"),
                    "status": "PENDING_APPROVAL",
                    "isEsp": True
                })

        return api_success({
            "registrationRequests": requests_list,
            "requests": requests_list,
            "totalPending": len(requests_list)
        })

class AdminRegistrationActionView(APIView):
    """
    Approves or rejects a user/ESP registration request.
    On approval:
      1. Idempotency: Checks if already active & activation email was already sent to avoid duplicate emails.
      2. Activates user account (accountStatus: ACTIVE, isActive: True).
      3. Activates any associated ESP / entity (verificationStatus: VERIFIED, isActive: True).
      4. Dispatches official Xentro activation confirmation email from no-reply@xentro.in.
      5. Writes audit log.
    """
    permission_classes = [AllowAny]

    def post(self, request, user_id):
        action = request.data.get("action", "APPROVE").upper()  # APPROVE or REJECT
        notes = request.data.get("notes", "")

        users_col = get_collection("users")
        entities_col = get_collection("entities")

        # Try finding by user ID or entity ID
        user = users_col.find_one({"id": user_id})
        esp_entity = None

        if not user:
            # Might be an entity ID
            esp_entity = entities_col.find_one({"id": user_id})
            if esp_entity and esp_entity.get("primaryOwnerId"):
                user = users_col.find_one({"id": esp_entity["primaryOwnerId"]})

        if not user and not esp_entity:
            return api_error("Registration request not found.", status_code=404)

        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        user_email = user.get("email") if user else (esp_entity.get("officialEmail") if esp_entity else None)
        user_name = user.get("fullName") if user else (esp_entity.get("name") if esp_entity else "Partner")
        requested_role = user.get("registrationRequest", {}).get("requestedRole", "ESP" if esp_entity else "User") if user else "ESP"

        if action == "APPROVE":
            # Check Idempotency: Has this approval already been executed and email dispatched?
            is_already_active = bool(
                (user and user.get("accountStatus") == "ACTIVE") or
                (esp_entity and esp_entity.get("verificationStatus") == "VERIFIED" and esp_entity.get("isActive") is True)
            )
            is_already_emailed = bool(
                (user and user.get("activationEmailSent")) or
                (esp_entity and esp_entity.get("activationEmailSent"))
            )

            if is_already_active and is_already_emailed:
                # Avoid sending duplicate activation emails on approval retry
                log_audit_event(
                    admin_id=admin_id,
                    action="REGISTRATION_APPROVAL_RETRY_SKIPPED",
                    object_type="USER_REGISTRATION",
                    object_id=user["id"] if user else user_id,
                    reason="Approval retry detected; duplicate email dispatch prevented."
                )
                return api_success({
                    "userId": user["id"] if user else user_id,
                    "status": "ACTIVE",
                    "emailSent": False,
                    "alreadySent": True,
                    "alreadyActive": True,
                    "emailOutcome": "ALREADY_SENT",
                    "message": f"Account is already active. Activation email was previously dispatched to {user_email}; duplicate email skipped."
                }, f"Account is already active. Activation email was previously dispatched to {user_email}.")

            # 1. Activate User in Database
            if user:
                users_col.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "accountStatus": "ACTIVE",
                        "isActive": True,
                        "registrationRequest.status": "APPROVED",
                        "approvedAt": now_iso,
                        "approvedBy": admin_id,
                        "activationEmailSent": True,
                        "activationEmailSentAt": now_iso,
                        "updatedAt": now_iso
                    }}
                )

            # 2. Activate Entity if present
            owner_id = user["id"] if user else (esp_entity.get("primaryOwnerId") if esp_entity else None)
            if owner_id:
                entities_col.update_many(
                    {"$or": [{"id": user_id}, {"primaryOwnerId": owner_id}]},
                    {"$set": {
                        "verificationStatus": "VERIFIED",
                        "isActive": True,
                        "verifiedAt": now_iso,
                        "verifiedBy": admin_id,
                        "activationEmailSent": True,
                        "activationEmailSentAt": now_iso
                    }}
                )

            # 3. Dispatch Email Activation Confirmation from no-reply@xentro.in
            frontend_url = os.getenv("FRONTEND_URL", "https://xentro-five.vercel.app/signin")
            email_result = None
            if user_email:
                email_result = send_account_activation_notification(
                    email=user_email,
                    user_name=user_name,
                    login_url=frontend_url,
                    role=requested_role
                )

            email_success = bool(email_result and email_result.get("success"))

            # 4. Audit Log
            log_audit_event(
                admin_id=admin_id,
                action="REGISTRATION_APPROVED",
                object_type="USER_REGISTRATION",
                object_id=user["id"] if user else user_id,
                reason=notes or f"Approved {requested_role} account for {user_email}",
                new_state={"accountStatus": "ACTIVE", "isActive": True, "activationEmailSent": email_success}
            )

            return api_success({
                "userId": user["id"] if user else user_id,
                "status": "ACTIVE",
                "emailSent": email_success,
                "alreadySent": False,
                "emailOutcome": "DELIVERED" if email_success else "FAILED",
                "emailDetails": email_result
            }, f"Account registration approved and activation email dispatched from no-reply@xentro.in to {user_email}.")

        elif action == "REJECT":
            if user:
                users_col.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "accountStatus": "REJECTED",
                        "isActive": False,
                        "registrationRequest.status": "REJECTED",
                        "rejectionReason": notes,
                        "updatedAt": now_iso
                    }}
                )

            owner_id = user["id"] if user else (esp_entity.get("primaryOwnerId") if esp_entity else None)
            if owner_id:
                entities_col.update_many(
                    {"$or": [{"id": user_id}, {"primaryOwnerId": owner_id}]},
                    {"$set": {
                        "verificationStatus": "REJECTED",
                        "isActive": False,
                        "rejectionReason": notes
                    }}
                )

            log_audit_event(
                admin_id=admin_id,
                action="REGISTRATION_REJECTED",
                object_type="USER_REGISTRATION",
                object_id=user["id"] if user else user_id,
                reason=notes or "Registration rejected by administration team",
                new_state={"accountStatus": "REJECTED", "isActive": False}
            )

            return api_success({
                "userId": user["id"] if user else user_id,
                "status": "REJECTED",
                "rejectionReason": notes
            }, "Registration request has been rejected.")
        else:
            return api_error("Invalid action. Must be APPROVE or REJECT.")


class AdminUserDetailView(APIView):
    """
    Master Admin User Management:
    - GET: View single user account details. (Requires IsXentroAdmin)
    - PATCH / PUT: Update user account details (fullName, email, phone, role, accountStatus, isActive, bio).
      CRITICAL: Strictly restricted to Master Admin (Super Admin).
      Enforced on backend API (returns 403 Forbidden for non-master admins).
    - DELETE: Permanently delete user account with safeguards and audit logging.
      CRITICAL: Strictly restricted to Master Admin (Super Admin).
      Safeguards:
        1. Cannot delete self (prevents locking admin out).
        2. Requires explicit confirmation parameter / matching email confirmation.
        3. Comprehensive audit logging recorded before deletion.
    """
    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsXentroMasterAdmin()]
        return [IsXentroAdmin()]

    def get(self, request, user_id):
        users_col = get_collection("users")
        user = users_col.find_one({"id": user_id})
        if not user:
            return api_error("User account not found.", status_code=404)

        user_data = dict(user)
        user_data.pop("_id", None)
        user_data.pop("password", None)
        user_data.pop("password_hash", None)
        return api_success({"user": user_data})

    def patch(self, request, user_id):
        return self.put(request, user_id)

    def put(self, request, user_id):
        # Strict backend permission check (defense-in-depth)
        admin_role = getattr(request.user, "admin_role", None) or getattr(request.user, "role", None)
        if admin_role not in ("Super Admin", "Master Admin"):
            return api_error("Forbidden: Only the Master Admin is authorized to edit user accounts.", status_code=403)

        users_col = get_collection("users")
        user = users_col.find_one({"id": user_id})
        if not user:
            return api_error("User account not found.", status_code=404)

        data = request.data
        prev_state = {
            "fullName": user.get("fullName"),
            "email": user.get("email"),
            "phoneNumber": user.get("phoneNumber"),
            "accountStatus": user.get("accountStatus"),
            "isActive": user.get("isActive"),
            "identityStatus": user.get("identityStatus"),
            "activeRoles": user.get("activeRoles")
        }

        updates = {}
        if "fullName" in data or "name" in data:
            updates["fullName"] = str(data.get("fullName") or data.get("name")).strip()
        if "email" in data:
            new_email = str(data["email"]).strip().lower()
            if new_email and new_email != user.get("email", "").lower():
                existing = users_col.find_one({"email": new_email, "id": {"$ne": user_id}})
                if existing:
                    return api_error("Another account already exists with this email address.", status_code=400)
                updates["email"] = new_email
        if "phoneNumber" in data or "phone" in data:
            updates["phoneNumber"] = str(data.get("phoneNumber") or data.get("phone")).strip()
        if "accountStatus" in data:
            updates["accountStatus"] = str(data["accountStatus"]).strip().upper()
        if "isActive" in data:
            updates["isActive"] = bool(data["isActive"])
        if "identityStatus" in data:
            updates["identityStatus"] = str(data["identityStatus"]).strip().upper()
        if "role" in data or "accountType" in data or "requestedRole" in data:
            new_role = str(data.get("role") or data.get("accountType") or data.get("requestedRole")).strip()
            updates["activeRoles"] = [new_role]
            updates["registrationRequest.requestedRole"] = new_role
        if "bio" in data:
            updates["bio"] = str(data["bio"]).strip()

        if not updates:
            return api_error("No valid fields provided for update.", status_code=400)

        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        updates["updatedAt"] = now_iso
        updates["updatedBy"] = admin_id

        users_col.update_one({"id": user_id}, {"$set": updates})
        updated_user = users_col.find_one({"id": user_id})
        updated_user.pop("_id", None)
        updated_user.pop("password", None)
        updated_user.pop("password_hash", None)

        log_audit_event(
            admin_id=admin_id,
            action="USER_ACCOUNT_UPDATED",
            object_type="USER",
            object_id=user_id,
            previous_state=prev_state,
            new_state=updates,
            reason=data.get("reason") or "User account updated by Master Admin"
        )

        return api_success({"user": updated_user}, "User account updated successfully.")

    def delete(self, request, user_id):
        # Strict backend permission check (defense-in-depth)
        admin_role = getattr(request.user, "admin_role", None) or getattr(request.user, "role", None)
        if admin_role not in ("Super Admin", "Master Admin"):
            return api_error("Forbidden: Only the Master Admin is authorized to delete user accounts.", status_code=403)

        users_col = get_collection("users")
        user = users_col.find_one({"id": user_id})
        if not user:
            return api_error("User account not found.", status_code=404)

        # Safeguard 1: Master Admin cannot delete self
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")
        req_user_id = getattr(request.user, "id", None)
        req_email = getattr(request.user, "email", "")
        if user_id in (str(admin_id), str(req_user_id)) or (req_email and user.get("email", "").lower() == req_email.lower()):
            return api_error("Safeguard triggered: Master Admin cannot delete their own active administrative account.", status_code=400)

        # Safeguard 2: Confirmation required
        confirmation = request.data.get("confirmation") or request.data.get("confirm") or request.query_params.get("confirm")
        confirm_email = request.data.get("confirm_email") or request.data.get("email")
        is_confirmed = (confirmation in (True, "true", "True", "DELETE", "delete")) or (confirm_email and confirm_email.lower() == user.get("email", "").lower())

        if not is_confirmed:
            return api_error(
                "Safeguard triggered: Explicit confirmation is required to delete an account. Provide 'confirmation': true or match the target user email in 'confirm_email'.",
                status_code=400
            )

        # Safeguard 3: Audit logging before permanent purge
        reason = request.data.get("reason", "Account permanently deleted by Master Admin with confirmation safeguard.")
        prev_state = {
            "id": user_id,
            "email": user.get("email"),
            "fullName": user.get("fullName"),
            "accountStatus": user.get("accountStatus"),
            "createdAt": user.get("createdAt")
        }
        log_audit_event(
            admin_id=admin_id,
            action="USER_ACCOUNT_DELETED",
            object_type="USER",
            object_id=user_id,
            previous_state=prev_state,
            reason=reason
        )

        # Perform deletion from MongoDB
        users_col.delete_one({"id": user_id})

        # Clean up pending OTPs
        try:
            get_collection("otp_codes").delete_many({"email": user.get("email", "").lower()})
        except Exception:
            pass

        # Clean up / orphan owned entities
        try:
            entities_col = get_collection("entities")
            entities_col.update_many(
                {"primaryOwnerId": user_id},
                {"$set": {
                    "isActive": False,
                    "status": "ORPHANED_DELETED",
                    "orphanedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }}
            )
        except Exception:
            pass

        return api_success({"deletedUserId": user_id}, f"User account for {user.get('email')} permanently deleted.")


class AdminRolesListView(APIView):
    """Returns all supported Admin roles and their respective permissions."""
    permission_classes = [AllowAny]

    def get(self, request):
        hierarchy_data = []
        for role_name, perms in ADMIN_ROLE_PERMISSIONS.items():
            level = 1 if role_name == "Super Admin" else (2 if "Operations" in role_name else 3)
            hierarchy_data.append({
                "role": role_name,
                "hierarchyLevel": level,
                "permissionsCount": len(perms),
                "permissions": perms
            })
        return api_success({
            "roles": hierarchy_data,
            "hierarchy": ADMIN_ROLE_PERMISSIONS
        })

class AdminSwitchRoleView(APIView):
    """
    Switches current admin role and returns an updated JWT with permissions reflecting the role hierarchy.
    """
    permission_classes = [IsXentroAdmin]

    def post(self, request):
        target_role = request.data.get("role", "Super Admin")
        if target_role not in ADMIN_ROLE_PERMISSIONS:
            return api_error(f"Invalid admin role '{target_role}'. Valid roles: {list(ADMIN_ROLE_PERMISSIONS.keys())}")

        perms = ADMIN_ROLE_PERMISSIONS[target_role]

        admin_id = getattr(request.user, "admin_employee_id", "ADMIN")
        admin_name = getattr(request.user, "full_name", "Admin")

        token_payload = {
            "employeeId": admin_id,
            "name": admin_name,
            "role": target_role,
            "department": getattr(request.user, "department", "Operations"),
            "permissions": perms,
            "is_staff": True
        }
        new_token = create_access_token(token_payload)

        return api_success({
            "role": target_role,
            "permissions": perms,
            "token": new_token
        }, f"Switched to {target_role} successfully.")

class AdminAuditLogsView(APIView):
    permission_classes = [IsXentroAdmin]

    def get(self, request):
        audit_col = get_collection("audit_logs")
        logs = audit_col.find({}, sort=[("timestamp", -1)], limit=100)
        # Format for response
        clean_logs = []
        for l in logs:
            l.pop("_id", None)
            clean_logs.append(l)
        return api_success({"logs": clean_logs})

class AdminUsersListView(APIView):
    """
    Returns all real registered user accounts from the database for the Admin Personal Accounts view.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        users_col = get_collection("users")
        all_users = list(users_col.find(
            {
                "deleted": {"$ne": True},
                "is_deleted": {"$ne": True},
                "accountStatus": {"$ne": "DELETED"}
            },
            sort=[("createdAt", -1)],
            limit=200
        ))
        result = []
        for u in all_users:
            req_info = u.get("registrationRequest", {})
            result.append({
                "id": u["id"],
                "name": u.get("fullName", u.get("username", "Unnamed User")),
                "email": u.get("email", ""),
                "phone": u.get("phoneNumber", ""),
                "avatar": f"https://api.dicebear.com/7.x/initials/svg?seed={u.get('fullName', u.get('username', 'User'))}",
                "identityStatus": u.get("identityStatus", "NOT_SUBMITTED").capitalize(),
                "accountStatus": u.get("accountStatus", "PENDING_APPROVAL"),
                "isActive": u.get("isActive", False),
                "participationModes": u.get("activeRoles", ["Personal Account"]),
                "role": req_info.get("requestedRole", u.get("activeRoles", ["Founder"])[0]),
                "institutionName": req_info.get("institutionName", ""),
                "createdDate": u.get("createdAt", "")[:10] if u.get("createdAt") else "",
                "createdAt": u.get("createdAt", ""),
                "lastActive": "Just now",
                "connectionsCount": 0,
                "bio": f"Registered as {req_info.get('requestedRole', 'User')}" + (f" at {req_info.get('institutionName')}" if req_info.get('institutionName') else ""),
                "entityMemberships": [
                    {
                        "entityId": "ent-" + u["id"],
                        "entityName": req_info.get("institutionName") or f"{u.get('fullName', 'User')}'s Startup",
                        "entityType": "ESP" if req_info.get("requestedRole") == "ESP" or req_info.get("institutionName") else "Startup",
                        "role": req_info.get("requestedRole", "Founder")
                    }
                ] if req_info.get("institutionName") or req_info.get("requestedRole") in ["ESP", "Founder"] else []
            })
        return api_success({"users": result, "total": len(result)})


class AdminEntitiesListView(APIView):
    """
    Returns real entity records (Startups, Investors, ESPs) from MongoDB for Admin Entity Accounts view.
    Excludes orphaned/deleted records.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        entities_col = get_collection("entities")
        users_col = get_collection("users")

        query = {
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        }
        all_entities = list(entities_col.find(query, sort=[("createdAt", -1)], limit=200))
        results = []
        for e in all_entities:
            e.pop("_id", None)
            owner_id = e.get("primaryOwnerId") or e.get("founderPersonalAccountId")
            owner_name = e.get("primaryOwnerName") or e.get("founderName") or "Founder"
            owner_email = e.get("officialEmail") or ""
            if owner_id:
                owner = users_col.find_one({"id": owner_id, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
                if not owner:
                    # Owner was deleted, do not surface orphaned entity
                    continue
                owner_name = owner.get("fullName", owner_name)
                owner_email = owner.get("email", owner_email)

            e_type = e.get("entityType", "Startup")
            if str(e_type).upper() == "STARTUP":
                ui_type = "Startup"
            elif str(e_type).upper() == "ESP":
                ui_type = "ESP"
            elif str(e_type).upper() == "INVESTOR":
                ui_type = "Investor Organization"
            else:
                ui_type = e_type

            results.append({
                "id": e.get("id"),
                "name": e.get("name") or e.get("startupName") or "Entity",
                "legalName": e.get("name") or "Entity Legal",
                "type": ui_type,
                "domain": e.get("officialDomain") or e.get("website") or "",
                "officialEmail": owner_email or e.get("officialEmail") or "",
                "status": "Active" if e.get("isActive", True) else "Suspended",
                "verificationStatus": "Verified" if str(e.get("verificationStatus", "")).upper() == "VERIFIED" else "Pending",
                "primaryOwner": {
                    "id": owner_id or "",
                    "name": owner_name,
                    "email": owner_email,
                    "role": "Founder / Owner"
                },
                "totalMembers": 1,
                "workspacesCount": 1,
                "createdAt": e.get("createdAt", ""),
                "createdDate": (e.get("createdAt") or "")[:10]
            })

        return api_success({"entities": results, "total": len(results)})


class AdminEntityDeleteView(APIView):
    """
    Allows Master Admin to delete or remove an entity from MongoDB with audit logging.
    """
    def get_permissions(self):
        return [IsXentroMasterAdmin()]

    def delete(self, request, entity_id):
        entities_col = get_collection("entities")
        ent = entities_col.find_one({"id": entity_id})
        if not ent:
            return api_error("Entity not found.", status_code=404)

        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Audit log before deletion
        log_audit_event(
            admin_id=admin_id,
            action="ENTITY_ACCOUNT_DELETED",
            object_type="ENTITY",
            object_id=entity_id,
            previous_state={"id": entity_id, "name": ent.get("name"), "type": ent.get("entityType")},
            reason=request.data.get("reason", "Entity removed by Master Admin.")
        )

        # Mark as deleted in MongoDB
        entities_col.update_one(
            {"id": entity_id},
            {"$set": {
                "isActive": False,
                "is_deleted": True,
                "deleted": True,
                "status": "DELETED",
                "deletedAt": now_iso
            }}
        )

        return api_success({"deletedEntityId": entity_id}, f"Entity '{ent.get('name')}' removed successfully.")


class AdminComplaintsListView(APIView):
    """
    GET /api/v1/admin/complaints/
    Lists all user complaints and support submissions from MongoDB for administrative review.
    Enforces internal administrative permissions.
    """
    def get_permissions(self):
        return [IsXentroAdmin()]

    def get(self, request):
        tickets_col = get_collection("support_tickets")
        status_filter = (request.query_params.get("status") or "").strip().upper()
        search = (request.query_params.get("search") or "").strip().lower()

        query = {}
        if status_filter and status_filter != "ALL":
            if status_filter in ["COMPLAINT_RECEIVED", "PENDING"]:
                query["status"] = {"$in": ["COMPLAINT_RECEIVED", "PENDING"]}
            elif status_filter in ["UNDER_INVESTIGATION", "IN_REVIEW"]:
                query["status"] = {"$in": ["UNDER_INVESTIGATION", "IN_REVIEW"]}
            elif status_filter in ["RESOLVED", "DISMISSED"]:
                query["status"] = status_filter

        raw_tickets = list(tickets_col.find(query, sort=[("createdAt", -1)]))
        results = []

        total_pending = tickets_col.count_documents({"status": {"$in": ["COMPLAINT_RECEIVED", "PENDING"]}})
        total_in_review = tickets_col.count_documents({"status": {"$in": ["UNDER_INVESTIGATION", "IN_REVIEW"]}})
        total_resolved = tickets_col.count_documents({"status": "RESOLVED"})
        total_dismissed = tickets_col.count_documents({"status": "DISMISSED"})
        total_all = tickets_col.count_documents({})

        for t in raw_tickets:
            t.pop("_id", None)
            if search:
                haystack = f"{t.get('id', '')} {t.get('subject', '')} {t.get('message', '')} {t.get('userName', '')} {t.get('userEmail', '')} {t.get('accountId', '')}".lower()
                if search not in haystack:
                    continue
            results.append(t)

        return api_success({
            "complaints": results,
            "total": len(results),
            "counts": {
                "all": total_all,
                "pending": total_pending,
                "complaintReceived": total_pending,
                "inReview": total_in_review,
                "underInvestigation": total_in_review,
                "resolved": total_resolved,
                "dismissed": total_dismissed
            }
        })


class AdminComplaintDetailView(APIView):
    """
    GET   /api/v1/admin/complaints/<str:ticket_id>/
    PATCH /api/v1/admin/complaints/<str:ticket_id>/
    Retrieves or updates complaint status and administrative notes with audit logging.
    """
    def get_permissions(self):
        return [IsXentroAdmin()]

    def get(self, request, ticket_id):
        tickets_col = get_collection("support_tickets")
        ticket = tickets_col.find_one({"id": ticket_id})
        if not ticket:
            return api_error("Complaint ticket not found.", status_code=404)
        ticket.pop("_id", None)
        return api_success({"complaint": ticket})

    def patch(self, request, ticket_id):
        tickets_col = get_collection("support_tickets")
        ticket = tickets_col.find_one({"id": ticket_id})
        if not ticket:
            return api_error("Complaint ticket not found.", status_code=404)

        admin_id = getattr(request.user, "admin_employee_id", "ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        new_status = request.data.get("status")
        admin_notes = request.data.get("adminNotes")
        resolution_comment = request.data.get("resolutionComment")
        priority = request.data.get("priority")

        updates = {
            "updatedAt": now_iso,
            "updatedBy": admin_id
        }

        if new_status:
            clean_status = str(new_status).strip().upper()
            status_map = {
                "PENDING": "COMPLAINT_RECEIVED",
                "COMPLAINT_RECEIVED": "COMPLAINT_RECEIVED",
                "IN_REVIEW": "UNDER_INVESTIGATION",
                "UNDER_INVESTIGATION": "UNDER_INVESTIGATION",
                "RESOLVED": "RESOLVED",
                "DISMISSED": "DISMISSED",
            }
            if clean_status in status_map:
                canonical = status_map[clean_status]
                updates["status"] = canonical
                if canonical in ["RESOLVED", "DISMISSED"]:
                    updates["resolvedAt"] = now_iso
                    updates["resolvedBy"] = admin_id

        if admin_notes is not None:
            updates["adminNotes"] = str(admin_notes).strip()
        if resolution_comment is not None:
            updates["resolutionComment"] = str(resolution_comment).strip()
        if priority:
            updates["priority"] = str(priority).strip().upper()

        log_audit_event(
            admin_id=admin_id,
            action="COMPLAINT_STATUS_UPDATED",
            object_type="SUPPORT_TICKET",
            object_id=ticket_id,
            previous_state={"status": ticket.get("status"), "adminNotes": ticket.get("adminNotes")},
            reason=f"Status changed to {updates.get('status', ticket.get('status'))} by {admin_id}"
        )

        tickets_col.update_one({"id": ticket_id}, {"$set": updates})
        updated = tickets_col.find_one({"id": ticket_id})
        updated.pop("_id", None)

        return api_success({"complaint": updated}, "Complaint status updated successfully.")

    def put(self, request, ticket_id):
        return self.patch(request, ticket_id)


class AdminFeedListView(APIView):
    """
    GET /api/v1/admin/feed/
    Enables authorized administrators to review all ecosystem feed posts and post metadata.
    """
    def get_permissions(self):
        return [IsXentroAdmin()]

    def get(self, request):
        feed_col = get_collection("feed_posts")
        likes_col = get_collection("post_likes")
        comments_col = get_collection("post_comments")
        users_col = get_collection("users")

        search = (request.query_params.get("search") or "").strip().lower()

        posts = list(feed_col.find(
            {"is_deleted": {"$ne": True}, "deleted": {"$ne": True}, "status": {"$nin": ["DELETED", "ARCHIVED"]}},
            sort=[("createdAt", -1)],
            limit=100
        ))

        clean = []
        for p in posts:
            p.pop("_id", None)
            post_id = p.get("id")

            # Enrich author info
            author_id = p.get("authorId")
            u_doc = None
            if author_id:
                u_doc = users_col.find_one({"id": author_id})

            author_name = (u_doc.get("fullName") or u_doc.get("username") if u_doc else p.get("authorName")) or "Ecosystem Member"
            author_role = (u_doc.get("role") or u_doc.get("accountType") if u_doc else p.get("authorRole")) or "Ecosystem Member"
            author_company = (u_doc.get("startupName") or u_doc.get("organization") if u_doc else p.get("authorCompany")) or ""
            author_avatar = (u_doc.get("avatar") if u_doc else p.get("authorAvatar")) or f"https://api.dicebear.com/7.x/initials/svg?seed={author_name}"

            p["authorName"] = author_name
            p["authorRole"] = author_role
            p["authorCompany"] = author_company
            p["authorAvatar"] = author_avatar
            p["authorId"] = author_id or p.get("authorId", "")
            p["likesCount"] = likes_col.count_documents({"postId": post_id})
            comments = list(comments_col.find({"postId": post_id}, sort=[("createdAt", 1)]))
            for c in comments:
                c.pop("_id", None)
            p["commentsList"] = comments
            p["commentsCount"] = len(comments)

            if search:
                haystack = f"{p.get('id', '')} {p.get('content', '')} {author_name} {author_role} {' '.join(p.get('tags', []))}".lower()
                if search not in haystack:
                    continue

            clean.append(p)

        return api_success({
            "posts": clean,
            "total": len(clean),
            "totalPlatformPosts": feed_col.count_documents({"is_deleted": {"$ne": True}})
        })


class AdminFeedPostDeleteView(APIView):
    """
    DELETE /api/v1/admin/feed/<str:post_id>/
    Allows authorized administrators to moderate and delete feed posts.
    """
    def get_permissions(self):
        return [IsXentroAdmin()]

    def delete(self, request, post_id):
        feed_col = get_collection("feed_posts")
        post = feed_col.find_one({"id": post_id})
        if not post:
            return api_error("Post not found.", status_code=404)

        admin_id = getattr(request.user, "admin_employee_id", "ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        log_audit_event(
            admin_id=admin_id,
            action="FEED_POST_DELETED",
            object_type="FEED_POST",
            object_id=post_id,
            previous_state={"id": post_id, "authorId": post.get("authorId"), "contentSnippet": str(post.get("content", ""))[:80]},
            reason=request.data.get("reason", "Inappropriate content or policy violation.")
        )

        feed_col.update_one(
            {"id": post_id},
            {"$set": {
                "is_deleted": True,
                "deleted": True,
                "status": "DELETED",
                "deletedAt": now_iso,
                "deletedBy": admin_id
            }}
        )

        return api_success({"deletedPostId": post_id}, "Post moderated and removed successfully.")

