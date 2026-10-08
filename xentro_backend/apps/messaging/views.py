"""
XENTRO REST Messaging API
Enforces Connection-Gated Messaging:
- Single source of truth: MongoDB Atlas ('connections', 'conversations', 'messages')
- Messaging is strictly gated: ONLY users with status == 'accepted' can create conversations or send messages.
- Bidirectional participant resolution: User A sees User B, User B sees User A.
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


def make_pair_key(id1, id2):
    s1, s2 = normalize_id(id1).lower(), normalize_id(id2).lower()
    return f"{min(s1, s2)}_{max(s1, s2)}"


def get_request_user_id(request):
    if request.user and getattr(request.user, "is_authenticated", False):
        return normalize_id(getattr(request.user, "id", None))
    h = request.headers.get("X-User-Id")
    if h:
        return normalize_id(h)
    return normalize_id(request.query_params.get("userId") or request.data.get("userId"))


def check_connection_accepted(user_id, partner_id):
    """
    Checks MongoDB 'connections' collection.
    Returns (is_accepted: bool, status: str, conn_doc: dict).
    """
    conn_col = get_collection("connections")
    u1, u2 = normalize_id(user_id), normalize_id(partner_id)
    if not u1 or not u2:
        return False, "none", None
    pair_key = make_pair_key(u1, u2)
    conn = conn_col.find_one({"pair_key": pair_key})
    if not conn:
        conn = conn_col.find_one({
            "$or": [
                {"senderId": {"$in": [u1, u1.lower(), u1.upper()]}, "recipientId": {"$in": [u2, u2.lower(), u2.upper()]}},
                {"senderId": {"$in": [u2, u2.lower(), u2.upper()]}, "recipientId": {"$in": [u1, u1.lower(), u1.upper()]}}
            ]
        })
    if not conn:
        return False, "none", None
    status = conn.get("status", "none")
    return (status == "accepted"), status, conn


def resolve_conversation_participants(conversation_id, current_user_id=None, request_data=None):
    """
    Safely resolves the two participant IDs from a conversation_id string,
    supporting IDs with underscores (like usr_1791235869648, XU-123456, etc.).
    """
    if not conversation_id:
        return None, None
    raw = str(conversation_id).strip()
    if raw.startswith("conv_"):
        raw = raw[5:]

    # 1. If explicit partnerId or recipientId provided
    if request_data:
        p_id = request_data.get("partnerId") or request_data.get("recipientId")
        u_id = request_data.get("userId") or request_data.get("senderId") or current_user_id
        if p_id and u_id:
            return normalize_id(u_id), normalize_id(p_id)

    # 2. If current_user_id is known, check if it forms part of the raw key
    if current_user_id:
        curr_norm = normalize_id(current_user_id).lower()
        raw_lower = raw.lower()
        if raw_lower.startswith(curr_norm + "_"):
            other = raw[len(curr_norm) + 1:]
            return normalize_id(current_user_id), normalize_id(other)
        elif raw_lower.endswith("_" + curr_norm):
            other = raw[:len(raw) - len(curr_norm) - 1]
            return normalize_id(current_user_id), normalize_id(other)

    # 3. Check existing connections in MongoDB to match potential pair keys
    conn_col = get_collection("connections")
    conn = conn_col.find_one({"pair_key": {"$regex": f"^{raw}$", "$options": "i"}})
    if conn:
        return normalize_id(conn.get("senderId")), normalize_id(conn.get("recipientId"))

    # 4. Fallback split if exactly 2 parts
    parts = raw.split("_")
    if len(parts) == 2:
        return parts[0], parts[1]
    elif len(parts) > 2:
        users_col = get_collection("users")
        for i in range(1, len(parts)):
            cand1 = "_".join(parts[:i])
            cand2 = "_".join(parts[i:])
            if users_col.find_one({"id": {"$in": [cand1, cand1.upper(), cand1.lower()]}}) or \
               users_col.find_one({"id": {"$in": [cand2, cand2.upper(), cand2.lower()]}}):
                return cand1, cand2
        return parts[0], "_".join(parts[1:])
    return None, None


class ConversationsListView(APIView):
    """
    GET /api/v1/messages/conversations/
    POST /api/v1/messages/conversations/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = get_request_user_id(request)
        if not user_id:
            return api_error("User identification is required.", status_code=400)

        conv_col = get_collection("conversations")
        users_col = get_collection("users")
        msg_col = get_collection("messages")

        user_norm = user_id.lower()
        convs = list(conv_col.find(
            {"participants": {"$in": [user_id, user_id.lower(), user_id.upper()]}},
            sort=[("updatedAt", -1)]
        ))
        clean = []

        for c in convs:
            c.pop("_id", None)
            participants = c.get("participants", [])

            # Identify the other participant
            other_id = None
            for p in participants:
                if normalize_id(p).lower() != user_norm:
                    other_id = normalize_id(p)
                    break

            if not other_id and len(participants) > 0:
                other_id = normalize_id(participants[0])

            # Check live connection status in MongoDB
            is_accepted, conn_status, _ = check_connection_accepted(user_id, other_id)

            # Check if conversation already has persisted participantDetails
            p_details = c.get("participantDetails") or {}
            cached_partner = p_details.get(other_id) or p_details.get(other_id.lower() if other_id else "") or {}

            # Resolve other participant profile from users collection
            partner_name = cached_partner.get("name") or "Connected Member"
            partner_role = cached_partner.get("role") or "Startup"
            partner_avatar = cached_partner.get("avatar") or ""
            partner_company = cached_partner.get("company") or "Xentro Network"

            if other_id:
                u_doc = users_col.find_one({
                    "$or": [
                        {"id": {"$in": [other_id, other_id.lower(), other_id.upper()]}},
                        {"altIds": other_id},
                        {"userId": other_id},
                        {"xentroId": other_id},
                        {"email": other_id.lower()}
                    ]
                })

                # Fallback: check connections collection for partner identity
                if not u_doc:
                    conn_col = get_collection("connections")
                    conn_doc = conn_col.find_one({
                        "$or": [
                            {"senderId": other_id},
                            {"recipientId": other_id}
                        ]
                    })
                    if conn_doc:
                        is_sender = (normalize_id(conn_doc.get("senderId")).lower() == normalize_id(other_id).lower())
                        c_name = conn_doc.get("senderName") if is_sender else conn_doc.get("recipientName")
                        c_role = conn_doc.get("senderRole") if is_sender else conn_doc.get("recipientRole")
                        c_avatar = conn_doc.get("senderAvatar") if is_sender else conn_doc.get("recipientAvatar")
                        if c_name:
                            partner_name = c_name
                        if c_role:
                            partner_role = c_role
                        if c_avatar and c_avatar != "/xentro-logo.png":
                            partner_avatar = c_avatar

                # Fallback: check if other_id sent any messages with a senderName
                if partner_name == "Connected Member":
                    m_sample = msg_col.find_one({"conversationId": c.get("id"), "senderId": other_id, "senderName": {"$ne": ""}})
                    if m_sample and m_sample.get("senderName") and m_sample.get("senderName") not in ["Sender", "Member", "Connected Member"]:
                        partner_name = m_sample.get("senderName")

                if u_doc:
                    partner_name = u_doc.get("fullName") or u_doc.get("name") or partner_name
                    u_avatar = u_doc.get("avatar")
                    if u_avatar and u_avatar != "/xentro-logo.png":
                        partner_avatar = u_avatar
                    roles = u_doc.get("activeRoles") or []
                    account_type = u_doc.get("accountType") or u_doc.get("userType") or u_doc.get("primaryRole")
                    if account_type:
                        partner_role = account_type
                    elif roles:
                        partner_role = roles[0]
                    partner_company = u_doc.get("organization") or u_doc.get("entityName") or partner_name

            # Ensure neutral initials avatar instead of brand logo
            if not partner_avatar or partner_avatar == "/xentro-logo.png":
                partner_avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={urllib.parse.quote(partner_name)}"

            # Fetch messages belonging to this thread
            conv_id = c.get("id")
            msgs = list(msg_col.find(
                {"conversationId": {"$in": [conv_id, (conv_id or "").lower(), (conv_id or "").upper()]}},
                sort=[("createdAt", 1)],
                limit=100
            ))
            clean_msgs = []
            for m in msgs:
                m_content = m.get("content") or m.get("text", "")
                m_raw_type = (m.get("type") or "TEXT").upper()
                is_system = (m_raw_type == "SYSTEM") or m_content.startswith("🤝 Connection established")
                clean_msgs.append({
                    "id": m.get("id", str(uuid.uuid4())),
                    "clientMessageId": m.get("clientMessageId") or m.get("id"),
                    "conversationId": conv_id,
                    "senderId": m.get("senderId"),
                    "senderName": m.get("senderName", partner_name),
                    "text": m_content,
                    "content": m_content,
                    "type": "system" if is_system else m.get("type", "TEXT"),
                    "isSystem": is_system,
                    "timestamp": m.get("createdAt", ""),
                    "createdAt": m.get("createdAt", ""),
                    "readBy": m.get("readBy", [m.get("senderId")]),
                    "isMe": False if is_system else (normalize_id(m.get("senderId")).lower() == user_norm)
                })

            # Get unread count
            unread_count = msg_col.count_documents({
                "conversationId": {"$in": [conv_id, (conv_id or "").lower(), (conv_id or "").upper()]},
                "senderId": {"$nin": [user_id, user_id.lower(), user_id.upper()]},
                "readBy": {"$nin": [user_id, user_id.lower(), user_id.upper()]}
            })

            last_msg_text = clean_msgs[-1]["text"] if clean_msgs else c.get("lastMessage", "Conversation active.")

            clean.append({
                "id": conv_id,
                "pair_key": c.get("pair_key"),
                "participants": participants,
                "participantDetails": p_details,
                "partner": {
                    "id": other_id,
                    "name": partner_name,
                    "role": partner_role,
                    "avatar": partner_avatar,
                    "company": partner_company,
                },
                "user": {
                    "id": other_id,
                    "name": partner_name,
                    "role": partner_role,
                    "avatar": partner_avatar,
                    "company": partner_company,
                },
                "lastMessage": last_msg_text,
                "updatedAt": c.get("updatedAt", ""),
                "unreadCount": unread_count,
                "connectionStatus": conn_status,
                "canMessage": is_accepted,
                "messages": clean_msgs
            })

        return api_success({"conversations": clean})

    def post(self, request):
        user_id = get_request_user_id(request)
        partner_id = normalize_id(request.data.get("partnerId") or request.data.get("recipientId"))

        if not user_id or not partner_id:
            return api_error("Both current user and partnerId are required.", status_code=400)

        if user_id == partner_id:
            return api_error("Cannot start a conversation with yourself.", status_code=400)

        # STRICT GATING: MongoDB connection status verification
        is_accepted, status, _ = check_connection_accepted(user_id, partner_id)
        if not is_accepted:
            return api_error(
                f"Messaging eligibility denied. Connection is not accepted in MongoDB (current status: '{status}'). "
                f"Both users must have an accepted connection before messaging.",
                status_code=403
            )

        pair_key = make_pair_key(user_id, partner_id)
        conv_id = f"conv_{pair_key}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        conv_col = get_collection("conversations")
        conv_doc = conv_col.find_one({"id": conv_id})

        initial_msg = request.data.get("initialMessage", "").strip()

        if not conv_doc:
            new_conv = {
                "id": conv_id,
                "pair_key": pair_key,
                "participants": [user_id, partner_id],
                "lastMessage": initial_msg or "Connection established. Secure chat active.",
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "status": "active"
            }
            conv_col.insert_one(new_conv)
            conv_doc = new_conv

        if initial_msg:
            msg_col = get_collection("messages")
            msg_doc = {
                "id": f"msg_{uuid.uuid4().hex[:12]}",
                "conversationId": conv_id,
                "senderId": user_id,
                "senderName": request.data.get("senderName", "Sender"),
                "content": initial_msg,
                "type": "TEXT",
                "attachments": [],
                "readBy": [user_id],
                "createdAt": now_iso
            }
            msg_col.insert_one(msg_doc)
            conv_col.update_one({"id": conv_id}, {"$set": {"lastMessage": initial_msg, "updatedAt": now_iso}})

        conv_doc.pop("_id", None)
        return api_success({"conversation": conv_doc, "conversationId": conv_id})


class MessagesHistoryView(APIView):
    """
    GET /api/v1/messages/conversations/<conversation_id>/
    POST /api/v1/messages/conversations/<conversation_id>/send/
    """
    permission_classes = [AllowAny]

    def get(self, request, conversation_id):
        user_id = get_request_user_id(request)
        conv_col = get_collection("conversations")
        conv = conv_col.find_one({"id": {"$in": [conversation_id, conversation_id.lower(), conversation_id.upper()]}})
        if not conv:
            conv = conv_col.find_one({"id": {"$regex": f"^{conversation_id}$", "$options": "i"}})
        if not conv:
            p1, p2 = resolve_conversation_participants(conversation_id, user_id, request.query_params)
            if p1 and p2:
                is_accepted, _, _ = check_connection_accepted(p1, p2)
                if is_accepted:
                    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    conv = {
                        "id": conversation_id,
                        "pair_key": make_pair_key(p1, p2),
                        "participants": [p1, p2],
                        "lastMessage": "Conversation initiated.",
                        "createdAt": now_iso,
                        "updatedAt": now_iso,
                        "status": "active"
                    }
                    conv_col.insert_one(conv)
                    return api_success({"messages": [], "conversationId": conversation_id})
            return api_error("Conversation not found.", status_code=404)

        participants = conv.get("participants", [])
        norm_participants = [normalize_id(p).lower() for p in participants]
        if user_id and normalize_id(user_id).lower() not in norm_participants:
            return api_error("Access denied to this conversation.", status_code=403)

        msg_col = get_collection("messages")
        messages = list(msg_col.find(
            {"conversationId": {"$in": [conversation_id, conversation_id.lower(), conversation_id.upper()]}},
            sort=[("createdAt", 1)],
            limit=100
        ))
        clean = []
        user_norm = normalize_id(user_id).lower() if user_id else ""
        for m in messages:
            m.pop("_id", None)
            m_content = m.get("content") or m.get("text", "")
            m_raw_type = (m.get("type") or "TEXT").upper()
            is_system = (m_raw_type == "SYSTEM") or m_content.startswith("🤝 Connection established")
            clean.append({
                "id": m.get("id", str(uuid.uuid4())),
                "clientMessageId": m.get("clientMessageId") or m.get("id"),
                "conversationId": conversation_id,
                "senderId": m.get("senderId"),
                "senderName": m.get("senderName", "User"),
                "text": m_content,
                "content": m_content,
                "type": "system" if is_system else m.get("type", "TEXT"),
                "isSystem": is_system,
                "attachments": m.get("attachments", []),
                "timestamp": m.get("createdAt", ""),
                "createdAt": m.get("createdAt", ""),
                "readBy": m.get("readBy", [m.get("senderId")]),
                "isMe": False if is_system else ((normalize_id(m.get("senderId")).lower() == user_norm) if user_norm else False)
            })

        # Mark as read for this user
        if user_id:
            msg_col.update_many(
                {
                    "conversationId": {"$in": [conversation_id, conversation_id.lower(), conversation_id.upper()]},
                    "readBy": {"$nin": [user_id, user_id.lower(), user_id.upper()]}
                },
                {"$addToSet": {"readBy": user_id}}
            )

        return api_success({"messages": clean, "conversationId": conversation_id})

    def post(self, request, conversation_id):
        user_id = get_request_user_id(request)
        content = (request.data.get("content") or request.data.get("text") or "").strip()
        msg_type = request.data.get("type", "TEXT")
        attachments = request.data.get("attachments", [])

        if not content and not attachments:
            return api_error("Message content or attachment is required.", status_code=400)

        conv_col = get_collection("conversations")
        conv = conv_col.find_one({"id": {"$in": [conversation_id, conversation_id.lower(), conversation_id.upper()]}})
        if not conv:
            conv = conv_col.find_one({"id": {"$regex": f"^{conversation_id}$", "$options": "i"}})
        if not conv:
            p1, p2 = resolve_conversation_participants(conversation_id, user_id, request.data)
            if p1 and p2:
                is_accepted, status, _ = check_connection_accepted(p1, p2)
                if not is_accepted:
                    return api_error(
                        f"Message rejected: Cannot message user without an accepted MongoDB connection (status: '{status}').",
                        status_code=403
                    )
                now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
                conv = {
                    "id": conversation_id,
                    "pair_key": make_pair_key(p1, p2),
                    "participants": [p1, p2],
                    "lastMessage": content,
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                    "status": "active"
                }
                conv_col.insert_one(conv)
        if not conv:
            return api_error("Conversation not found.", status_code=404)

        participants = conv.get("participants", [])
        norm_participants = [normalize_id(p).lower() for p in participants]
        user_norm = normalize_id(user_id).lower() if user_id else ""
        if user_id and user_norm not in norm_participants:
            return api_error("Access denied to this conversation.", status_code=403)

        # STRICT GATING: Verify MongoDB connection is accepted before delivering message
        other_id = None
        for p in participants:
            if normalize_id(p).lower() != user_norm:
                other_id = normalize_id(p)
                break

        if other_id and user_id:
            is_accepted, status, _ = check_connection_accepted(user_id, other_id)
            if not is_accepted:
                return api_error(
                    f"Message rejected: Cannot message user without an accepted MongoDB connection (status: '{status}').",
                    status_code=403
                )

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        sender_name = request.data.get("senderName") or getattr(request.user, "full_name", "") or "Member"
        client_id = request.data.get("id") or request.data.get("clientMessageId")

        msg_col = get_collection("messages")

        # 1. Exact client message ID deduplication
        if client_id:
            existing = msg_col.find_one({"id": client_id})
            if existing:
                existing.pop("_id", None)
                return api_success({"message": existing}, "Message already delivered.")

        # 2. Short window proximity deduplication (prevent rapid multi-submissions)
        three_sec_ago = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=3)).isoformat()
        recent_dup = msg_col.find_one({
            "conversationId": {"$in": [conversation_id, conversation_id.lower(), conversation_id.upper()]},
            "senderId": user_id,
            "content": content,
            "createdAt": {"$gte": three_sec_ago}
        })
        if recent_dup:
            recent_dup.pop("_id", None)
            return api_success({"message": recent_dup}, "Message already delivered.")

        msg_id = client_id if client_id else f"msg_{uuid.uuid4().hex[:12]}"

        doc = {
            "id": msg_id,
            "clientMessageId": client_id or msg_id,
            "conversationId": conversation_id,
            "senderId": user_id,
            "senderName": sender_name,
            "content": content,
            "text": content,
            "type": msg_type,
            "attachments": attachments,
            "readBy": [user_id] if user_id else [],
            "createdAt": now_iso
        }

        msg_col.insert_one(doc)

        conv_col.update_one(
            {"id": conversation_id},
            {"$set": {
                "lastMessage": content,
                "updatedAt": now_iso
            }}
        )

        doc.pop("_id", None)
        return api_success({"message": doc})


class MarkReadView(APIView):
    """
    POST /api/v1/messages/conversations/<conversation_id>/read/
    POST /api/v1/messages/read/
    Marks messages as read by the current user across conversations.
    """
    permission_classes = [AllowAny]

    def post(self, request, conversation_id=None):
        user_id = get_request_user_id(request)
        if not user_id:
            return api_error("User identification is required.", status_code=400)

        conv_id = conversation_id or request.data.get("conversationId")
        msg_col = get_collection("messages")

        query = {"readBy": {"$nin": [user_id, user_id.lower(), user_id.upper()]}}
        if conv_id:
            query["conversationId"] = {"$in": [conv_id, conv_id.lower(), conv_id.upper()]}

        result = msg_col.update_many(query, {"$addToSet": {"readBy": user_id}})
        return api_success({
            "modifiedCount": result.modified_count,
            "userId": user_id,
            "conversationId": conv_id
        }, "Messages marked as read.")
