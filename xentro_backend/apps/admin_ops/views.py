"""
XENTRO Admin Operations Control Plane API
Implements Admin Authentication, Command Centre Overview, Entity Approval, and Audit Logging.
"""
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from integrations.email_service import send_approval_notification, send_account_activation_notification
from common.jwt_auth import create_access_token, create_refresh_token
from common.response import api_success, api_error
from common.permissions import IsXentroAdmin
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

        total_users = users_col.count_documents({})
        verified_users = users_col.count_documents({"identityStatus": "VERIFIED"})
        startups_count = entities_col.count_documents({"entityType": "STARTUP"})
        investors_count = entities_col.count_documents({"entityType": "INVESTOR"})
        esps_count = entities_col.count_documents({"entityType": "ESP"})

        pending_kyc = verif_col.count_documents({"status": "PENDING", "type": "IDENTITY"})
        pending_startups = entities_col.count_documents({"entityType": "STARTUP", "verificationStatus": "PENDING"})
        pending_esps = entities_col.count_documents({"entityType": "ESP", "verificationStatus": "PENDING"})

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

        # Find users with PENDING_APPROVAL status
        pending_users = list(users_col.find(
            {"$or": [{"accountStatus": "PENDING_APPROVAL"}, {"registrationRequest.status": "PENDING"}]},
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

        # Also find any pending ESP entities
        pending_esps = list(entities_col.find({"entityType": "ESP", "verificationStatus": "PENDING"}))
        for esp in pending_esps:
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
      1. Activates user account (accountStatus: ACTIVE, isActive: True).
      2. Activates any associated ESP / entity.
      3. Dispatches official Xentro activation confirmation email with login details.
      4. Writes audit log.
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

        if action == "APPROVE":
            # 1. Activate User
            if user:
                users_col.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "accountStatus": "ACTIVE",
                        "isActive": True,
                        "registrationRequest.status": "APPROVED",
                        "approvedAt": now_iso,
                        "approvedBy": admin_id,
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
                        "verifiedBy": admin_id
                    }}
                )

            # 3. Dispatch Email Activation Confirmation
            user_email = user.get("email") if user else (esp_entity.get("officialEmail") if esp_entity else None)
            user_name = user.get("fullName") if user else (esp_entity.get("name") if esp_entity else "Partner")
            requested_role = user.get("registrationRequest", {}).get("requestedRole", "User") if user else "ESP"

            email_result = None
            if user_email:
                email_result = send_account_activation_notification(
                    email=user_email,
                    user_name=user_name,
                    login_url="http://localhost:3000/signin",
                    role=requested_role
                )

            # 4. Audit Log
            log_audit_event(
                admin_id=admin_id,
                action="REGISTRATION_APPROVED",
                object_type="USER_REGISTRATION",
                object_id=user["id"] if user else user_id,
                reason=notes or f"Approved {requested_role} account for {user_email}",
                new_state={"accountStatus": "ACTIVE", "isActive": True}
            )

            return api_success({
                "userId": user["id"] if user else user_id,
                "status": "ACTIVE",
                "emailSent": bool(email_result and email_result.get("success")),
                "emailDetails": email_result
            }, f"Account registration approved and activation email dispatched to {user_email}.")

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
                "status": "REJECTED"
            }, "Registration request has been rejected.")
        else:
            return api_error("Invalid action. Must be APPROVE or REJECT.")

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
        all_users = list(users_col.find(sort=[("createdAt", -1)], limit=200))
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
