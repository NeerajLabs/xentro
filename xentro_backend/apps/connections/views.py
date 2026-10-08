"""
XENTRO Connections API
Single Source of Truth: MongoDB Atlas (collection: 'connections')
Handles request lifecycle: request -> pending -> accepted / declined
Synchronizes bidirectional connection status across all users, dashboards, and messaging eligibility.
"""
import uuid
import datetime
import urllib.parse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from integrations.mongodb import get_collection
from common.response import api_success, api_error


def normalize_id(uid):
    if not uid:
        return ""
    return str(uid).strip()


def resolve_avatar(avatar, name):
    if avatar and "/xentro-logo.png" not in str(avatar) and len(str(avatar).strip()) > 0:
        return str(avatar).strip()
    safe_name = urllib.parse.quote(str(name or "Member").strip())
    return f"https://api.dicebear.com/7.x/initials/svg?seed={safe_name}"


def make_pair_key(id1, id2):
    s1, s2 = normalize_id(id1).lower(), normalize_id(id2).lower()
    return f"{min(s1, s2)}_{max(s1, s2)}"


def get_request_user_id(request):
    if request.user and getattr(request.user, "is_authenticated", False):
        return normalize_id(getattr(request.user, "id", None))
    # Support explicit header or param
    h = request.headers.get("X-User-Id")
    if h:
        return normalize_id(h)
    return normalize_id(request.query_params.get("userId") or request.data.get("userId"))


class ConnectionListView(APIView):
    """
    GET /api/v1/connections/
    Retrieves all connection records for the authenticated or specified user from MongoDB.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_request_user_id(request)
        if not user_id:
            return api_error("User identification is required.", status_code=400)

        conn_col = get_collection("connections")
        users_col = get_collection("users")

        status_filter = request.query_params.get("status")

        query = {
            "$or": [
                {"senderId": {"$in": [user_id, user_id.lower(), user_id.upper()]}},
                {"recipientId": {"$in": [user_id, user_id.lower(), user_id.upper()]}}
            ]
        }
        if status_filter:
            query["status"] = status_filter

        raw_conns = list(conn_col.find(query, sort=[("updatedAt", -1)]))

        clean_conns = []
        accepted_partners = []
        total_connected = 0
        pending_received = 0
        pending_sent = 0

        for c in raw_conns:
            c.pop("_id", None)
            clean_conns.append(c)

            if c.get("status") == "accepted":
                total_connected += 1
                is_sender = (normalize_id(c.get("senderId")) == user_id)
                partner_id = c.get("recipientId") if is_sender else c.get("senderId")
                partner_name = c.get("recipientName") if is_sender else c.get("senderName")
                partner_role = c.get("recipientRole") if is_sender else c.get("senderRole")
                partner_avatar = c.get("recipientAvatar") if is_sender else c.get("senderAvatar")

                # Enrich with user details if available
                u_doc = users_col.find_one({"id": partner_id})
                if u_doc:
                    partner_name = u_doc.get("fullName") or partner_name
                    partner_avatar = u_doc.get("avatar") or partner_avatar
                    roles = u_doc.get("activeRoles") or []
                    if roles and not partner_role:
                        partner_role = roles[0]

                accepted_partners.append({
                    "id": partner_id,
                    "name": partner_name,
                    "role": partner_role or "Member",
                    "avatar": resolve_avatar(partner_avatar, partner_name),
                    "connectionId": c.get("id"),
                    "connectedAt": c.get("updatedAt") or c.get("createdAt")
                })
            elif c.get("status") == "pending":
                if normalize_id(c.get("recipientId")) == user_id:
                    pending_received += 1
                else:
                    pending_sent += 1

        # Real total active users count from MongoDB
        total_active_users = users_col.count_documents({})

        return api_success({
            "connections": clean_conns,
            "connectedPartners": accepted_partners,
            "metrics": {
                "activeConnections": total_connected,
                "pendingReceived": pending_received,
                "pendingSent": pending_sent,
                "activeUsers": total_active_users,
            }
        })


class ConnectionRequestView(APIView):
    """
    POST /api/v1/connections/request/
    Initiates a connection request from sender to recipient.
    Persists document into MongoDB Atlas 'connections' collection with status='pending'.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        sender_id = normalize_id(request.data.get("senderId") or get_request_user_id(request))
        recipient_id = normalize_id(request.data.get("recipientId") or request.data.get("partnerId"))

        if not sender_id or not recipient_id:
            return api_error("Both senderId and recipientId are required.", status_code=400)

        if sender_id == recipient_id:
            return api_error("Cannot connect with yourself.", status_code=400)

        sender_name = request.data.get("senderName", "Xentro Member").strip()
        recipient_name = request.data.get("recipientName", "Ecosystem Partner").strip()
        sender_role = request.data.get("senderRole", "Member")
        recipient_role = request.data.get("recipientRole", "Member")
        sender_avatar = resolve_avatar(request.data.get("senderAvatar"), sender_name)
        recipient_avatar = resolve_avatar(request.data.get("recipientAvatar"), recipient_name)
        note = request.data.get("note", "").strip()

        conn_col = get_collection("connections")
        users_col = get_collection("users")
        notif_col = get_collection("notifications")

        # Resolve authoritative names from MongoDB if possible
        s_user = users_col.find_one({"id": sender_id})
        if s_user:
            sender_name = s_user.get("fullName") or sender_name
            sender_avatar = s_user.get("avatar") or sender_avatar
            if s_user.get("activeRoles"):
                sender_role = s_user["activeRoles"][0]

        r_user = users_col.find_one({"id": recipient_id})
        if r_user:
            recipient_name = r_user.get("fullName") or recipient_name
            recipient_avatar = r_user.get("avatar") or recipient_avatar
            if r_user.get("activeRoles"):
                recipient_role = r_user["activeRoles"][0]

        pair_key = make_pair_key(sender_id, recipient_id)
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        existing = conn_col.find_one({"pair_key": pair_key})
        if not existing:
            # Fallback check for older records without pair_key
            existing = conn_col.find_one({
                "$or": [
                    {"senderId": {"$in": [sender_id, sender_id.lower(), sender_id.upper()]}, "recipientId": {"$in": [recipient_id, recipient_id.lower(), recipient_id.upper()]}},
                    {"senderId": {"$in": [recipient_id, recipient_id.lower(), recipient_id.upper()]}, "recipientId": {"$in": [sender_id, sender_id.lower(), sender_id.upper()]}}
                ]
            })

        if existing:
            if existing.get("status") == "accepted":
                existing.pop("_id", None)
                return api_success({"connection": existing, "status": "already_connected"}, "Users are already connected.")
            # Update to pending with current sender
            conn_id = request.data.get("id") or request.data.get("connectionId") or existing.get("id") or f"conn_{uuid.uuid4().hex[:10]}"
            conn_doc = {
                "id": conn_id,
                "pair_key": pair_key,
                "senderId": sender_id,
                "senderName": sender_name,
                "senderRole": sender_role,
                "senderAvatar": sender_avatar,
                "recipientId": recipient_id,
                "recipientName": recipient_name,
                "recipientRole": recipient_role,
                "recipientAvatar": recipient_avatar,
                "note": note,
                "status": "pending",
                "createdAt": existing.get("createdAt") or now_iso,
                "updatedAt": now_iso
            }
            conn_col.update_one({"_id": existing["_id"]}, {"$set": conn_doc})
        else:
            conn_id = request.data.get("id") or request.data.get("connectionId") or f"conn_{uuid.uuid4().hex[:10]}"
            conn_doc = {
                "id": conn_id,
                "pair_key": pair_key,
                "senderId": sender_id,
                "senderName": sender_name,
                "senderRole": sender_role,
                "senderAvatar": sender_avatar,
                "recipientId": recipient_id,
                "recipientName": recipient_name,
                "recipientRole": recipient_role,
                "recipientAvatar": recipient_avatar,
                "note": note,
                "status": "pending",
                "createdAt": now_iso,
                "updatedAt": now_iso
            }
            conn_col.insert_one(conn_doc)

        # Create persistent notification for recipient in MongoDB
        notif_doc = {
            "id": f"notif_conn_{conn_id}",
            "userId": recipient_id,
            "category": "mentorship",
            "title": f"{sender_name} sent you a connection request",
            "description": note or "Looking to connect and collaborate on Xentro.",
            "time": "Just now",
            "avatar": sender_avatar,
            "actorName": sender_name,
            "actorRole": sender_role,
            "actorId": sender_id,
            "actionRequired": True,
            "actionType": "connection_request",
            "connectionId": conn_id,
            "read": False,
            "createdAt": now_iso
        }
        notif_col.update_one({"id": notif_doc["id"]}, {"$set": notif_doc}, upsert=True)

        conn_doc.pop("_id", None)
        return api_success({"connection": conn_doc}, "Connection request sent successfully.")


class ConnectionAcceptView(APIView):
    """
    POST /api/v1/connections/accept/
    Accepts a pending connection request in MongoDB Atlas.
    Updates status from 'pending' -> 'accepted'.
    Establishes messaging eligibility and auto-initializes the pair conversation.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = normalize_id(request.data.get("userId") or get_request_user_id(request))
        connection_id = request.data.get("connectionId") or request.data.get("id")
        partner_id = normalize_id(request.data.get("partnerId"))

        conn_col = get_collection("connections")
        users_col = get_collection("users")
        conv_col = get_collection("conversations")
        notif_col = get_collection("notifications")

        conn = None
        if connection_id:
            conn = conn_col.find_one({"id": {"$in": [connection_id, connection_id.lower(), connection_id.upper()]}})

        if not conn and partner_id and user_id:
            pair_key = make_pair_key(user_id, partner_id)
            conn = conn_col.find_one({"pair_key": pair_key})
            if not conn:
                conn = conn_col.find_one({
                    "$or": [
                        {"senderId": {"$in": [user_id, user_id.lower(), user_id.upper()]}, "recipientId": {"$in": [partner_id, partner_id.lower(), partner_id.upper()]}},
                        {"senderId": {"$in": [partner_id, partner_id.lower(), partner_id.upper()]}, "recipientId": {"$in": [user_id, user_id.lower(), user_id.upper()]}}
                    ]
                })

        if not conn:
            return api_error("Connection request not found.", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Update relationship in MongoDB
        conn_col.update_one(
            {"_id": conn["_id"]},
            {"$set": {
                "status": "accepted",
                "updatedAt": now_iso
            }}
        )

        sender_id = normalize_id(conn.get("senderId"))
        recipient_id = normalize_id(conn.get("recipientId"))
        sender_name = conn.get("senderName", "Sender")
        recipient_name = conn.get("recipientName", "Recipient")

        pair_key = conn.get("pair_key") or make_pair_key(sender_id, recipient_id)
        conv_id = f"conv_{pair_key}"

        # Initialize conversation in MongoDB 'conversations' collection
        conv_doc = {
            "id": conv_id,
            "pair_key": pair_key,
            "participants": [sender_id, recipient_id],
            "lastMessage": f"Connection accepted. You can now chat securely.",
            "status": "active",
            "updatedAt": now_iso
        }
        conv_col.update_one(
            {"id": conv_id},
            {
                "$setOnInsert": {
                    "createdAt": now_iso,
                },
                "$set": conv_doc
            },
            upsert=True
        )

        # Mark recipient's connection request notification as resolved so Accept button disappears
        notif_col.update_many(
            {
                "$or": [
                    {"id": f"notif_conn_{conn.get('id')}"},
                    {"connectionId": conn.get("id"), "actionType": "connection_request"},
                    {"connectionId": conn.get("id")}
                ]
            },
            {"$set": {
                "actionRequired": False,
                "read": True,
                "isRead": True,
                "description": f"You are now connected with {sender_name}."
            }}
        )

        # Notify the original sender that their request was accepted
        notif_doc = {
            "id": f"notif_accepted_{conn.get('id')}",
            "userId": sender_id,
            "category": "mentorship",
            "title": f"{recipient_name} accepted your connection request!",
            "description": "You are now connected on Xentro! Start collaborating.",
            "time": "Just now",
            "avatar": conn.get("recipientAvatar", "/xentro-logo.png"),
            "actorName": recipient_name,
            "actorRole": conn.get("recipientRole", "Member"),
            "actorId": recipient_id,
            "actionType": "connection",
            "connectionId": conn.get("id"),
            "read": False,
            "createdAt": now_iso
        }
        notif_col.update_one({"id": notif_doc["id"]}, {"$set": notif_doc}, upsert=True)

        updated_conn = conn_col.find_one({"_id": conn["_id"]})
        updated_conn.pop("_id", None)

        return api_success({
            "connection": updated_conn,
            "conversationId": conv_id
        }, "Connection accepted successfully.")


class ConnectionDeclineView(APIView):
    """
    POST /api/v1/connections/decline/
    Declines or cancels a connection request.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = normalize_id(get_request_user_id(request))
        connection_id = request.data.get("connectionId") or request.data.get("id")
        partner_id = normalize_id(request.data.get("partnerId"))

        conn_col = get_collection("connections")

        conn = None
        if connection_id:
            conn = conn_col.find_one({"id": connection_id})

        if not conn and partner_id and user_id:
            pair_key = make_pair_key(user_id, partner_id)
            conn = conn_col.find_one({"pair_key": pair_key})
            if not conn:
                conn = conn_col.find_one({
                    "$or": [
                        {"senderId": user_id, "recipientId": partner_id},
                        {"senderId": partner_id, "recipientId": user_id}
                    ]
                })

        if not conn:
            return api_error("Connection not found.", status_code=404)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conn_col.update_one(
            {"_id": conn["_id"]},
            {"$set": {
                "status": "declined",
                "updatedAt": now_iso
            }}
        )

        notif_col = get_collection("notifications")
        notif_col.update_many(
            {
                "$or": [
                    {"id": f"notif_conn_{conn.get('id')}"},
                    {"connectionId": conn.get("id")}
                ]
            },
            {"$set": {
                "actionRequired": False,
                "read": True,
                "isRead": True,
                "description": "Connection request declined."
            }}
        )

        updated_conn = conn_col.find_one({"_id": conn["_id"]})
        updated_conn.pop("_id", None)
        return api_success({"connection": updated_conn}, "Connection request declined.")


class ConnectionStatusView(APIView):
    """
    GET /api/v1/connections/status/?userId=A&partnerId=B
    Returns exact status ('none', 'pending', 'received', 'connected') directly from MongoDB.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = normalize_id(request.query_params.get("userId") or get_request_user_id(request))
        partner_id = normalize_id(request.query_params.get("partnerId"))

        if not user_id or not partner_id:
            return api_error("Both userId and partnerId are required.", status_code=400)

        pair_key = make_pair_key(user_id, partner_id)
        conn_col = get_collection("connections")

        conn = conn_col.find_one({"pair_key": pair_key})
        if not conn:
            conn = conn_col.find_one({
                "$or": [
                    {"senderId": user_id, "recipientId": partner_id},
                    {"senderId": partner_id, "recipientId": user_id}
                ]
            })

        if not conn or conn.get("status") == "declined":
            return api_success({"status": "none", "connection": None})

        if conn.get("status") == "accepted":
            conn_clean = dict(conn)
            conn_clean.pop("_id", None)
            return api_success({"status": "connected", "connection": conn_clean})

        if conn.get("status") == "pending":
            conn_clean = dict(conn)
            conn_clean.pop("_id", None)
            if normalize_id(conn.get("senderId")) == user_id:
                return api_success({"status": "pending", "connection": conn_clean})
            else:
                return api_success({"status": "received", "connection": conn_clean})

        return api_success({"status": "none", "connection": None})
