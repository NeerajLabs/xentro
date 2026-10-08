"""
XENTRO Startup Engine API
Handles Startup profile creation, asks, cap tables, and metrics.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id, clean_username
from common.response import api_success, api_error
from rest_framework.permissions import AllowAny
from common.permissions import IsXentroAuthenticated

class MyStartupsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = request.headers.get("X-User-Id") or request.query_params.get("userId")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        entities_col = get_collection("entities")
        startups = entities_col.find({
            "primaryOwnerId": user_id,
            "entityType": {"$in": ["STARTUP", "Startup"]},
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        })
        results = []
        for s in startups:
            s.pop("_id", None)
            results.append(s)
        return api_success({"startups": results})

    def post(self, request):
        data = request.data
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = data.get("userId") or request.headers.get("X-User-Id")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        name = (data.get("name") or data.get("startupName") or "").strip()
        if not name:
            return api_error("Startup name is required.")

        startup_id = generate_xentro_id("startup")
        username = clean_username(name)
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        doc = {
            "id": startup_id,
            "entityType": "STARTUP",
            "accountType": "Startup",
            "name": name,
            "username": username,
            "primaryOwnerId": user_id,
            "oneLiner": data.get("oneLiner", ""),
            "sector": data.get("sector") or data.get("industry", ""),
            "stage": data.get("stage", "IDEA"),
            "regType": data.get("regType", "Pvt Ltd"),
            "regNo": data.get("regNo", ""),
            "location": data.get("location", ""),
            "website": data.get("website", ""),
            "officialEmail": data.get("officialEmail", ""),
            "verificationStatus": "ACTIVE",
            "visibility": "PUBLIC",
            "ghostMode": False,
            "readinessScore": 65,
            "createdAt": now_iso,
            "updatedAt": now_iso
        }

        entities_col = get_collection("entities")
        entities_col.insert_one(doc)

        users_col = get_collection("users")
        users_col.update_one(
            {"id": user_id},
            {
                "$set": {"accountType": "Startup", "entityId": startup_id, "primaryRole": "Startup"},
                "$addToSet": {"activeRoles": "Startup"}
            }
        )

        doc.pop("_id", None)
        return api_success({"startup": doc, "entity": doc}, "Startup created successfully.", status_code=201)

class StartupDiscoverView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        entities_col = get_collection("entities")
        users_col = get_collection("users")
        query = {
            "entityType": {"$in": ["STARTUP", "Startup"]},
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        }
        startups = entities_col.find(query)
        results = []
        for s in startups:
            s.pop("_id", None)
            owner_id = s.get("primaryOwnerId") or s.get("founderPersonalAccountId")
            owner = users_col.find_one({"id": owner_id, "isActive": {"$ne": False}, "deleted": {"$ne": True}}) if owner_id else None
            # Only display if the owner user exists and is active in MongoDB
            if not owner:
                continue
            s["founder"] = {
                "name": owner.get("fullName", "Founder"),
                "email": owner.get("email", ""),
                "id": owner.get("id", "")
            }
            results.append(s)
        return api_success({"startups": results})

    def post(self, request):
        data = request.data
        name = data.get("name", "").strip()
        one_liner = data.get("oneLiner", "")
        sector = data.get("sector", "")
        stage = data.get("stage", "IDEA")

        if not name:
            return api_error("Startup name is required.")

        startup_id = generate_xentro_id("startup")
        username = clean_username(name)

        doc = {
            "id": startup_id,
            "entityType": "STARTUP",
            "name": name,
            "username": username,
            "primaryOwnerId": request.user.id,
            "oneLiner": one_liner,
            "sector": sector,
            "stage": stage,
            "verificationStatus": "PENDING",
            "visibility": "PUBLIC",
            "ghostMode": False,
            "readinessScore": 65,
            "isActive": True,
            "status": "ACTIVE",
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        entities_col = get_collection("entities")
        entities_col.insert_one(doc)

        # Update user's activeRoles
        users_col = get_collection("users")
        users_col.update_one(
            {"id": request.user.id},
            {"$addToSet": {"activeRoles": "Founder"}}
        )

        doc.pop("_id", None)
        return api_success({"startup": doc}, "Startup profile created successfully.", status_code=201)

class StartupDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, startup_id):
        entities_col = get_collection("entities")
        doc = entities_col.find_one({
            "$and": [
                {
                    "$or": [
                        {"id": startup_id},
                        {"id": {"$regex": f"^{startup_id}$", "$options": "i"}},
                        {"primaryOwnerId": startup_id},
                        {"username": {"$regex": f"^{startup_id}$", "$options": "i"}},
                        {"name": {"$regex": f"^{startup_id}$", "$options": "i"}}
                    ]
                },
                {"status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]}},
                {"isActive": {"$ne": False}},
                {"is_deleted": {"$ne": True}},
                {"deleted": {"$ne": True}}
            ]
        })
        if not doc:
            return api_error("Startup not found", status_code=404)
        doc.pop("_id", None)
        return api_success({"startup": doc})

class StartupAsksView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request, startup_id):
        asks_col = get_collection("asks")
        asks = asks_col.find({"startupId": startup_id}, sort=[("createdAt", -1)])
        clean = []
        for a in asks:
            a.pop("_id", None)
            clean.append(a)
        return api_success({"asks": clean})

    def post(self, request, startup_id):
        data = request.data
        title = data.get("title", "")
        ask_type = data.get("askType", "CAPITAL") # CAPITAL, ADVISORY, HIRING
        target_amount = data.get("targetAmount")
        description = data.get("description", "")

        ask_id = generate_xentro_id("opportunity")
        doc = {
            "id": ask_id,
            "startupId": startup_id,
            "founderId": request.user.id,
            "title": title,
            "askType": ask_type,
            "targetAmount": target_amount,
            "description": description,
            "status": "OPEN",
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        asks_col = get_collection("asks")
        asks_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"ask": doc}, "Startup ask published to ecosystem.")
