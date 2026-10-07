"""
XENTRO Notifications API
Direct MongoDB Atlas integration for persistent notifications.
"""
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.response import api_success, api_error


def normalize_id(uid):
    if not uid:
        return ""
    return str(uid).strip()


def get_request_user_id(request):
    if request.user and getattr(request.user, "is_authenticated", False):
        return normalize_id(getattr(request.user, "id", None))
    h = request.headers.get("X-User-Id")
    if h:
        return normalize_id(h)
    return normalize_id(request.query_params.get("userId") or request.data.get("userId"))


class NotificationsListView(APIView):
    """
    GET /api/v1/notifications/?userId=<id>
    Retrieves authentic notifications from MongoDB Atlas.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_request_user_id(request)
        if not user_id:
            return api_error("User identification is required.", status_code=400)

        notif_col = get_collection("notifications")
        # Match case-insensitively
        notifs = list(notif_col.find(
            {"userId": {"$in": [user_id, user_id.lower(), user_id.upper()]}},
            sort=[("createdAt", -1)],
            limit=50
        ))

        clean = []
        for n in notifs:
            n.pop("_id", None)
            clean.append({
                "id": n.get("id"),
                "userId": user_id,
                "category": n.get("category", "system"),
                "title": n.get("title", "New Notification"),
                "description": n.get("description", ""),
                "time": n.get("time", "Just now"),
                "unread": not bool(n.get("read") or n.get("isRead")),
                "avatar": n.get("avatar", "/xentro-logo.png"),
                "actorName": n.get("actorName"),
                "actorRole": n.get("actorRole"),
                "actorId": n.get("actorId"),
                "connectionId": n.get("connectionId"),
                "actionRequired": bool(n.get("actionRequired", False)),
                "actionType": n.get("actionType", "general"),
                "targetTab": n.get("targetTab", "notifications"),
                "createdAt": n.get("createdAt", "")
            })

        unread_count = len([n for n in clean if n["unread"]])
        return api_success({"notifications": clean, "unreadCount": unread_count})


class MarkReadNotificationView(APIView):
    """
    POST /api/v1/notifications/<notif_id>/read/
    PATCH /api/v1/notifications/<notif_id>/read/
    Marks a single notification as read in MongoDB Atlas.
    """
    permission_classes = [AllowAny]

    def patch(self, request, notif_id):
        user_id = get_request_user_id(request)
        notif_col = get_collection("notifications")
        query = {"id": notif_id}
        if user_id:
            query["userId"] = {"$in": [user_id, user_id.lower(), user_id.upper()]}
        
        notif_col.update_one(query, {"$set": {"read": True, "isRead": True, "unread": False}})
        return api_success({"id": notif_id, "isRead": True})

    def post(self, request, notif_id):
        return self.patch(request, notif_id)


class MarkAllReadNotificationView(APIView):
    """
    POST /api/v1/notifications/mark-all-read/
    Marks all notifications for user as read.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = get_request_user_id(request)
        if not user_id:
            return api_error("User identification is required.", status_code=400)

        notif_col = get_collection("notifications")
        notif_col.update_many(
            {"userId": {"$in": [user_id, user_id.lower(), user_id.upper()]}},
            {"$set": {"read": True, "isRead": True, "unread": False}}
        )
        return api_success({"success": True})


class ClearNotificationsView(APIView):
    """
    DELETE /api/v1/notifications/clear/
    POST /api/v1/notifications/clear/
    Clears all notifications for user in MongoDB Atlas.
    """
    permission_classes = [AllowAny]

    def delete(self, request):
        user_id = get_request_user_id(request)
        notif_col = get_collection("notifications")
        if user_id:
            notif_col.delete_many({"userId": {"$in": [user_id, user_id.lower(), user_id.upper()]}})
        return api_success({"cleared": True}, "All notifications cleared successfully.")

    def post(self, request):
        return self.delete(request)
