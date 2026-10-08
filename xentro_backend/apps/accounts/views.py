"""
XENTRO Accounts & User Registration API
"""
import bcrypt
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from integrations.email_service import send_email_otp, verify_email_otp
from common.id_generator import generate_xentro_id, clean_username
from common.jwt_auth import create_access_token, create_refresh_token
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

def normalize_account_type(role_str):
    if not role_str:
        return "Explorer"
    r = str(role_str).strip().lower()
    if "startup" in r or "founder" in r:
        return "Startup"
    if "mentor" in r or "advisor" in r:
        return "Mentor"
    if "investor" in r or "angel" in r or "vc" in r:
        return "Investor"
    if "esp" in r or "incubator" in r or "accelerator" in r or "institution" in r:
        return "ESP"
    return "Explorer"


def enrich_user_account_data(user_dict):
    """
    Enriches user document with accountType, entityId, entity or mentor/investor profile.
    Preserves distinction between personal role upgrades and entity accounts.
    """
    if not user_dict:
        return user_dict
    user_clean = dict(user_dict)
    user_clean.pop("passwordHash", None)
    user_clean.pop("_id", None)

    # 1. Canonical Account Type (synchronized with userType)
    acct_type = user_clean.get("accountType") or user_clean.get("userType")
    if not acct_type:
        roles = user_clean.get("activeRoles") or []
        req_role = user_clean.get("registrationRequest", {}).get("requestedRole")
        acct_type = normalize_account_type(req_role or (roles[0] if roles else "Explorer"))
        # Immediately persist backfill into MongoDB for existing records
        user_id = user_clean.get("id")
        if user_id:
            try:
                users_col = get_collection("users")
                users_col.update_one(
                    {"id": user_id},
                    {"$set": {"accountType": acct_type, "userType": acct_type, "primaryRole": acct_type}}
                )
            except Exception:
                pass

    user_clean["accountType"] = acct_type
    user_clean["userType"] = acct_type
    user_clean["primaryRole"] = acct_type
    user_id = user_clean.get("id")

    # 2. Entity accounts (Startup, ESP)
    if acct_type == "Startup":
        entities_col = get_collection("entities")
        ent = None
        if user_clean.get("entityId"):
            ent = entities_col.find_one({"id": user_clean["entityId"]})
        if not ent and user_id:
            ent = entities_col.find_one({"primaryOwnerId": user_id, "entityType": "STARTUP"})
        if ent:
            ent.pop("_id", None)
            user_clean["entity"] = ent
            user_clean["entityId"] = ent["id"]
            user_clean["entityName"] = ent.get("name")
    elif acct_type == "ESP":
        entities_col = get_collection("entities")
        ent = None
        if user_clean.get("entityId"):
            ent = entities_col.find_one({"id": user_clean["entityId"]})
        if not ent and user_id:
            ent = entities_col.find_one({"primaryOwnerId": user_id, "entityType": "ESP"})
        if ent:
            ent.pop("_id", None)
            user_clean["entity"] = ent
            user_clean["entityId"] = ent["id"]
            user_clean["entityName"] = ent.get("name")
    elif acct_type == "Mentor":
        # Personal role upgrade
        user_clean["entityId"] = None
        mentor_col = get_collection("mentor_profiles")
        m_prof = mentor_col.find_one({"userId": user_id})
        if m_prof:
            m_prof.pop("_id", None)
            user_clean["mentorProfile"] = m_prof
            user_clean["roleId"] = m_prof.get("id")
    elif acct_type == "Investor":
        # Personal role upgrade
        user_clean["entityId"] = None
        inv_col = get_collection("investor_profiles")
        i_prof = inv_col.find_one({"userId": user_id})
        if i_prof:
            i_prof.pop("_id", None)
            user_clean["investorProfile"] = i_prof
            user_clean["roleId"] = i_prof.get("id")
    elif acct_type == "Explorer":
        # Personal account
        user_clean["entityId"] = None
        user_clean["roleId"] = None

    return user_clean


class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get("email", "").strip().lower()
        full_name = data.get("fullName") or data.get("full_name", "").strip()
        phone_number = data.get("phoneNumber") or data.get("phone_number", "").strip()
        password = data.get("password", "")
        requested_role = data.get("role") or data.get("requestedRole") or data.get("accountType") or "Personal Account"
        institution_name = data.get("institutionName", "").strip()
        esp_type = data.get("espType", "INCUBATOR").strip()
        official_domain = data.get("officialDomain", "").strip()

        if not email or not password or not full_name:
            return api_error("Full name, email, and password are required.")

        users_col = get_collection("users")
        if users_col.find_one({"email": email}):
            return api_error("An account with this email already exists. Please sign in instead.", status_code=409)

        # Require and verify 6-digit email OTP
        otp = data.get("otp") or data.get("code") or data.get("otpCode", "")
        if not otp:
            return api_error("A 6-digit verification code is required to complete signup.", status_code=400)

        otp_verification = verify_email_otp(email, str(otp).strip())
        if not otp_verification.get("success"):
            return api_error(otp_verification.get("message", "Invalid or expired verification code."), status_code=400)

        # Hash password
        salt = bcrypt.gensalt(12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

        user_id = generate_xentro_id("user")
        username = clean_username(full_name)

        account_type = normalize_account_type(requested_role)
        is_esp = (account_type == "ESP")

        if is_esp:
            active_roles = ["ESP Applicant"]
            account_status = "PENDING_APPROVAL"
            is_active = False
        elif account_type == "Startup":
            active_roles = ["Startup", "Startup Founder"]
            account_status = "ACTIVE"
            is_active = True
        else:
            active_roles = [account_type]
            account_status = "ACTIVE"
            is_active = True

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        entity_id = None
        role_id = None

        if account_type == "Startup":
            entity_id = generate_xentro_id("startup")
            entities_col = get_collection("entities")
            entities_col.insert_one({
                "id": entity_id,
                "entityType": "STARTUP",
                "accountType": "Startup",
                "name": f"{full_name}'s Venture",
                "username": clean_username(f"{full_name} Venture"),
                "primaryOwnerId": user_id,
                "primaryOwnerName": full_name,
                "stage": "IDEA",
                "verificationStatus": "PENDING",
                "visibility": "PUBLIC",
                "createdAt": now_iso,
                "updatedAt": now_iso,
            })
        elif is_esp:
            entity_id = generate_xentro_id("esp")
            entities_col = get_collection("entities")
            entities_col.insert_one({
                "id": entity_id,
                "entityType": "ESP",
                "accountType": "ESP",
                "name": institution_name or f"{full_name} Institution",
                "username": clean_username(institution_name or full_name),
                "espType": esp_type,
                "primaryOwnerId": user_id,
                "primaryOwnerName": full_name,
                "officialEmail": email,
                "officialDomain": official_domain or (email.split("@")[-1] if "@" in email else ""),
                "verificationStatus": "PENDING",
                "activeCohorts": 1,
                "portfolioCount": 0,
                "alumniCount": 0,
                "createdAt": now_iso,
                "updatedAt": now_iso,
            })
        elif account_type == "Mentor":
            role_id = generate_xentro_id("mentor")
            mentor_col = get_collection("mentor_profiles")
            mentor_col.insert_one({
                "id": role_id,
                "userId": user_id,
                "accountType": "Mentor",
                "headline": "Advisory Mentor & Ecosystem Guide",
                "expertise": ["Mentorship", "Strategy"],
                "hourlyRate": 0,
                "createdAt": now_iso,
                "updatedAt": now_iso,
            })
        elif account_type == "Investor":
            role_id = generate_xentro_id("investor")
            inv_col = get_collection("investor_profiles")
            inv_col.insert_one({
                "id": role_id,
                "userId": user_id,
                "accountType": "Investor",
                "investorType": "ANGEL",
                "chequeRange": {"min": 500000, "max": 2500000},
                "sectors": ["General Technology"],
                "createdAt": now_iso,
                "updatedAt": now_iso,
            })

        user_doc = {
            "id": user_id,
            "username": username,
            "email": email,
            "phoneNumber": phone_number,
            "fullName": full_name,
            "passwordHash": password_hash,
            "emailVerified": True,
            "phoneVerified": False,
            "identityStatus": "NOT_SUBMITTED",
            "accountStatus": account_status,
            "isActive": is_active,
            "accountType": account_type,
            "userType": account_type,
            "primaryRole": account_type,
            "activeRoles": active_roles,
            "entityId": entity_id,
            "roleId": role_id,
            "is_staff": False,
            "registrationRequest": {
                "status": "PENDING" if is_esp else "APPROVED",
                "requestedRole": account_type,
                "institutionName": institution_name if is_esp else "",
                "espType": esp_type if is_esp else "",
                "officialDomain": official_domain if is_esp else (email.split("@")[-1] if "@" in email else ""),
                "requestedAt": now_iso
            },
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        users_col.insert_one(user_doc)

        user_clean = enrich_user_account_data(user_doc)
        access_token = create_access_token({
            "sub": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc.get("fullName", ""),
            "account_type": user_clean.get("accountType", "Explorer"),
            "active_roles": user_clean.get("activeRoles", ["Explorer"]),
            "is_staff": user_doc.get("is_staff", False)
        })
        refresh_token = create_refresh_token(user_doc["id"])

        response_data = {
            "user": user_clean,
            "accountStatus": account_status,
            "accountType": account_type,
            "requiresApproval": is_esp,
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token
            }
        }
        msg = "Registration request submitted for institution review." if is_esp else "Account created and verified successfully."
        resp = api_success(response_data, msg)
        resp.set_cookie("xentro_session", access_token, max_age=86400, httponly=True, samesite="Lax")
        return resp


class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return api_error("Email and password are required.")

        users_col = get_collection("users")
        user = users_col.find_one({"email": email})

        if not user:
            return api_error("Invalid email or password.")

        # Check account activation status
        account_status = user.get("accountStatus", "ACTIVE")
        if account_status == "PENDING_APPROVAL":
            return api_error(
                "Your account registration is under administrator review. You will receive an activation email with login instructions once approved.",
                status_code=403,
                extra={"accountStatus": "PENDING_APPROVAL", "email": email}
            )
        elif account_status == "REJECTED":
            return api_error(
                "Your registration request was not approved. Please contact support@xentro.in for details.",
                status_code=403,
                extra={"accountStatus": "REJECTED", "email": email}
            )

        # Verify password
        password_hash = user.get("passwordHash", "").encode('utf-8')
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash):
            return api_error("Invalid email or password.")

        user_clean = enrich_user_account_data(user)
        access_token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("fullName", ""),
            "account_type": user_clean.get("accountType", "Explorer"),
            "active_roles": user_clean.get("activeRoles", ["Explorer"]),
            "is_staff": user.get("is_staff", False)
        })
        refresh_token = create_refresh_token(user["id"])

        resp = api_success({
            "user": user_clean,
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token
            }
        }, "Sign in successful.")
        resp.set_cookie("xentro_session", access_token, max_age=86400, httponly=True, samesite="Lax")
        return resp


class SendSignInOtpView(APIView):
    """Dispatches a 6-digit OTP to user's registered email for passwordless/2FA login."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return api_error("Registered email address is required.")

        users_col = get_collection("users")
        user = users_col.find_one({"email": email})
        if not user:
            return api_error("No account found with this email address.", status_code=404)

        account_status = user.get("accountStatus", "ACTIVE")
        if account_status == "PENDING_APPROVAL":
            return api_error(
                "Your account registration is under administrator review. You will receive an activation email once approved.",
                status_code=403,
                extra={"accountStatus": "PENDING_APPROVAL"}
            )
        elif account_status == "REJECTED":
            return api_error("Your registration was not approved. Please contact support@xentro.in.", status_code=403)

        res = send_email_otp(email)
        return api_success(res, res.get("message", f"Verification OTP sent to {email}."))


class VerifySignInOtpView(APIView):
    """Verifies the 6-digit OTP and authenticates the user session."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp = request.data.get("otp") or request.data.get("code", "")

        if not email or not otp:
            return api_error("Email and 6-digit verification code are required.")

        res = verify_email_otp(email, str(otp).strip())
        if not res.get("success"):
            return api_error(res.get("message", "Invalid or expired verification code."))

        users_col = get_collection("users")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        users_col.update_one(
            {"email": email},
            {"$set": {"emailVerified": True, "updatedAt": now_iso}}
        )
        user = users_col.find_one({"email": email})
        if not user:
            return api_error("User not found.", status_code=404)

        user_clean = enrich_user_account_data(user)
        access_token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("fullName", ""),
            "account_type": user_clean.get("accountType", "Explorer"),
            "active_roles": user_clean.get("activeRoles", ["Explorer"]),
            "is_staff": user.get("is_staff", False)
        })
        refresh_token = create_refresh_token(user["id"])

        resp = api_success({
            "user": user_clean,
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token
            }
        }, "Sign in successful via email OTP.")
        resp.set_cookie("xentro_session", access_token, max_age=86400, httponly=True, samesite="Lax")
        return resp


class SendOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        purpose = request.data.get("purpose", "").strip().lower()
        if not email:
            return api_error("Email address is required.")

        if purpose == "signup":
            users_col = get_collection("users")
            if users_col.find_one({"email": email}):
                return api_error("An account with this email already exists. Please sign in instead.", status_code=409)

        res = send_email_otp(email)
        if res.get("success"):
            return api_success(res, res.get("message"))
        return api_error(res.get("message", "Failed to dispatch verification code."), status_code=400)


class SendSignUpOtpView(APIView):
    """Specifically dispatches a 6-digit OTP for new user signup after verifying email uniqueness."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return api_error("Email address is required.")

        users_col = get_collection("users")
        if users_col.find_one({"email": email}):
            return api_error("An account with this email already exists. Please sign in instead.", status_code=409)

        res = send_email_otp(email)
        if res.get("success"):
            return api_success(res, res.get("message"))
        return api_error(res.get("message", "Failed to dispatch verification code."), status_code=400)


class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        code = request.data.get("code") or request.data.get("otp", "")
        if not email or not code:
            return api_error("Email and verification code are required.")

        res = verify_email_otp(email, str(code).strip())
        if res.get("success"):
            users_col = get_collection("users")
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            users_col.update_one(
                {"email": email},
                {"$set": {"emailVerified": True, "updatedAt": now_iso}}
            )
            user = users_col.find_one({"email": email})
            if user:
                user_clean = enrich_user_account_data(user)
                access_token = create_access_token({
                    "sub": user["id"],
                    "email": user["email"],
                    "name": user.get("fullName", ""),
                    "account_type": user_clean.get("accountType", "Explorer"),
                    "active_roles": user_clean.get("activeRoles", ["Explorer"]),
                    "is_staff": user.get("is_staff", False)
                })
                refresh_token = create_refresh_token(user["id"])
                resp = api_success({
                    "verified": True,
                    "user": user_clean,
                    "tokens": {
                        "accessToken": access_token,
                        "refreshToken": refresh_token
                    }
                }, "Email verified successfully.")
                resp.set_cookie("xentro_session", access_token, max_age=86400, httponly=True, samesite="Lax")
                return resp

            return api_success({"verified": True}, "Email verified successfully.")
        else:
            return api_error(res.get("message"))


class CurrentUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = getattr(request.user, "id", None)
        if not user_id:
            user_id = request.headers.get("X-User-Id") or request.query_params.get("userId")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        users_col = get_collection("users")
        user = users_col.find_one({"id": user_id})
        if not user:
            return api_error("User not found", status_code=404)
        user_clean = enrich_user_account_data(user)
        return api_success({"user": user_clean})


class UpdateAccountTypeView(APIView):
    """
    POST /api/v1/auth/account-type/
    POST /api/v1/users/account-type/
    Updates user's account type to one of: Explorer, Mentor, Investor, ESP, or Startup.
    Preserves the distinction between personal role upgrades and entity accounts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = getattr(request.user, "id", None)
        if not user_id:
            user_id = data.get("userId") or request.headers.get("X-User-Id")

        email = data.get("email", "").strip().lower()

        users_col = get_collection("users")
        entities_col = get_collection("entities")
        mentor_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")

        user = None
        if user_id:
            user = users_col.find_one({"id": user_id})
        if not user and email:
            user = users_col.find_one({"email": email})

        if not user:
            return api_error("User not found. Please log in or provide a valid userId/email.", status_code=404)

        user_id = user["id"]
        raw_account_type = data.get("accountType") or data.get("role") or data.get("selectedRole")
        account_type = normalize_account_type(raw_account_type)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        update_fields = {
            "accountType": account_type,
            "userType": account_type,
            "primaryRole": account_type,
            "updatedAt": now_iso,
        }

        entity_doc = None
        role_id = None

        if account_type == "Startup":
            startup_details = data.get("startupDetails") or data.get("entityDetails") or {}
            startup_name = (startup_details.get("startupName") or startup_details.get("name") or f"{user.get('fullName', 'User')}'s Startup").strip()
            reg_type = startup_details.get("regType", "Pvt Ltd")
            reg_no = startup_details.get("regNo", "")
            stage = startup_details.get("stage", "Early Traction")
            industry = startup_details.get("industry", "")
            location = startup_details.get("location", "India")
            website = startup_details.get("website", "")
            official_email = startup_details.get("officialEmail", user.get("email", ""))
            description = startup_details.get("description", "Next-generation venture connected via Xentro ecosystem.")

            existing_entity = None
            if user.get("entityId"):
                existing_entity = entities_col.find_one({"id": user["entityId"]})
            if not existing_entity:
                existing_entity = entities_col.find_one({"primaryOwnerId": user_id, "entityType": "STARTUP"})

            if existing_entity:
                entity_id = existing_entity["id"]
                entities_col.update_one(
                    {"_id": existing_entity["_id"]},
                    {"$set": {
                        "name": startup_name,
                        "regType": reg_type,
                        "regNo": reg_no,
                        "stage": stage,
                        "industry": industry,
                        "location": location,
                        "website": website,
                        "officialEmail": official_email,
                        "description": description,
                        "accountType": "Startup",
                        "updatedAt": now_iso,
                    }}
                )
                entity_doc = entities_col.find_one({"_id": existing_entity["_id"]})
            else:
                entity_id = generate_xentro_id("startup")
                entity_doc = {
                    "id": entity_id,
                    "entityType": "STARTUP",
                    "accountType": "Startup",
                    "name": startup_name,
                    "username": clean_username(startup_name),
                    "primaryOwnerId": user_id,
                    "primaryOwnerName": user.get("fullName", "Founder"),
                    "regType": reg_type,
                    "regNo": reg_no,
                    "stage": stage,
                    "industry": industry,
                    "location": location,
                    "website": website,
                    "officialEmail": official_email,
                    "description": description,
                    "verificationStatus": "ACTIVE",
                    "visibility": "PUBLIC",
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                }
                entities_col.insert_one(entity_doc)

            update_fields["entityId"] = entity_id
            update_fields["activeRoles"] = ["Startup", "Startup Founder"]

        elif account_type == "Mentor":
            mentor_details = data.get("mentorDetails") or data.get("setupData") or {}
            headline = mentor_details.get("professionalRole") or mentor_details.get("headline", "Advisory Mentor")
            expertise = mentor_details.get("mentorshipAreas") or mentor_details.get("expertise", ["Strategy", "Scaling"])
            if isinstance(expertise, str):
                expertise = [s.strip() for s in expertise.split(",") if s.strip()]
            hourly_rate = mentor_details.get("hourlyRate", 5000)
            org = mentor_details.get("organization", "")
            exp = mentor_details.get("yearsOfExperience", "")

            existing_m = mentor_col.find_one({"userId": user_id})
            if existing_m:
                role_id = existing_m["id"]
                mentor_col.update_one(
                    {"userId": user_id},
                    {"$set": {
                        "headline": headline,
                        "organization": org,
                        "yearsOfExperience": exp,
                        "expertise": expertise,
                        "hourlyRate": hourly_rate,
                        "accountType": "Mentor",
                        "updatedAt": now_iso,
                    }}
                )
            else:
                role_id = generate_xentro_id("mentor")
                mentor_col.insert_one({
                    "id": role_id,
                    "userId": user_id,
                    "accountType": "Mentor",
                    "headline": headline,
                    "organization": org,
                    "yearsOfExperience": exp,
                    "expertise": expertise,
                    "hourlyRate": hourly_rate,
                    "satisfactionRating": 5.0,
                    "sessionsCompleted": 0,
                    "activeMentees": 0,
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                })

            update_fields["roleId"] = role_id
            update_fields["entityId"] = None
            update_fields["activeRoles"] = ["Mentor"]

        elif account_type == "Investor":
            inv_details = data.get("investorDetails") or data.get("setupData") or {}
            inv_type = inv_details.get("investorType", "ANGEL")
            cheque_min = inv_details.get("chequeMin", 500000)
            cheque_max = inv_details.get("chequeMax", 2500000)
            sectors = inv_details.get("sectors", ["Enterprise AI", "FinTech", "SaaS"])
            if isinstance(sectors, str):
                sectors = [s.strip() for s in sectors.split(",") if s.strip()]

            existing_i = inv_col.find_one({"userId": user_id})
            if existing_i:
                role_id = existing_i["id"]
                inv_col.update_one(
                    {"userId": user_id},
                    {"$set": {
                        "investorType": inv_type,
                        "chequeRange": {"min": cheque_min, "max": cheque_max},
                        "sectors": sectors,
                        "accountType": "Investor",
                        "updatedAt": now_iso,
                    }}
                )
            else:
                role_id = generate_xentro_id("investor")
                inv_col.insert_one({
                    "id": role_id,
                    "userId": user_id,
                    "accountType": "Investor",
                    "investorType": inv_type,
                    "chequeRange": {"min": cheque_min, "max": cheque_max},
                    "sectors": sectors,
                    "portfolioCount": 0,
                    "totalDeployed": 0,
                    "dryPowder": 10000000,
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                })

            update_fields["roleId"] = role_id
            update_fields["entityId"] = None
            update_fields["activeRoles"] = ["Investor"]

        elif account_type == "ESP":
            esp_details = data.get("espDetails") or data.get("institutionDetails") or {}
            inst_name = (esp_details.get("institutionName") or esp_details.get("name") or f"{user.get('fullName', 'User')} Institution").strip()
            esp_type = esp_details.get("organizationType") or esp_details.get("espType", "INCUBATOR")
            off_email = esp_details.get("officialEmail", user.get("email", ""))
            website = esp_details.get("website", "")

            existing_esp = entities_col.find_one({"primaryOwnerId": user_id, "entityType": "ESP"})
            if existing_esp:
                entity_id = existing_esp["id"]
                entities_col.update_one(
                    {"_id": existing_esp["_id"]},
                    {"$set": {
                        "name": inst_name,
                        "espType": esp_type,
                        "officialEmail": off_email,
                        "website": website,
                        "accountType": "ESP",
                        "updatedAt": now_iso,
                    }}
                )
                entity_doc = entities_col.find_one({"_id": existing_esp["_id"]})
            else:
                entity_id = generate_xentro_id("esp")
                entity_doc = {
                    "id": entity_id,
                    "entityType": "ESP",
                    "accountType": "ESP",
                    "name": inst_name,
                    "username": clean_username(inst_name),
                    "espType": esp_type,
                    "primaryOwnerId": user_id,
                    "primaryOwnerName": user.get("fullName", "Institution Rep"),
                    "officialEmail": off_email,
                    "website": website,
                    "verificationStatus": "PENDING",
                    "activeCohorts": 1,
                    "portfolioCount": 0,
                    "alumniCount": 0,
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                }
                entities_col.insert_one(entity_doc)

            update_fields["entityId"] = entity_id
            update_fields["activeRoles"] = ["ESP Applicant"]

        elif account_type == "Explorer":
            update_fields["entityId"] = None
            update_fields["roleId"] = None
            update_fields["activeRoles"] = ["Explorer"]

        # Persist to MongoDB users collection
        users_col.update_one({"id": user_id}, {"$set": update_fields})
        updated_user = users_col.find_one({"id": user_id})
        user_clean = enrich_user_account_data(updated_user)

        new_access_token = create_access_token({
            "sub": user_id,
            "email": user_clean.get("email", ""),
            "name": user_clean.get("fullName", ""),
            "account_type": account_type,
            "active_roles": user_clean.get("activeRoles", [account_type]),
            "is_staff": user_clean.get("is_staff", False)
        })

        return api_success({
            "user": user_clean,
            "accountType": account_type,
            "entity": entity_doc,
            "accessToken": new_access_token
        }, f"Account type successfully updated to {account_type}.")


import uuid

def resolve_current_user_id(request):
    if request.user and getattr(request.user, "is_authenticated", False):
        return str(getattr(request.user, "id", "")).strip()
    h = request.headers.get("X-User-Id")
    if h:
        return str(h).strip()
    param = request.query_params.get("userId") or request.data.get("userId") or request.data.get("followerId")
    if param:
        return str(param).strip()
    return ""

class ToggleFollowView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, user_id):
        current_user_id = resolve_current_user_id(request)
        if not current_user_id:
            return api_error("Authentication or user identification required to follow.", status_code=401)

        target_id = str(user_id).strip()
        if current_user_id == target_id:
            return api_error("You cannot follow yourself.")

        follows_col = get_collection("follows")
        users_col = get_collection("users")
        notifs_col = get_collection("notifications")

        existing = follows_col.find_one({"followerId": current_user_id, "followingId": target_id})
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if existing:
            follows_col.delete_one({"followerId": current_user_id, "followingId": target_id})
            is_following = False
            msg = "Unfollowed successfully."
        else:
            doc = {
                "followerId": current_user_id,
                "followingId": target_id,
                "createdAt": now_iso
            }
            follows_col.insert_one(doc)
            is_following = True
            msg = "Followed successfully."

            # Notify recipient
            follower_user = users_col.find_one({"id": current_user_id}) or {}
            follower_name = follower_user.get("fullName") or follower_user.get("username") or "An ecosystem member"
            notifs_col.insert_one({
                "id": f"notif_{uuid.uuid4().hex[:12]}",
                "recipientId": target_id,
                "senderId": current_user_id,
                "type": "FOLLOW",
                "title": "New Follower",
                "message": f"{follower_name} started following your profile and updates.",
                "actionRequired": False,
                "read": False,
                "createdAt": now_iso
            })

        followers_count = follows_col.count_documents({"followingId": target_id})
        following_count = follows_col.count_documents({"followerId": current_user_id})

        return api_success({
            "following": is_following,
            "followersCount": followers_count,
            "followingCount": following_count,
            "targetUserId": target_id,
        }, msg)

class UserFollowersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        target_id = str(user_id).strip()
        current_user_id = resolve_current_user_id(request)

        follows_col = get_collection("follows")
        users_col = get_collection("users")

        followers_count = follows_col.count_documents({"followingId": target_id})
        following_count = follows_col.count_documents({"followerId": target_id})

        is_following = False
        if current_user_id:
            is_following = bool(follows_col.find_one({"followerId": current_user_id, "followingId": target_id}))

        # Load followers list
        follower_records = list(follows_col.find({"followingId": target_id}, limit=50))
        follower_ids = [r["followerId"] for r in follower_records]
        follower_users = []
        if follower_ids:
            docs = list(users_col.find({"id": {"$in": follower_ids}}))
            docs_map = {d["id"]: d for d in docs}
            for fid in follower_ids:
                u = docs_map.get(fid, {})
                follower_users.append({
                    "id": fid,
                    "name": u.get("fullName") or u.get("username", "Member"),
                    "role": (u.get("activeRoles") or ["Member"])[0] if u.get("activeRoles") else "Member",
                    "avatar": u.get("avatar") or f"https://api.dicebear.com/7.x/initials/svg?seed={u.get('fullName', fid)}",
                    "company": u.get("startupName") or u.get("company", ""),
                })

        # Load following list
        following_records = list(follows_col.find({"followerId": target_id}, limit=50))
        following_ids = [r["followingId"] for r in following_records]
        following_users = []
        if following_ids:
            docs = list(users_col.find({"id": {"$in": following_ids}}))
            docs_map = {d["id"]: d for d in docs}
            for fid in following_ids:
                u = docs_map.get(fid, {})
                following_users.append({
                    "id": fid,
                    "name": u.get("fullName") or u.get("username", "Member"),
                    "role": (u.get("activeRoles") or ["Member"])[0] if u.get("activeRoles") else "Member",
                    "avatar": u.get("avatar") or f"https://api.dicebear.com/7.x/initials/svg?seed={u.get('fullName', fid)}",
                    "company": u.get("startupName") or u.get("company", ""),
                })

        return api_success({
            "targetUserId": target_id,
            "followersCount": followers_count,
            "followingCount": following_count,
            "isFollowing": is_following,
            "followers": follower_users,
            "following": following_users
        })

class SubmitEspRequestView(APIView):
    """
    Submits an ESP institution onboarding application for review.
    Updates applicant's accountStatus to PENDING_APPROVAL and creates a pending ESP entity.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get("institutionalEmail") or data.get("officialEmail") or data.get("email")
        if not email:
            return api_error("Email is required.")

        institution_name = data.get("institutionName", "").strip()
        org_type = data.get("organizationType", "Incubator")
        applicant_name = data.get("applicantName", "").strip()
        designation = data.get("designation", "").strip()
        department = data.get("department", "").strip()
        phone = data.get("phone") or data.get("contactNumber", "")

        users_col = get_collection("users")
        entities_col = get_collection("entities")

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        user = users_col.find_one({"email": email.strip().lower()})

        user_id = user["id"] if user else generate_xentro_id("user")

        if user:
            users_col.update_one(
                {"id": user["id"]},
                {"$set": {
                    "accountStatus": "PENDING_APPROVAL",
                    "isActive": False,
                    "registrationRequest": {
                        "status": "PENDING",
                        "requestedRole": "ESP",
                        "institutionName": institution_name,
                        "espType": org_type,
                        "officialDomain": email.split("@")[-1],
                        "requestedAt": now_iso,
                        "designation": designation,
                        "department": department,
                        "phone": phone
                    },
                    "updatedAt": now_iso
                },
                "$addToSet": {"activeRoles": "ESP Applicant"}}
            )

        esp_id = generate_xentro_id("esp")
        entities_col.insert_one({
            "id": esp_id,
            "entityType": "ESP",
            "name": institution_name or f"{applicant_name} Institution",
            "username": clean_username(institution_name or applicant_name),
            "espType": org_type,
            "verificationStatus": "PENDING",
            "isActive": False,
            "primaryOwnerId": user_id,
            "primaryOwnerName": applicant_name,
            "officialEmail": email,
            "contactNumber": phone,
            "department": department,
            "designation": designation,
            "createdAt": now_iso
        })

        return api_success({
            "status": "PENDING_APPROVAL",
            "requiresApproval": True,
            "institutionName": institution_name,
            "espId": esp_id
        }, "ESP application submitted for Xentro administration review.")

class UserRecommendationsView(APIView):
    """
    Returns real ecosystem recommendations excluding the currently authenticated user.
    Populated directly from MongoDB Atlas collections: users, entities, mentor_profiles, opportunities.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        current_user_id = ""
        current_email = ""
        if request.user and hasattr(request.user, "is_authenticated") and request.user.is_authenticated:
            current_user_id = getattr(request.user, "id", "")
            current_email = getattr(request.user, "email", "").lower().strip()

        if not current_user_id:
            current_user_id = request.query_params.get("excludeUserId", "").strip()
        if not current_email:
            current_email = request.query_params.get("excludeEmail", "").lower().strip()

        users_col = get_collection("users")
        entities_col = get_collection("entities")
        mentors_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")
        opps_col = get_collection("opportunities")

        people = []
        mentors = []
        investors = []
        opps = []
        seen_user_ids = set()
        if current_user_id:
            seen_user_ids.add(current_user_id.lower())

        # 1. Query real users from MongoDB Atlas (strictly active, non-deleted)
        query_users = {
            "isActive": {"$ne": False},
            "accountStatus": {"$nin": ["DELETED", "REJECTED", "SUSPENDED"]},
            "deleted": {"$ne": True},
            "is_deleted": {"$ne": True}
        }
        if current_user_id:
            query_users["id"] = {"$ne": current_user_id}
        if current_email:
            query_users["email"] = {"$ne": current_email}

        real_users = list(users_col.find(query_users, limit=50))
        for u in real_users:
            u_id = u.get("id", "")
            u_email = (u.get("email") or "").lower().strip()
            if not u_id or u_id.lower() in seen_user_ids:
                continue
            if current_email and u_email == current_email:
                continue

            seen_user_ids.add(u_id.lower())

            # Determine canonical account type
            acct_type = u.get("accountType")
            roles = [r.lower() for r in (u.get("activeRoles") or [])]
            raw_role = (u.get("role") or "").lower()

            if not acct_type:
                if any("mentor" in r for r in roles) or "mentor" in raw_role:
                    acct_type = "Mentor"
                elif any("investor" in r for r in roles) or "investor" in raw_role:
                    acct_type = "Investor"
                elif any("esp" in r for r in roles) or "esp" in raw_role:
                    acct_type = "ESP"
                elif any("startup" in r or "founder" in r for r in roles) or "startup" in raw_role or "founder" in raw_role:
                    acct_type = "Startup"
                else:
                    acct_type = "Explorer"

            display_name = u.get("fullName") or u.get("username", "Ecosystem Member")
            avatar = u.get("avatar") or f"https://api.dicebear.com/7.x/initials/svg?seed={display_name}"
            company = u.get("startupName") or u.get("organization") or u.get("company") or ""

            acct_type_upper = str(acct_type or "").upper()
            if acct_type_upper == "MENTOR":
                headline = u.get("headline") or "Growth & Advisory Partner"
                context_str = company or (u.get("expertise") if isinstance(u.get("expertise"), str) else "Advisory Mentor")
                mentors.append({
                    "id": f"rec_m_{u_id}",
                    "userId": u_id,
                    "type": "mentor",
                    "accountType": "Mentor",
                    "name": display_name,
                    "title": headline,
                    "context": context_str,
                    "category": "mentors",
                    "avatar": avatar,
                    "status": "idle",
                    "mutualCount": 1
                })
            elif acct_type_upper == "INVESTOR":
                headline = u.get("headline") or "Investment Partner"
                context_str = company or "Venture Capital & Angel Investor"
                investors.append({
                    "id": f"rec_i_{u_id}",
                    "userId": u_id,
                    "type": "investor",
                    "accountType": "Investor",
                    "name": display_name,
                    "title": headline,
                    "context": context_str,
                    "category": "investors",
                    "avatar": avatar,
                    "status": "idle",
                    "mutualCount": 2
                })
            elif acct_type_upper == "ESP":
                headline = "Incubator & Accelerator Lead"
                context_str = company or "Ecosystem Enabler"
                people.append({
                    "id": f"rec_esp_{u_id}",
                    "userId": u_id,
                    "type": "esp",
                    "accountType": "ESP",
                    "name": display_name,
                    "title": headline,
                    "context": context_str,
                    "category": "people",
                    "avatar": avatar,
                    "status": "idle",
                    "mutualCount": 1
                })
            elif acct_type_upper in ["STARTUP", "STARTUP FOUNDER"]:
                headline = "Startup Founder"
                context_str = company or f"{display_name}'s Venture"
                people.append({
                    "id": f"rec_st_{u_id}",
                    "userId": u_id,
                    "type": "startup",
                    "accountType": "Startup",
                    "name": display_name,
                    "title": f"Founder · {context_str}",
                    "context": u.get("location") or "Seed Stage Startup",
                    "category": "people",
                    "avatar": avatar,
                    "status": "idle",
                    "mutualCount": 2
                })
            else: # Explorer
                people.append({
                    "id": f"rec_exp_{u_id}",
                    "userId": u_id,
                    "type": "explorer",
                    "accountType": "Explorer",
                    "name": display_name,
                    "title": "Ecosystem Explorer",
                    "context": "Exploring Opportunities & Network",
                    "category": "people",
                    "avatar": avatar,
                    "status": "idle",
                    "mutualCount": 1
                })

        # 2. Query mentor_profiles for any distinct mentors with active user accounts
        for mp in mentors_col.find({"$or": [{"isActive": {"$ne": False}}, {"isActive": {"$exists": False}}]}, limit=20):
            m_uid = mp.get("userId") or mp.get("id")
            if not m_uid or m_uid.lower() in seen_user_ids:
                continue
            owner = users_col.find_one({"id": m_uid, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
            if not owner:
                continue
            seen_user_ids.add(m_uid.lower())
            m_name = mp.get("fullName") or mp.get("name") or "Mentor"
            mentors.append({
                "id": f"rec_mp_{mp.get('id', m_uid)}",
                "userId": m_uid,
                "type": "mentor",
                "accountType": "Mentor",
                "name": m_name,
                "title": mp.get("headline") or "Growth & Strategy Mentor",
                "context": mp.get("organization") or "Verified Advisor",
                "category": "mentors",
                "avatar": mp.get("avatar") or f"https://api.dicebear.com/7.x/initials/svg?seed={m_name}",
                "status": "idle",
                "mutualCount": 1
            })

        # 3. Query investor_profiles for any distinct investors with active user accounts
        for ip in inv_col.find({"$or": [{"isActive": {"$ne": False}}, {"isActive": {"$exists": False}}]}, limit=20):
            i_uid = ip.get("userId") or ip.get("id")
            if not i_uid or i_uid.lower() in seen_user_ids:
                continue
            owner = users_col.find_one({"id": i_uid, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
            if not owner:
                continue
            seen_user_ids.add(i_uid.lower())
            i_name = ip.get("fullName") or ip.get("name") or "Investor"
            investors.append({
                "id": f"rec_ip_{ip.get('id', i_uid)}",
                "userId": i_uid,
                "type": "investor",
                "accountType": "Investor",
                "name": i_name,
                "title": ip.get("investorType") or "Angel Investor & Partner",
                "context": ip.get("firmName") or "Early Stage Venture",
                "category": "investors",
                "avatar": ip.get("avatar") or f"https://api.dicebear.com/7.x/initials/svg?seed={i_name}",
                "status": "idle",
                "mutualCount": 2
            })

        # 4. Query real entities (Startups & ESPs) — strictly active, non-orphaned, non-deleted with active owners
        entity_query = {
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        }
        for ent in entities_col.find(entity_query, limit=20):
            owner_id = ent.get("primaryOwnerId") or ent.get("founderPersonalAccountId") or ent.get("id")
            if not owner_id or owner_id.lower() in seen_user_ids:
                continue
            # Crucial consistency check: if the owner user was removed/deleted by admin, do NOT show the entity
            owner_user = users_col.find_one({"id": owner_id, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
            if not owner_user:
                continue

            seen_user_ids.add(owner_id.lower())
            ent_name = ent.get("name") or "Ecosystem Entity"
            ent_type = ent.get("entityType", "STARTUP")
            is_esp = str(ent_type).upper() == "ESP"
            profile_type = "esp" if is_esp else "startup"
            headline = "Incubator Hub" if is_esp else f"{ent.get('stage', 'Seed')} · {ent.get('industry', 'Tech')}"
            people.append({
                "id": f"rec_ent_{ent.get('id')}",
                "userId": owner_id,
                "type": profile_type,
                "accountType": "ESP" if is_esp else "Startup",
                "name": ent_name,
                "title": headline,
                "context": ent.get("location") or ("Ecosystem Enabler" if is_esp else "Active Venture"),
                "category": "people",
                "avatar": ent.get("logoUrl") or "/xentro-logo.png",
                "status": "idle",
                "mutualCount": 1
            })

        # 5. Query real opportunities
        for o in opps_col.find({}, limit=20):
            opps.append({
                "id": f"rec_opp_{o.get('id')}",
                "userId": o.get("posterId") or o.get("id"),
                "type": "startup",
                "name": o.get("title", "Ecosystem Opportunity"),
                "title": f"{o.get('type', 'Program')} · {o.get('organization', 'Ecosystem Partner')}",
                "context": o.get("deadline", "Active Program"),
                "category": "opportunities",
                "avatar": "/xentro-logo.png",
                "status": "idle",
                "mutualCount": 1
            })

        return api_success({
            "people": people,
            "startups": [p for p in people if p.get("type") == "startup"],
            "esps": [p for p in people if p.get("type") == "esp"],
            "mentors": mentors,
            "investors": investors,
            "opportunities": opps,
            "all": people + mentors + investors + opps
        })


class UserProfileDetailView(APIView):
    """
    GET /api/v1/users/<str:user_id>/
    Publicly accessible endpoint to inspect profiles for Explorer, Mentor, Investor, Startup, and ESP accounts.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        if not user_id:
            return api_error("User identifier is required.", status_code=400)

        users_col = get_collection("users")
        entities_col = get_collection("entities")
        mentor_col = get_collection("mentor_profiles")
        inv_col = get_collection("investor_profiles")

        import re
        user_id_clean = user_id.lstrip("@").strip()
        user_escaped = re.escape(user_id)
        clean_escaped = re.escape(user_id_clean)

        # 1. Search in users collection
        user = users_col.find_one({
            "$or": [
                {"id": user_id},
                {"id": {"$regex": f"^{user_escaped}$", "$options": "i"}},
                {"username": {"$regex": f"^@?{clean_escaped}$", "$options": "i"}},
                {"fullName": {"$regex": f"^{user_escaped}$", "$options": "i"}},
                {"email": user_id.strip().lower()}
            ]
        })

        # 2. If not found in users, check entities (Startup, ESP)
        ent = None
        if not user:
            ent = entities_col.find_one({
                "$or": [
                    {"id": user_id},
                    {"id": {"$regex": f"^{user_escaped}$", "$options": "i"}},
                    {"username": {"$regex": f"^@?{clean_escaped}$", "$options": "i"}},
                    {"name": {"$regex": f"^{clean_escaped}$", "$options": "i"}}
                ]
            })
            if ent:
                owner_id = ent.get("primaryOwnerId")
                if owner_id:
                    user = users_col.find_one({"id": owner_id})

        # 3. If still not found, check mentor profiles
        if not user:
            m_prof = mentor_col.find_one({"$or": [{"id": user_id}, {"userId": user_id}]})
            if m_prof:
                user = users_col.find_one({"id": m_prof.get("userId")})

        # 4. If still not found, check investor profiles
        if not user:
            i_prof = inv_col.find_one({"$or": [{"id": user_id}, {"userId": user_id}]})
            if i_prof:
                user = users_col.find_one({"id": i_prof.get("userId")})

        # 5. Handle standalone entity if owner user doesn't exist
        if not user and ent:
            ent.pop("_id", None)
            acct_type = "Startup" if ent.get("entityType") == "STARTUP" else "ESP"
            fabricated_user = {
                "id": ent.get("id"),
                "fullName": ent.get("name"),
                "username": ent.get("username") or ent.get("id"),
                "accountType": acct_type,
                "primaryRole": acct_type,
                "activeRoles": [acct_type],
                "entityId": ent.get("id"),
                "entityName": ent.get("name"),
                "entity": ent
            }
            return api_success({
                "user": fabricated_user,
                "accountType": acct_type,
                "profile": ent
            })

        if not user:
            return api_error(f"Profile '{user_id}' not found.", status_code=404)

        user_clean = enrich_user_account_data(user)
        account_type = user_clean.get("accountType", "Explorer")
        profile_data = user_clean.get("entity") or user_clean.get("mentorProfile") or user_clean.get("investorProfile") or user_clean

        return api_success({
            "user": user_clean,
            "accountType": account_type,
            "profile": profile_data
        })

    def patch(self, request, user_id):
        user_clean = save_user_profile_to_db(user_id, request.data)
        return api_success({
            "user": user_clean,
            "profile": user_clean.get("personalProfile") or user_clean
        }, "Profile updated successfully.")

    def put(self, request, user_id):
        return self.patch(request, user_id)


def save_user_profile_to_db(user_identifier, data):
    """
    Saves required profile fields to MongoDB users collection for any user.
    Required fields:
    - headline (Professional headline)
    - location (Location)
    - currentRole (Current role)
    - currentOrganization (Current organization or institution)
    - education (Education)
    - bio (Short bio)
    - professionalExperience / experienceSummary (Professional experience summary)
    - skills / areasOfExpertise (Skills and areas of expertise)
    - industries / industriesOfFocus (Industries of focus: Artificial Intelligence, Fintech, Enterprise SaaS, Deeptech, Healthtech, Climate & Cleantech, EdTech, Web3)
    - startupInterests / entrepreneurshipInterests (Startup and entrepreneurship interests)
    - linkedin / linkedinUrl (LinkedIn)
    - website / websiteUrl (Website or portfolio)
    - otherLink / otherLinks (One additional link: X or GitHub)
    """
    import re
    users_col = get_collection("users")

    user = None
    if user_identifier:
        clean_id = str(user_identifier).lstrip("@").strip()
        user = users_col.find_one({
            "$or": [
                {"id": str(user_identifier)},
                {"id": {"$regex": f"^{re.escape(str(user_identifier))}$", "$options": "i"}},
                {"username": {"$regex": f"^@?{re.escape(clean_id)}$", "$options": "i"}},
                {"email": str(user_identifier).strip().lower()},
                {"xentroId": str(user_identifier)}
            ]
        })

    email = str(data.get("email") or "").strip().lower()
    if not user and email:
        user = users_col.find_one({"email": email})

    user_id = data.get("userId") or data.get("id")
    if not user and user_id:
        user = users_col.find_one({"id": str(user_id)})

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    full_name = data.get("fullName") or data.get("name")
    headline = str(data.get("headline") or "").strip()
    location = str(data.get("location") or "").strip()
    current_role = str(data.get("currentRole") or data.get("current_role") or data.get("roleTitle") or "").strip()
    current_org = str(data.get("currentOrganization") or data.get("current_organization") or data.get("organization") or "").strip()
    education = str(data.get("education") or "").strip()
    bio = str(data.get("bio") or "").strip()
    prof_exp = str(data.get("professionalExperience") or data.get("professional_experience") or data.get("experienceSummary") or data.get("experience_summary") or "").strip()

    skills = data.get("skills") or data.get("areasOfExpertise") or []
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]

    industries = data.get("industries") or data.get("industriesOfFocus") or []
    if isinstance(industries, str):
        industries = [i.strip() for i in industries.split(",") if i.strip()]

    interests = data.get("startupInterests") or data.get("entrepreneurshipInterests") or []
    if isinstance(interests, str):
        interests = [item.strip() for item in interests.split(",") if item.strip()]

    linkedin = str(data.get("linkedin") or data.get("linkedinUrl") or "").strip()
    website = str(data.get("website") or data.get("websiteUrl") or "").strip()

    other_links = data.get("otherLinks") or []
    if isinstance(other_links, str):
        other_links = [other_links.strip()]
    other_link = str(data.get("otherLink") or (other_links[0] if other_links else "")).strip()
    if other_link and other_link not in other_links:
        other_links = [other_link] + [l for l in other_links if l != other_link]

    photo_url = data.get("photoUrl") or data.get("avatar") or data.get("photo_url")

    personal_profile_doc = {
        "fullName": full_name or (user.get("fullName") if user else "Verified User"),
        "headline": headline,
        "location": location,
        "currentRole": current_role,
        "currentOrganization": current_org,
        "education": education,
        "bio": bio,
        "professionalExperience": prof_exp,
        "experienceSummary": prof_exp,
        "skills": skills,
        "areasOfExpertise": skills,
        "industries": industries,
        "industriesOfFocus": industries,
        "startupInterests": interests,
        "entrepreneurshipInterests": interests,
        "linkedin": linkedin,
        "website": website,
        "otherLink": other_link,
        "otherLinks": other_links,
        "photoUrl": photo_url or (user.get("photoUrl") or user.get("avatar") if user else None),
        "updatedAt": now_iso
    }

    update_doc = {
        "headline": headline,
        "location": location,
        "currentRole": current_role,
        "currentOrganization": current_org,
        "organization": current_org or (user.get("organization") if user else ""),
        "education": education,
        "bio": bio,
        "professionalExperience": prof_exp,
        "experienceSummary": prof_exp,
        "skills": skills,
        "areasOfExpertise": skills,
        "industries": industries,
        "industriesOfFocus": industries,
        "startupInterests": interests,
        "entrepreneurshipInterests": interests,
        "linkedin": linkedin,
        "linkedinUrl": linkedin,
        "website": website,
        "websiteUrl": website,
        "otherLink": other_link,
        "otherLinks": other_links,
        "personalProfile": personal_profile_doc,
        "updatedAt": now_iso
    }
    if full_name:
        update_doc["fullName"] = full_name
    if photo_url:
        update_doc["photoUrl"] = photo_url
        update_doc["avatar"] = photo_url

    if user:
        users_col.update_one({"_id": user["_id"]}, {"$set": update_doc})
        updated_user = users_col.find_one({"_id": user["_id"]})
    else:
        target_id = str(user_identifier or user_id or generate_xentro_id("XU"))
        target_email = email or f"{target_id.lower()}@xentro.network"
        new_doc = {
            "id": target_id,
            "xentroId": target_id,
            "username": clean_username(full_name or "user"),
            "fullName": full_name or "Verified User",
            "email": target_email,
            "accountType": "Explorer",
            "activeRoles": ["Personal Account"],
            "createdAt": now_iso,
            **update_doc
        }
        users_col.insert_one(new_doc)
        updated_user = new_doc

    return enrich_user_account_data(updated_user)


class UpdateUserProfileView(APIView):
    """
    POST /api/v1/auth/profile/
    POST /api/v1/users/profile/
    GET /api/v1/auth/profile/
    Saves and returns user's profile in MongoDB.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = (
            request.headers.get("X-User-Id")
            or request.query_params.get("userId")
            or (getattr(request.user, "id", None) if getattr(request.user, "is_authenticated", False) else None)
        )
        if not user_id:
            return api_error("User identification is required.", status_code=400)
        users_col = get_collection("users")
        user = users_col.find_one({"id": str(user_id)})
        if not user:
            return api_error("User not found.", status_code=404)
        user_clean = enrich_user_account_data(user)
        return api_success({
            "user": user_clean,
            "profile": user_clean.get("personalProfile") or user_clean
        })

    def post(self, request):
        user_identifier = (
            request.headers.get("X-User-Id")
            or request.data.get("userId")
            or request.data.get("id")
            or (getattr(request.user, "id", None) if getattr(request.user, "is_authenticated", False) else None)
        )
        user_clean = save_user_profile_to_db(user_identifier, request.data)
        return api_success({
            "user": user_clean,
            "profile": user_clean.get("personalProfile") or user_clean
        }, "Profile saved successfully.")

    def put(self, request):
        return self.post(request)

    def patch(self, request):
        return self.post(request)


class UserSupportComplaintView(APIView):
    """
    POST /api/v1/support/complaints/
    GET  /api/v1/support/complaints/
    Handles user complaint and support requests submission and personal retrieval.
    Users can only access their own submissions.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = (
            request.headers.get("X-User-Id")
            or request.data.get("userId")
            or request.data.get("accountId")
            or (getattr(request.user, "id", None) if getattr(request.user, "is_authenticated", False) else None)
        )
        if not user_id:
            return api_error("Authenticated user identification is required to submit a complaint.", status_code=401)

        user_id = str(user_id).strip()
        users_col = get_collection("users")
        u_doc = users_col.find_one({"id": user_id})

        subject = str(request.data.get("subject", "")).strip()
        message = str(request.data.get("message", "")).strip()
        category = str(request.data.get("category", "General Support")).strip()
        priority = str(request.data.get("priority", "NORMAL")).strip().upper()

        if not subject or not message:
            return api_error("Both subject and message are required to file a complaint/support request.", status_code=400)

        user_name = (u_doc.get("fullName") or u_doc.get("username") if u_doc else request.data.get("userName")) or "Ecosystem Member"
        user_email = (u_doc.get("email") if u_doc else request.data.get("userEmail")) or ""
        user_role = (u_doc.get("role") or u_doc.get("accountType") if u_doc else request.data.get("userRole")) or "Explorer"

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        ticket_id = generate_xentro_id("complaint")

        ticket_doc = {
            "id": ticket_id,
            "accountId": user_id,
            "userId": user_id,
            "userName": user_name,
            "userEmail": user_email,
            "userRole": user_role,
            "subject": subject,
            "category": category,
            "priority": priority if priority in ["LOW", "NORMAL", "HIGH", "URGENT"] else "NORMAL",
            "message": message,
            "status": "PENDING",  # PENDING | IN_REVIEW | RESOLVED | DISMISSED
            "adminNotes": "",
            "resolutionComment": "",
            "submittedAt": now_iso,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        tickets_col = get_collection("support_tickets")
        tickets_col.insert_one(ticket_doc)
        ticket_doc.pop("_id", None)

        return api_success({
            "ticket": ticket_doc,
            "referenceId": ticket_id,
            "status": "PENDING"
        }, f"Support request #{ticket_id} submitted successfully. Our team will review your case shortly.", status_code=201)

    def get(self, request):
        user_id = (
            request.headers.get("X-User-Id")
            or request.query_params.get("userId")
            or request.query_params.get("accountId")
            or (getattr(request.user, "id", None) if getattr(request.user, "is_authenticated", False) else None)
        )
        if not user_id:
            return api_error("User identification is required.", status_code=401)

        user_id = str(user_id).strip()
        tickets_col = get_collection("support_tickets")
        # Enforce strict user isolation: only fetch submissions belonging to this accountId
        user_tickets = list(tickets_col.find({"accountId": user_id}, sort=[("createdAt", -1)]))
        for t in user_tickets:
            t.pop("_id", None)

        return api_success({
            "tickets": user_tickets,
            "count": len(user_tickets)
        })



