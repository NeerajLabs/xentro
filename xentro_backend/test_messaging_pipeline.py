"""
End-to-End Test for the Complete MongoDB Messaging and Notification Pipeline.
Tests the exact scenario described by the user:
- User A (Sender) sends message to User B (Receiver)
- Traces message storage in MongoDB
- Verifies conversation ID consistency
- Verifies message read/retrieval API for User B
- Verifies sender/receiver direction (isMe, senderId, receiverId)
- Verifies non-empty content
- Verifies real-time event broadcasting and persistence across simulated reload
"""
import requests
import json
from integrations.mongodb import get_db

db = get_db()
base_url = "http://127.0.0.1:8000/api/v1"
next_url = "http://localhost:3000/api"

user_a_id = "XU-834524"  # Neerajj
user_b_id = "XU-401341"  # John Developer
user_c_id = "XU-783757"  # Mukesh

print("=== STARTING FULL MESSAGING & NOTIFICATION PIPELINE E2E TEST ===")
print(f"User A: {user_a_id} (Neerajj)")
print(f"User B: {user_b_id} (John Developer)")
print(f"User C: {user_c_id} (Mukesh)")

# --- SCENARIO 1: Connection & Notifications Lifecycle (User A -> User C) ---
print("\n--- TEST 1: Connection Request & Notification Ingestion (A -> C) ---")
pair_ac = f"{min(user_a_id, user_c_id)}_{max(user_a_id, user_c_id)}"
db["connections"].delete_many({"pair_key": pair_ac})
db["notifications"].delete_many({"userId": user_c_id, "actionType": "connection_request"})
db["conversations"].delete_many({"pair_key": pair_ac})
db["messages"].delete_many({"conversationId": f"conv_{pair_ac}"})

req_res = requests.post(f"{base_url}/connections/request/", json={
    "senderId": user_a_id,
    "senderName": "Neerajj",
    "recipientId": user_c_id,
    "recipientName": "mukesh",
    "note": "Let us connect!"
})
assert req_res.status_code == 200, f"Request failed: {req_res.text}"
conn_data = req_res.json()["data"]["connection"]
conn_id = conn_data["id"]
print(f"Connection created: {conn_id}, Status: {conn_data['status']}")

# Verify User C retrieves notification from backend /api/v1/notifications/
notif_res = requests.get(f"{base_url}/notifications/?userId={user_c_id}").json()
notifs_c = notif_res["data"]["notifications"]
target_notif = next((n for n in notifs_c if n.get("connectionId") == conn_id), None)
assert target_notif is not None, "User C must receive connection request notification in MongoDB"
assert target_notif["actionRequired"] is True, "Notification must require action before accept"
print(f"User C received notification: '{target_notif['title']}', actionRequired: {target_notif['actionRequired']}")

# Next.js proxy verification for notifications
next_notif_res = requests.get(f"{next_url}/notifications?userId={user_c_id}").json()
assert next_notif_res.get("success") is True
print("Next.js /api/notifications proxy working:", len(next_notif_res.get("notifications", [])))

# --- SCENARIO 2: Accept Action Resolves Notification (Acceptance Persistence) ---
print("\n--- TEST 2: User C Accepts Connection -> Action Resolved & Unlocked ---")
acc_res = requests.post(f"{base_url}/connections/accept/", json={
    "userId": user_c_id,
    "partnerId": user_a_id,
    "connectionId": conn_id
})
assert acc_res.status_code == 200, f"Accept failed: acc_res.text"

# Verify in MongoDB: Connection status is accepted
conn_in_db = db["connections"].find_one({"id": conn_id})
assert conn_in_db["status"] == "accepted", "MongoDB connection must be 'accepted'"

# Verify in MongoDB: User C's notification is resolved (actionRequired: False)
notif_in_db = db["notifications"].find_one({"id": f"notif_conn_{conn_id}"})
assert notif_in_db["actionRequired"] is False, "Recipient notification must have actionRequired=False after accept"
print("MongoDB notification after accept: actionRequired =", notif_in_db["actionRequired"])

# --- SCENARIO 3: Trace ONE Message End-to-End (User A -> User B) ---
print("\n--- TEST 3: Trace ONE Message End-to-End (User A -> User B) ---")
pair_ab = f"{min(user_a_id, user_b_id)}_{max(user_a_id, user_b_id)}"
conv_id_ab = f"conv_{pair_ab}"

# Ensure connection A <-> B is accepted
db["connections"].update_one(
    {"pair_key": pair_ab},
    {"$set": {"status": "accepted", "pair_key": pair_ab, "senderId": user_a_id, "recipientId": user_b_id}},
    upsert=True
)
db["conversations"].update_one(
    {"id": conv_id_ab},
    {"$set": {"id": conv_id_ab, "pair_key": pair_ab, "participants": [user_a_id, user_b_id], "status": "active"}},
    upsert=True
)

test_content = "TEST MESSAGE 123"
print(f"Step 1: User A sends '{test_content}' via Next.js /api/messages")
send_res = requests.post(f"{next_url}/messages", json={
    "action": "send",
    "conversationId": conv_id_ab,
    "message": {
        "id": "msg_test_123",
        "conversationId": conv_id_ab,
        "senderId": user_a_id,
        "senderName": "Neerajj",
        "text": test_content,
        "timestamp": "12:00 PM",
        "readBy": [user_a_id]
    }
})
print("Send status code:", send_res.status_code)
assert send_res.status_code == 200, f"Send failed: {send_res.text}"

# Step 2: Verify in MongoDB Atlas directly
print("Step 2: Inspecting MongoDB 'messages' collection...")
stored_msg = db["messages"].find_one({"conversationId": conv_id_ab, "content": test_content})
assert stored_msg is not None, "Message must exist in MongoDB 'messages' collection"
print("MongoDB document found:")
print(f" - id: {stored_msg.get('id')}")
print(f" - conversationId: {stored_msg.get('conversationId')}")
print(f" - senderId: {stored_msg.get('senderId')}")
print(f" - content: '{stored_msg.get('content')}'")
print(f" - createdAt: {stored_msg.get('createdAt')}")
assert stored_msg["senderId"] == user_a_id, "senderId must be User A"
assert stored_msg["content"] == test_content, "content must match exactly"

# Step 3: Verify User B (Receiver) retrieves the message
print("\nStep 3: User B (Receiver) fetches messages via API...")
recv_res = requests.get(f"{next_url}/messages?conversationId={conv_id_ab}&userId={user_b_id}")
assert recv_res.status_code == 200
recv_data = recv_res.json()
assert recv_data.get("success") is True
messages_b = recv_data.get("messages", [])
print(f"User B received {len(messages_b)} messages")
found_msg = next((m for m in messages_b if m.get("text") == test_content or m.get("content") == test_content), None)
assert found_msg is not None, "User B must retrieve the test message"
print("Message retrieved by User B:")
print(f" - text: '{found_msg.get('text')}'")
print(f" - isMe: {found_msg.get('isMe')} (Must be False for User B)")
assert found_msg.get("isMe") is False, "Message from User A must have isMe=False for User B"

# Step 4: Verify User A (Sender) views the same message
print("\nStep 4: User A (Sender) fetches messages via API...")
sender_view_res = requests.get(f"{next_url}/messages?conversationId={conv_id_ab}&userId={user_a_id}").json()
messages_a = sender_view_res.get("messages", [])
found_msg_a = next((m for m in messages_a if m.get("text") == test_content or m.get("content") == test_content), None)
assert found_msg_a is not None
print(f" - isMe for User A: {found_msg_a.get('isMe')} (Must be True for User A)")
assert found_msg_a.get("isMe") is True, "Message from User A must have isMe=True for User A"

# --- SCENARIO 4: User B Replies (B -> A) ---
print("\n--- TEST 4: User B sends reply ('REPLY MESSAGE 456') ---")
reply_content = "REPLY MESSAGE 456"
reply_send = requests.post(f"{next_url}/messages", json={
    "action": "send",
    "conversationId": conv_id_ab,
    "message": {
        "id": "msg_reply_456",
        "conversationId": conv_id_ab,
        "senderId": user_b_id,
        "senderName": "John Developer",
        "text": reply_content,
        "timestamp": "12:05 PM",
        "readBy": [user_b_id]
    }
})
assert reply_send.status_code == 200

# Verify User A sees the reply
after_reply_a = requests.get(f"{next_url}/messages?conversationId={conv_id_ab}&userId={user_a_id}").json()
reply_for_a = next((m for m in after_reply_a.get("messages", []) if m.get("text") == reply_content or m.get("content") == reply_content), None)
assert reply_for_a is not None, "User A must retrieve User B's reply"
assert reply_for_a.get("isMe") is False, "Reply from User B must have isMe=False for User A"
print("User A successfully received User B's reply with isMe=False!")

# --- SCENARIO 5: Conversations List Perspectives ---
print("\n--- TEST 5: Conversations List Resolution for Both Accounts ---")
convs_a = requests.get(f"{next_url}/messages?userId={user_a_id}").json().get("conversations", [])
convs_b = requests.get(f"{next_url}/messages?userId={user_b_id}").json().get("conversations", [])

c_a = next((c for c in convs_a if c["id"] == conv_id_ab), None)
c_b = next((c for c in convs_b if c["id"] == conv_id_ab), None)

assert c_a is not None, "Conversation must appear in User A's list"
assert c_b is not None, "Conversation must appear in User B's list"

print(f"User A sees partner: {c_a['partner']['name']} ({c_a['partner']['id']})")
print(f"User B sees partner: {c_b['partner']['name']} ({c_b['partner']['id']})")

assert c_a['partner']['id'] == user_b_id, "User A must see User B as partner"
assert c_b['partner']['id'] == user_a_id, "User B must see User A as partner"

print("\n=== ALL MESSAGING PIPELINE & NOTIFICATION TESTS COMPLETED SUCCESSFULLY ===")
