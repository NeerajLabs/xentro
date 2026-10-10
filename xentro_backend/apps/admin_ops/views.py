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
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User account not found.", status_code=404)

        user_data = dict(user)
        user_data.pop("_id", None)
        user_data.pop("password", None)
        user_data.pop("password_hash", None)
        user_data.pop("passwordHash", None)

        # 5.1 Identity & Contact
        identity_contact = {
            "id": user.get("id"),
            "profileId": user.get("profileId") or user.get("id"),
            "fullName": user.get("fullName", user.get("name", "")),
            "email": user.get("email", ""),
            "phoneNumber": user.get("phoneNumber", ""),
            "accountType": user.get("accountType", "Explorer"),
            "username": user.get("username", ""),
            "createdAt": user.get("createdAt", ""),
            "updatedAt": user.get("updatedAt", ""),
            "onboardingCompleted": user.get("onboardingCompleted", False)
        }

        # 5.2 Signup & Verification
        signup_verification = {
            "emailVerified": user.get("emailVerified", False),
            "emailVerifiedAt": user.get("emailVerifiedAt", ""),
            "phoneVerified": user.get("phoneVerified", False),
            "agreedToTerms": user.get("agreedToTerms", False),
            "termsAcceptedAt": user.get("termsAcceptedAt", ""),
            "termsVersion": user.get("termsVersion", "1.0"),
            "agreedToPrivacy": user.get("agreedToPrivacy", False),
            "privacyAcceptedAt": user.get("privacyAcceptedAt", ""),
            "privacyVersion": user.get("privacyVersion", "1.0"),
            "consentIdentityVerification": user.get("consentIdentityVerification", False),
            "identityConsentAt": user.get("identityConsentAt", ""),
            "identityConsentVersion": user.get("identityConsentVersion", "1.0"),
            "identityStatus": user.get("identityStatus", "NOT_SUBMITTED"),
            "verificationSubmittedAt": user.get("verificationSubmittedAt", ""),
            "verificationReviewedAt": user.get("verificationReviewedAt", ""),
            "reviewedBy": user.get("identityReviewedBy", "")
        }

        # 5.3 Personal Profile
        p_prof = user.get("personalProfile") or {}
        personal_profile = {
            "photoUrl": user.get("photoUrl") or user.get("avatar") or p_prof.get("photoUrl"),
            "headline": user.get("headline") or p_prof.get("headline", ""),
            "location": user.get("location") or p_prof.get("location", ""),
            "structuredLocation": p_prof.get("structuredLocation") or {},
            "currentRole": user.get("currentRole") or p_prof.get("currentRole", ""),
            "currentOrganization": user.get("currentOrganization") or user.get("organization") or p_prof.get("currentOrganization", ""),
            "bio": user.get("bio") or p_prof.get("bio", ""),
            "skills": user.get("skills") or p_prof.get("skills", []),
            "industries": user.get("industries") or p_prof.get("industries", []),
            "ecosystemInterests": p_prof.get("ecosystemInterests", []),
            "ecosystemGoals": p_prof.get("ecosystemGoals", []),
            "socialLinks": {
                "linkedin": user.get("linkedin") or p_prof.get("linkedin", ""),
                "website": user.get("website") or p_prof.get("website", ""),
                "otherLinks": user.get("otherLinks") or p_prof.get("otherLinks", [])
            },
            "visibility": p_prof.get("visibility", "PUBLIC")
        }

        # 5.4 Education
        education = p_prof.get("education") or user.get("education") or []
        if isinstance(education, str):
            education = [{"institution": education, "degree": "", "fieldOfStudy": "", "startYear": "", "endYear": "", "currentlyStudying": False}] if education else []

        # 5.5 Personal Roles
        mentor_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")
        m_app = mentor_col.find_one({"userId": user.get("id")})
        if m_app: m_app.pop("_id", None)
        i_app = inv_col.find_one({"userId": user.get("id")})
        if i_app: i_app.pop("_id", None)

        personal_roles = {
            "baseRole": "Explorer",
            "baseRoleStatus": "Active",
            "mentorRole": m_app.get("status", "Not Applied") if m_app else "Not Applied",
            "mentorDetails": m_app,
            "investorRole": i_app.get("status", "Not Applied") if i_app else "Not Applied",
            "investorDetails": i_app
        }

        # 5.6 Entity Memberships
        entities_col = get_collection("entities")
        mem_col = get_collection("memberships")
        user_memberships = list(mem_col.find({"userId": user.get("id")}))
        entity_memberships = []
        for m in user_memberships:
            ent = entities_col.find_one({"id": m.get("entityId")})
            entity_memberships.append({
                "entityId": m.get("entityId"),
                "entityName": ent.get("name") if ent else m.get("entityName", "Entity"),
                "entityType": ent.get("entityType") if ent else m.get("entityType", "Startup"),
                "role": m.get("role", "Member"),
                "status": m.get("status", "ACTIVE"),
                "verificationStatus": ent.get("verificationStatus", "PENDING") if ent else "PENDING",
                "createdAt": m.get("createdAt")
            })
        owned_ents = list(entities_col.find({"primaryOwnerId": user.get("id"), "status": {"$nin": ["ORPHANED_DELETED", "DELETED"]}}))
        for ent in owned_ents:
            if not any(e["entityId"] == ent["id"] for e in entity_memberships):
                entity_memberships.append({
                    "entityId": ent["id"],
                    "entityName": ent.get("name", "Entity"),
                    "entityType": ent.get("entityType", "Startup"),
                    "role": "Founder / Owner",
                    "status": "ACTIVE" if ent.get("isActive", True) else "INACTIVE",
                    "verificationStatus": ent.get("verificationStatus", "PENDING"),
                    "createdAt": ent.get("createdAt")
                })

        # 5.7 Account Activity
        audit_col = get_collection("audit_logs")
        recent_activity = list(audit_col.find(
            {"$or": [{"objectId": user.get("id")}, {"object_id": user.get("id")}, {"userId": user.get("id")}]},
            sort=[("timestamp", -1)],
            limit=20
        ))
        clean_activity = []
        for a in recent_activity:
            a.pop("_id", None)
            clean_activity.append(a)

        return api_success({
            "user": user_data,
            "identityContact": identity_contact,
            "signupVerification": signup_verification,
            "personalProfile": personal_profile,
            "education": education,
            "personalRoles": personal_roles,
            "entityMemberships": entity_memberships,
            "accountActivity": clean_activity
        })

    def patch(self, request, user_id):
        return self.put(request, user_id)

    def put(self, request, user_id):
        # Strict backend permission check (defense-in-depth)
        admin_role = getattr(request.user, "admin_role", None) or getattr(request.user, "role", None)
        if admin_role not in ("Super Admin", "Master Admin"):
            return api_error("Forbidden: Only the Master Admin is authorized to edit user accounts.", status_code=403)

        users_col = get_collection("users")
        prof_col = get_collection("personal_profiles")
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
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
        prof_updates = {}
        if "fullName" in data or "name" in data:
            val = str(data.get("fullName") or data.get("name")).strip()
            updates["fullName"] = val
            prof_updates["fullName"] = val
        if "email" in data:
            new_email = str(data["email"]).strip().lower()
            if new_email and new_email != user.get("email", "").lower():
                existing = users_col.find_one({"email": new_email, "id": {"$ne": user.get("id")}})
                if existing:
                    return api_error("Another account already exists with this email address.", status_code=400)
                updates["email"] = new_email
        if "phoneNumber" in data or "phone" in data:
            updates["phoneNumber"] = str(data.get("phoneNumber") or data.get("phone")).strip()
        if "headline" in data:
            updates["headline"] = str(data["headline"]).strip()
            prof_updates["headline"] = str(data["headline"]).strip()
        if "location" in data:
            updates["location"] = str(data["location"]).strip()
            prof_updates["location"] = str(data["location"]).strip()
        if "currentRole" in data:
            updates["currentRole"] = str(data["currentRole"]).strip()
            prof_updates["currentRole"] = str(data["currentRole"]).strip()
        if "currentOrganization" in data:
            updates["currentOrganization"] = str(data["currentOrganization"]).strip()
            prof_updates["currentOrganization"] = str(data["currentOrganization"]).strip()
        if "education" in data:
            updates["education"] = data["education"]
            prof_updates["education"] = data["education"]
        if "bio" in data:
            updates["bio"] = str(data["bio"]).strip()
            prof_updates["bio"] = str(data["bio"]).strip()
        if "skills" in data:
            updates["skills"] = data["skills"] if isinstance(data["skills"], list) else [data["skills"]]
            prof_updates["skills"] = updates["skills"]
        if "industries" in data:
            updates["industries"] = data["industries"] if isinstance(data["industries"], list) else [data["industries"]]
            prof_updates["industries"] = updates["industries"]
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

        if not updates:
            return api_error("No valid fields provided for update.", status_code=400)

        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        updates["updatedAt"] = now_iso
        updates["updatedBy"] = admin_id

        # Update user record
        users_col.update_one({"id": user.get("id")}, {"$set": updates})

        # Synchronize canonical personal_profiles document
        if prof_updates:
            prof_updates["updatedAt"] = now_iso
            prof_col.update_one(
                {"$or": [{"userId": user.get("id")}, {"profileId": user.get("profileId")}]},
                {"$set": prof_updates},
                upsert=True
            )

        updated_user = users_col.find_one({"id": user.get("id")})
        updated_user.pop("_id", None)
        updated_user.pop("password", None)
        updated_user.pop("password_hash", None)
        updated_user.pop("passwordHash", None)

        log_audit_event(
            admin_id=admin_id,
            action="USER_ACCOUNT_UPDATED",
            object_type="USER",
            object_id=user.get("id"),
            previous_state=prev_state,
            reason=data.get("reason", "Administrative update by Super Admin")
        )
        return api_success({"user": updated_user}, f"User account for {updated_user.get('email')} updated successfully.")

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
    Returns all real registered user accounts from MongoDB for the Admin Personal Accounts view.
    Zero dummy data. Calculates dynamic participation modes, actual entity memberships,
    and server-side filtered status tabs and counts.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        users_col = get_collection("users")
        entities_col = get_collection("entities")
        mem_col = get_collection("memberships")
        conn_col = get_collection("connections")
        mentor_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")

        status_tab = request.query_params.get("status", "All").strip()
        mode_filter = request.query_params.get("mode", "All").strip()
        search_query = request.query_params.get("search", "").strip().lower()

        base_filter = {
            "accountStatus": {"$ne": "DELETED"}
        }

        all_users = list(users_col.find(base_filter, sort=[("createdAt", -1)], limit=500))

        # Real Tab Counts
        counts = {
            "all": 0,
            "requests": 0,
            "pending_verification": 0,
            "verified": 0,
            "restricted": 0,
            "suspended": 0,
            "archived": 0,
        }

        processed_users = []
        for u in all_users:
            u_id = u.get("id") or str(u.get("_id"))
            p_prof = u.get("personalProfile") or {}
            id_status_raw = str(u.get("identityStatus", "NOT_SUBMITTED")).upper()
            acct_status_raw = str(u.get("accountStatus", "ACTIVE")).upper()
            is_deleted = bool(u.get("deleted") or u.get("is_deleted"))

            # Normalize Identity Status for UI
            if id_status_raw in ["VERIFIED", "APPROVED"]:
                id_status_ui = "Verified"
            elif id_status_raw in ["UNDER_REVIEW", "IN_REVIEW"]:
                id_status_ui = "Under Review"
            elif id_status_raw == "PENDING":
                id_status_ui = "Pending"
            elif id_status_raw in ["REJECTED", "FAILED"]:
                id_status_ui = "Failed"
            else:
                id_status_ui = "Not Submitted"

            # Normalize Account Status for UI
            if is_deleted or acct_status_raw == "ARCHIVED":
                acct_status_ui = "Archived"
            elif acct_status_raw in ["SUSPENDED", "BANNED"]:
                acct_status_ui = "Suspended"
            elif acct_status_raw in ["RESTRICTED", "LOCKED"]:
                acct_status_ui = "Restricted"
            elif acct_status_raw in ["PENDING_APPROVAL", "PENDING_VERIFICATION", "PROFILE_SETUP_PENDING"]:
                acct_status_ui = "Pending Verification"
            else:
                acct_status_ui = "Active"

            is_reg_request = bool(
                acct_status_raw in ["PENDING_APPROVAL", "REGISTRATION_REQUESTED"] or
                (u.get("registrationRequest", {}).get("status") == "PENDING")
            )

            # Tab count tallies
            if not is_deleted and acct_status_ui != "Archived":
                counts["all"] += 1
            else:
                counts["archived"] += 1

            if is_reg_request:
                counts["requests"] += 1
            if id_status_ui in ["Pending", "Under Review"]:
                counts["pending_verification"] += 1
            if id_status_ui == "Verified":
                counts["verified"] += 1
            if acct_status_ui == "Restricted":
                counts["restricted"] += 1
            if acct_status_ui == "Suspended":
                counts["suspended"] += 1

            # Real Entity Memberships
            entity_memberships = []
            user_memberships = list(mem_col.find({"userId": u_id}))
            for m in user_memberships:
                ent = entities_col.find_one({"id": m.get("entityId")})
                if ent and not ent.get("is_deleted") and ent.get("status") != "ORPHANED_DELETED":
                    entity_memberships.append({
                        "entityId": ent.get("id"),
                        "entityName": ent.get("name") or ent.get("startupName") or "Entity",
                        "entityType": ent.get("entityType", "Startup"),
                        "role": m.get("role", "Member"),
                        "status": m.get("status", "ACTIVE")
                    })

            # Check owned entities
            owned_ents = list(entities_col.find({
                "primaryOwnerId": u_id,
                "isActive": {"$ne": False},
                "status": {"$nin": ["ORPHANED_DELETED", "DELETED"]}
            }))
            for ent in owned_ents:
                if not any(e["entityId"] == ent["id"] for e in entity_memberships):
                    entity_memberships.append({
                        "entityId": ent["id"],
                        "entityName": ent.get("name") or ent.get("startupName") or "Entity",
                        "entityType": ent.get("entityType", "Startup"),
                        "role": "Founder / Owner",
                        "status": "Active"
                    })

            # Real Participation Modes (Explorer is canonical base)
            participation_modes = ["Explorer"]
            m_prof = mentor_col.find_one({"userId": u_id, "status": {"$in": ["ACTIVE", "APPROVED", "Active"]}})
            if m_prof or "Mentor" in (u.get("activeRoles") or []):
                participation_modes.append("Mentor")

            i_prof = inv_col.find_one({"userId": u_id, "status": {"$in": ["ACTIVE", "APPROVED", "Active"]}})
            if i_prof or "Investor" in (u.get("activeRoles") or []) or "Individual Investor" in (u.get("activeRoles") or []):
                participation_modes.append("Individual Investor")

            has_startup = any(str(e.get("entityType", "")).upper() == "STARTUP" for e in entity_memberships)
            if has_startup or "Startup Founder" in (u.get("activeRoles") or []) or "Founder @ Startup" in (u.get("activeRoles") or []):
                participation_modes.append("Founder @ Startup")

            has_vc = any(str(e.get("entityType", "")).upper() in ["INVESTOR", "INVESTOR_ORG", "VCI"] for e in entity_memberships)
            if has_vc or "Partner @ VC" in (u.get("activeRoles") or []):
                participation_modes.append("Partner @ VC")

            has_esp = any(str(e.get("entityType", "")).upper() == "ESP" for e in entity_memberships)
            if has_esp or "Member @ ESP" in (u.get("activeRoles") or []):
                participation_modes.append("Member @ ESP")

            # Real Connections Count
            conn_count = conn_col.count_documents({
                "$or": [
                    {"requesterId": u_id, "status": "CONNECTED"},
                    {"receiverId": u_id, "status": "CONNECTED"}
                ]
            })

            # Last Active
            last_active = u.get("lastActive") or u.get("lastLogin") or "Unavailable"

            photo = u.get("photoUrl") or u.get("avatar") or p_prof.get("photoUrl")

            user_item = {
                "id": u_id,
                "profileId": u.get("profileId") or u_id,
                "name": u.get("fullName", u.get("name", u.get("username", "Explorer"))),
                "email": u.get("email", ""),
                "phone": u.get("phoneNumber", ""),
                "avatar": photo,
                "identityStatus": id_status_ui,
                "accountStatus": acct_status_ui,
                "isActive": acct_status_ui == "Active",
                "participationModes": list(dict.fromkeys(participation_modes)),
                "role": participation_modes[-1] if len(participation_modes) > 1 else "Explorer",
                "createdDate": (u.get("createdAt") or "")[:10],
                "createdAt": u.get("createdAt", ""),
                "lastActive": last_active,
                "connectionsCount": conn_count,
                "bio": u.get("bio") or p_prof.get("bio") or "Verified Xentro ecosystem member",
                "entityMemberships": entity_memberships,
                "isRegistrationRequest": is_reg_request
            }
            processed_users.append(user_item)

        # Tab Filtering
        filtered = []
        for pu in processed_users:
            if status_tab == "Registration Requests" and not pu["isRegistrationRequest"]:
                continue
            elif status_tab == "Pending Verification" and pu["identityStatus"] not in ["Pending", "Under Review"]:
                continue
            elif status_tab == "Verified" and pu["identityStatus"] != "Verified":
                continue
            elif status_tab == "Restricted" and pu["accountStatus"] != "Restricted":
                continue
            elif status_tab == "Suspended" and pu["accountStatus"] != "Suspended":
                continue
            elif status_tab == "Archived" and pu["accountStatus"] != "Archived":
                continue
            elif status_tab == "All" and pu["accountStatus"] == "Archived":
                continue

            # Mode Filtering
            if mode_filter != "All" and mode_filter not in pu["participationModes"]:
                continue

            # Text Search
            if search_query:
                match_name = search_query in pu["name"].lower()
                match_email = search_query in pu["email"].lower()
                match_phone = search_query in str(pu["phone"]).lower()
                match_id = search_query in pu["id"].lower()
                if not (match_name or match_email or match_phone or match_id):
                    continue

            filtered.append(pu)

        return api_success({
            "users": filtered,
            "total": len(filtered),
            "counts": counts
        })


class AdminUserVerifyIdentityView(APIView):
    """POST /api/v1/admin/users/<str:user_id>/verify-identity/"""
    permission_classes = [IsXentroAdmin]

    def post(self, request, user_id):
        action = request.data.get("action", "VERIFY").upper()
        notes = request.data.get("notes", "")
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")

        users_col = get_collection("users")
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User not found", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        new_status = "VERIFIED" if action == "VERIFY" else "REJECTED"

        users_col.update_one(
            {"id": user["id"]},
            {"$set": {
                "identityStatus": new_status,
                "identityReviewedBy": admin_id,
                "verificationReviewedAt": now_iso,
                "identityNotes": notes,
                "updatedAt": now_iso
            }}
        )

        log_audit_event(
            admin_id=admin_id,
            action=f"IDENTITY_{action}",
            object_type="USER_IDENTITY",
            object_id=user["id"],
            reason=notes or f"Identity verification {action.lower()} by admin."
        )

        return api_success({"userId": user["id"], "identityStatus": new_status}, f"Identity status set to {new_status}.")


class AdminUserRestrictView(APIView):
    """POST /api/v1/admin/users/<str:user_id>/restrict/"""
    permission_classes = [IsXentroAdmin]

    def post(self, request, user_id):
        reason = request.data.get("reason", "Account restricted due to policy review.")
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")

        users_col = get_collection("users")
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User not found", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        users_col.update_one(
            {"id": user["id"]},
            {"$set": {"accountStatus": "RESTRICTED", "isActive": False, "updatedAt": now_iso}}
        )
        log_audit_event(
            admin_id=admin_id,
            action="ACCOUNT_RESTRICTED",
            object_type="USER_ACCOUNT",
            object_id=user["id"],
            reason=reason
        )
        return api_success({"userId": user["id"], "accountStatus": "RESTRICTED"}, "Account has been restricted.")


class AdminUserSuspendView(APIView):
    """POST /api/v1/admin/users/<str:user_id>/suspend/"""
    permission_classes = [IsXentroAdmin]

    def post(self, request, user_id):
        reason = request.data.get("reason", "Account suspended by platform operations.")
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")

        users_col = get_collection("users")
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User not found", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        users_col.update_one(
            {"id": user["id"]},
            {"$set": {"accountStatus": "SUSPENDED", "isActive": False, "updatedAt": now_iso}}
        )
        log_audit_event(
            admin_id=admin_id,
            action="ACCOUNT_SUSPENDED",
            object_type="USER_ACCOUNT",
            object_id=user["id"],
            reason=reason
        )
        return api_success({"userId": user["id"], "accountStatus": "SUSPENDED"}, "Account has been suspended.")


class AdminUserArchiveView(APIView):
    """POST /api/v1/admin/users/<str:user_id>/archive/"""
    permission_classes = [IsXentroAdmin]

    def post(self, request, user_id):
        reason = request.data.get("reason", "Account archived according to data retention policy.")
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")

        users_col = get_collection("users")
        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User not found", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        users_col.update_one(
            {"id": user["id"]},
            {"$set": {"accountStatus": "ARCHIVED", "isActive": False, "is_archived": True, "updatedAt": now_iso}}
        )
        log_audit_event(
            admin_id=admin_id,
            action="ACCOUNT_ARCHIVED",
            object_type="USER_ACCOUNT",
            object_id=user["id"],
            reason=reason
        )
        return api_success({"userId": user["id"], "accountStatus": "ARCHIVED"}, "Account has been archived.")


class AdminUserRoleActionView(APIView):
    """POST /api/v1/admin/users/<str:user_id>/role-action/"""
    permission_classes = [IsXentroAdmin]

    def post(self, request, user_id):
        role = request.data.get("role", "Mentor")
        action = request.data.get("action", "APPROVE").upper()
        notes = request.data.get("notes", "")
        admin_id = getattr(request.user, "admin_employee_id", "SUPER_ADMIN")

        users_col = get_collection("users")
        mentor_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")
        req_col = get_collection("role_requests")

        user = users_col.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
        if not user:
            return api_error("User not found", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if action == "APPROVE":
            active_roles = list(user.get("activeRoles") or ["Explorer"])
            if role not in active_roles:
                active_roles.append(role)

            users_col.update_one(
                {"id": user["id"]},
                {"$set": {"activeRoles": active_roles, "updatedAt": now_iso}}
            )

            if role == "Mentor":
                mentor_col.update_one(
                    {"userId": user["id"]},
                    {"$set": {"status": "APPROVED", "approvedAt": now_iso, "approvedBy": admin_id}},
                    upsert=True
                )
            elif role in ["Investor", "Individual Investor"]:
                inv_col.update_one(
                    {"userId": user["id"]},
                    {"$set": {"status": "APPROVED", "approvedAt": now_iso, "approvedBy": admin_id}},
                    upsert=True
                )

            req_col.update_many(
                {"userId": user["id"], "requestedRole": role},
                {"$set": {"status": "APPROVED", "decisionBy": admin_id, "decisionDate": now_iso, "adminNotes": notes}}
            )
            msg = f"{role} role approved for {user.get('email')}."
        else:
            if role == "Mentor":
                mentor_col.update_one(
                    {"userId": user["id"]},
                    {"$set": {"status": "REJECTED", "rejectedAt": now_iso, "rejectedBy": admin_id}}
                )
            elif role in ["Investor", "Individual Investor"]:
                inv_col.update_one(
                    {"userId": user["id"]},
                    {"$set": {"status": "REJECTED", "rejectedAt": now_iso, "rejectedBy": admin_id}}
                )

            req_col.update_many(
                {"userId": user["id"], "requestedRole": role},
                {"$set": {"status": "REJECTED", "decisionBy": admin_id, "decisionDate": now_iso, "adminNotes": notes}}
            )
            msg = f"{role} role application rejected."

        log_audit_event(
            admin_id=admin_id,
            action=f"ROLE_UPGRADE_{action}",
            object_type="USER_ROLE",
            object_id=user["id"],
            reason=notes or f"{role} role application {action.lower()} by admin."
        )

        return api_success({"userId": user["id"], "role": role, "action": action}, msg)


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
        admin_name = getattr(request.user, "name", None) or (admin_id if admin_id != "ADMIN" else "Xentro Support Team")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        new_status = request.data.get("status")
        admin_notes = request.data.get("adminNotes")
        resolution_comment = request.data.get("resolutionComment")
        admin_reply = request.data.get("adminReply") or request.data.get("replyMessage")
        priority = request.data.get("priority")

        updates = {
            "updatedAt": now_iso,
            "updatedBy": admin_id
        }

        canonical = None
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
        elif admin_reply and str(admin_reply).strip() and not ticket.get("resolutionComment"):
            updates["resolutionComment"] = str(admin_reply).strip()

        if priority:
            updates["priority"] = str(priority).strip().upper()

        reply_obj = None
        if admin_reply and str(admin_reply).strip():
            reply_obj = {
                "id": f"rep_{int(datetime.datetime.now().timestamp())}_{os.urandom(3).hex()}",
                "author": admin_id,
                "authorName": admin_name,
                "message": str(admin_reply).strip(),
                "createdAt": now_iso
            }

        # Apply updates to database
        update_op = {"$set": updates}
        if reply_obj:
            update_op["$push"] = {"adminReplies": reply_obj}

        tickets_col.update_one({"id": ticket_id}, update_op)

        # Notify the ticket submitter in MongoDB notifications collection
        target_user_id = ticket.get("accountId") or ticket.get("userId")
        if target_user_id:
            try:
                notif_col = get_collection("notifications")
                notif_desc = ""
                if reply_obj:
                    notif_desc = f"Admin replied: {reply_obj['message'][:120]}"
                elif resolution_comment and str(resolution_comment).strip():
                    notif_desc = f"Resolution: {str(resolution_comment).strip()[:120]}"
                elif canonical:
                    user_status_label = "Resolved" if canonical in ["RESOLVED", "DISMISSED"] else ("Under investigation" if canonical == "UNDER_INVESTIGATION" else "Complaint sent")
                    notif_desc = f"Ticket status changed to: {user_status_label}"

                if notif_desc:
                    notif_id = f"notif_cmp_{ticket_id}_{int(datetime.datetime.now().timestamp())}"
                    notif_doc = {
                        "id": notif_id,
                        "userId": target_user_id,
                        "category": "system",
                        "title": f"Support Ticket #{ticket_id} Update",
                        "description": notif_desc,
                        "time": "Just now",
                        "unread": True,
                        "read": False,
                        "isRead": False,
                        "avatar": "/xentro-logo.png",
                        "actorName": admin_name,
                        "actorRole": "Support Specialist",
                        "actionType": "general",
                        "targetTab": "support",
                        "ticketId": ticket_id,
                        "createdAt": now_iso
                    }
                    notif_col.insert_one(notif_doc)
            except Exception as n_err:
                # Notification insertion should not fail the ticket update
                print(f"[Warning] Failed to insert support notification: {n_err}")

        log_audit_event(
            admin_id=admin_id,
            action="COMPLAINT_STATUS_UPDATED",
            object_type="SUPPORT_TICKET",
            object_id=ticket_id,
            previous_state={"status": ticket.get("status"), "adminNotes": ticket.get("adminNotes")},
            reason=f"Status changed to {updates.get('status', ticket.get('status'))} by {admin_id}" + (f" with reply: '{reply_obj['message'][:40]}'" if reply_obj else "")
        )

        updated = tickets_col.find_one({"id": ticket_id})
        updated.pop("_id", None)

        return api_success({"complaint": updated}, "Complaint status updated and user notified successfully.")

    def put(self, request, ticket_id):
        return self.patch(request, ticket_id)

    def post(self, request, ticket_id):
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

