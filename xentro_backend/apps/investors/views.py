"""
XENTRO Investor Hub API
Handles Angel Investor & Institutional VC profiles, deal pipelines, and portfolio logs.
"""
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

class InvestorMeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = None
        if request.user and getattr(request.user, "is_authenticated", False):
            user_id = request.user.id
        if not user_id:
            user_id = request.headers.get("X-User-Id") or request.query_params.get("userId")

        if not user_id:
            return api_error("User identification is required.", status_code=400)

        inv_col = get_collection("investor_profiles")
        profile = inv_col.find_one({"userId": user_id})
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

        investor_type = data.get("investorType", "ANGEL") # ANGEL or INSTITUTIONAL_VC
        cheque_min = data.get("chequeMin", 500000)
        cheque_max = data.get("chequeMax", 2500000)
        sectors = data.get("sectors", [])

        inv_id = generate_xentro_id("investor")
        doc = {
            "id": inv_id,
            "userId": user_id,
            "accountType": "Investor",
            "investorType": investor_type,
            "chequeRange": {"min": cheque_min, "max": cheque_max},
            "sectors": sectors,
            "portfolioCount": 0,
            "totalDeployed": 0,
            "dryPowder": data.get("dryPowder", 10000000),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        inv_col = get_collection("investor_profiles")
        inv_col.update_one({"userId": user_id}, {"$set": doc}, upsert=True)

        users_col = get_collection("users")
        users_col.update_one(
            {"id": user_id},
            {
                "$set": {"accountType": "Investor", "primaryRole": "Investor", "roleId": inv_id},
                "$addToSet": {"activeRoles": "Investor"}
            }
        )

        doc.pop("_id", None)
        return api_success({"profile": doc}, "Investor thesis profile saved.")

class InvestorDealsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request):
        deals_col = get_collection("deals")
        deals = deals_col.find({"investorId": request.user.id})
        clean = []
        for d in deals:
            d.pop("_id", None)
            clean.append(d)
        return api_success({"deals": clean})

    def post(self, request):
        data = request.data
        deal = {
            "id": f"deal_{generate_xentro_id('opportunity')}",
            "investorId": request.user.id,
            "startupId": data.get("startupId"),
            "startupName": data.get("startupName"),
            "stage": data.get("stage", "INBOUND"), # INBOUND, SCREENING, DUE_DILIGENCE, TERM_SHEET, CLOSED, PASSED
            "askSize": data.get("askSize"),
            "notes": data.get("notes", ""),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        deals_col = get_collection("deals")
        deals_col.insert_one(deal)
        deal.pop("_id", None)
        return api_success({"deal": deal}, "Deal added to pipeline.")
