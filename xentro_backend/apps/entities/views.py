"""
XENTRO Common Entity Engine API
Handles unified entity records for Startups, Investors, and ESPs.
"""
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.response import api_success, api_error

class EntitiesDirectoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        entity_type = request.query_params.get("type")
        query = {
            "verificationStatus": {"$in": ["VERIFIED", "Verified"]},
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        }
        if entity_type:
            query["entityType"] = {"$in": [entity_type.upper(), entity_type.capitalize(), entity_type]}

        entities_col = get_collection("entities")
        users_col = get_collection("users")
        entities = entities_col.find(query, limit=50)
        clean = []
        for e in entities:
            e.pop("_id", None)
            owner_id = e.get("primaryOwnerId") or e.get("founderPersonalAccountId")
            if owner_id:
                owner = users_col.find_one({"id": owner_id, "isActive": {"$ne": False}, "deleted": {"$ne": True}})
                if not owner:
                    continue
            clean.append(e)
        return api_success({"entities": clean})

class EntityProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, entity_id):
        entities_col = get_collection("entities")
        entity = entities_col.find_one({
            "id": entity_id,
            "status": {"$nin": ["ORPHANED_DELETED", "DELETED", "INACTIVE", "ARCHIVED", "REJECTED"]},
            "isActive": {"$ne": False},
            "is_deleted": {"$ne": True},
            "deleted": {"$ne": True}
        })
        if not entity:
            return api_error("Entity not found", status_code=404)
        entity.pop("_id", None)
        return api_success({"entity": entity})
