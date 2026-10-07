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
        query = {"verificationStatus": "VERIFIED"}
        if entity_type:
            query["entityType"] = entity_type.upper()

        entities_col = get_collection("entities")
        entities = entities_col.find(query, limit=50)
        clean = []
        for e in entities:
            e.pop("_id", None)
            clean.append(e)
        return api_success({"entities": clean})

class EntityProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, entity_id):
        entities_col = get_collection("entities")
        entity = entities_col.find_one({"id": entity_id})
        if not entity:
            return api_error("Entity not found", status_code=404)
        entity.pop("_id", None)
        return api_success({"entity": entity})
