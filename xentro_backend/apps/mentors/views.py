"""
XENTRO Mentor Portal API
Handles Mentor profile, office hour offerings, and long-term advisory packages.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from rest_framework.permissions import AllowAny
from common.permissions import IsXentroAuthenticated

class MentorListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mentor_col = get_collection("mentor_profiles")
        users_col = get_collection("users")
        profiles = mentor_col.find({})
        results = []
        for p in profiles:
            p.pop("_id", None)
            user = users_col.find_one({"id": p.get("userId")})
            p["name"] = user.get("fullName", "Mentor") if user else "Mentor"
            p["email"] = user.get("email", "") if user else ""
            p["username"] = user.get("username", "") if user else ""
            results.append(p)
        return api_success({"mentors": results})

class MentorMeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = request.headers.get("X-User-Id") or request.query_params.get("userId")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        mentor_col = get_collection("mentor_profiles")
        profile = mentor_col.find_one({"userId": user_id})
        if not profile:
            return api_success({"profile": None, "hasProfile": False})
        profile.pop("_id", None)
        return api_success({"profile": profile, "hasProfile": True})

    def post(self, request):
        data = request.data
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = data.get("userId") or request.headers.get("X-User-Id")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        headline = data.get("headline", "")
        expertise = data.get("expertise", [])
        hourly_rate = data.get("hourlyRate", 5000) # INR
        office_hours = data.get("officeHours", "Tuesdays & Thursdays 4 PM - 7 PM")

        mentor_id = generate_xentro_id("mentor")
        doc = {
            "id": mentor_id,
            "userId": user_id,
            "headline": headline,
            "expertise": expertise,
            "hourlyRate": hourly_rate,
            "officeHours": office_hours,
            "satisfactionRating": 5.0,
            "sessionsCompleted": 0,
            "activeMentees": 0,
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        mentor_col = get_collection("mentor_profiles")
        mentor_col.update_one({"userId": user_id}, {"$set": doc}, upsert=True)

        users_col = get_collection("users")
        users_col.update_one(
            {"id": user_id},
            {
                "$set": {"accountType": "Mentor", "primaryRole": "Mentor", "roleId": mentor_id},
                "$addToSet": {"activeRoles": "Mentor"}
            }
        )

        doc.pop("_id", None)
        return api_success({"profile": doc}, "Mentor advisory profile saved.")

class MentorRequestsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request):
        req_col = get_collection("mentor_requests")
        requests = req_col.find({"mentorId": request.user.id})
        clean = []
        for r in requests:
            r.pop("_id", None)
            clean.append(r)
        return api_success({"requests": clean})

    def post(self, request):
        data = request.data
        mentor_id = data.get("mentorId")
        package = data.get("package", "1-on-1 Advisory (45 Min)")
        message = data.get("message", "Requesting mentorship for our venture")

        if not mentor_id:
            return api_error("Mentor ID is required.")

        req_id = generate_xentro_id("opportunity")
        doc = {
            "id": req_id,
            "mentorId": mentor_id,
            "requesterId": request.user.id,
            "requesterName": getattr(request.user, "full_name", "Founder"),
            "package": package,
            "message": message,
            "status": "PENDING",
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        req_col = get_collection("mentor_requests")
        req_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"request": doc}, "Mentorship request sent successfully.")
