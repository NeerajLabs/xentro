"""
XENTRO 3-Account End-to-End Connection and Messaging Lifecycle Test
Tests:
1. User A -> User B: Connection Request stored in MongoDB
2. Status resolution: User A sees 'pending', User B sees 'received'
3. Messaging Gating: Sending message is BLOCKED with 403 before acceptance
4. User B accepts: MongoDB 'connections' updated to 'accepted'
5. Synchronized state: Both User A and User B reflect 'connected'
6. Messaging Unlocked: User A and User B exchange messages, persisted in MongoDB
7. Conversation Participant: User A sees User B, User B sees User A
8. Persistence: Survives reload, database is the single source of truth
"""
import requests
import json
from integrations.mongodb import get_db

db = get_db()
print("=== STARTING 3-ACCOUNT E2E VERIFICATION TEST ===")

user_a_id = "XU-834524"  # Neerajj
user_b_id = "XU-401341"  # John Developer
user_c_id = "XU-926197"  # Kranthi Kumar

print(f"User A: {user_a_id}, User B: {user_b_id}, User C: {user_c_id}")

base_url = "http://127.0.0.1:8000/api/v1"

pair_key_ac = f"{min(user_a_id, user_c_id)}_{max(user_a_id, user_c_id)}"

# Clean previous test connection between A and C if any
db["connections"].delete_many({"pair_key": pair_key_ac})
db["conversations"].delete_many({"id": f"conv_{pair_key_ac}"})
db["messages"].delete_many({"conversationId": f"conv_{pair_key_ac}"})
db["notifications"].delete_many({"userId": user_c_id, "actionType": "connection_request"})

# TEST 1: User A sends connection request to User C
print("\n--- TEST 1: Sending Connection Request (A -> C) ---")
res = requests.post(f"{base_url}/connections/request/", json={
    "senderId": user_a_id,
    "senderName": "Neerajj",
    "recipientId": user_c_id,
    "recipientName": "Kranthi Kumar",
    "note": "Hi Kranthi, let us collaborate on Xentro!"
})
print("Request response status:", res.status_code)
assert res.status_code == 200, f"Request failed: {res.text}"

# Verify in MongoDB Atlas
conn_doc = db["connections"].find_one({"pair_key": pair_key_ac})
print("MongoDB Connection doc:", conn_doc["id"], "Status:", conn_doc["status"])
assert conn_doc["status"] == "pending", "Document status must be 'pending' in MongoDB"

notif_doc = db["notifications"].find_one({"userId": user_c_id, "actionType": "connection_request"})
print("MongoDB Recipient Notification:", notif_doc["title"] if notif_doc else "None")
assert notif_doc is not None, "Notification must be stored in MongoDB"

# TEST 2: Check status from both perspectives
print("\n--- TEST 2: Connection Status Check ---")
status_a = requests.get(f"{base_url}/connections/status/?userId={user_a_id}&partnerId={user_c_id}").json()
status_c = requests.get(f"{base_url}/connections/status/?userId={user_c_id}&partnerId={user_a_id}").json()
print("Status seen by User A:", status_a["data"]["status"])
print("Status seen by User C:", status_c["data"]["status"])
assert status_a["data"]["status"] == "pending", "User A must see 'pending'"
assert status_c["data"]["status"] == "received", "User C must see 'received'"

# TEST 3: Verify Messaging Gating (Cannot message before accepted)
print("\n--- TEST 3: Messaging Gating Verification ---")
msg_gate_res = requests.post(f"{base_url}/messages/conversations/", json={
    "userId": user_a_id,
    "partnerId": user_c_id,
    "initialMessage": "Can we chat?"
})
print("Messaging while pending status code:", msg_gate_res.status_code)
assert msg_gate_res.status_code == 403, "Messaging must be blocked when status is pending"

# TEST 4: User C accepts the connection request
print("\n--- TEST 4: Accept Connection Request (User C accepts) ---")
accept_res = requests.post(f"{base_url}/connections/accept/", json={
    "userId": user_c_id,
    "partnerId": user_a_id,
    "connectionId": conn_doc["id"]
})
print("Accept response status:", accept_res.status_code)
assert accept_res.status_code == 200, f"Accept failed: {accept_res.text}"

# Verify MongoDB Atlas updated
conn_updated = db["connections"].find_one({"id": conn_doc["id"]})
print("MongoDB updated status:", conn_updated["status"])
assert conn_updated["status"] == "accepted", "MongoDB status must be 'accepted'"

# Verify both users see Connected
status_a_after = requests.get(f"{base_url}/connections/status/?userId={user_a_id}&partnerId={user_c_id}").json()
status_c_after = requests.get(f"{base_url}/connections/status/?userId={user_c_id}&partnerId={user_a_id}").json()
print("Status seen by User A after accept:", status_a_after["data"]["status"])
print("Status seen by User C after accept:", status_c_after["data"]["status"])
assert status_a_after["data"]["status"] == "connected", "User A must see 'connected'"
assert status_c_after["data"]["status"] == "connected", "User C must see 'connected'"

# TEST 5: Messaging is now unlocked
print("\n--- TEST 5: Messaging & Conversation Verification ---")
conv_res = requests.post(f"{base_url}/messages/conversations/", json={
    "userId": user_a_id,
    "partnerId": user_c_id,
    "senderName": "Neerajj",
    "initialMessage": "Hello Kranthi, thanks for accepting!"
})
print("Conversation open status code:", conv_res.status_code)
assert conv_res.status_code == 200
conv_id = conv_res.json()["data"]["conversationId"]

# Send a reply from User C to User A
send_res = requests.post(f"{base_url}/messages/conversations/{conv_id}/send/", json={
    "userId": user_c_id,
    "senderName": "Kranthi Kumar",
    "content": "Great to connect with you Neeraj! Excited for synergy."
})
print("Send reply status code:", send_res.status_code)
assert send_res.status_code == 200

# Verify messages in MongoDB Atlas
messages = list(db["messages"].find({"conversationId": conv_id}, sort=[("createdAt", 1)]))
print(f"Persisted messages in MongoDB ({len(messages)}):")
for m in messages:
    sender = m.get("senderName", "Unknown")
    content = m.get("content", "")
    print(f" - [{sender}] {content}")
assert len(messages) == 2, "Both messages must be in MongoDB messages collection"

# Verify Participant Resolution (User A sees User C, User C sees User A)
convs_a = requests.get(f"{base_url}/messages/conversations/?userId={user_a_id}").json()["data"]["conversations"]
convs_c = requests.get(f"{base_url}/messages/conversations/?userId={user_c_id}").json()["data"]["conversations"]

target_conv_a = next((c for c in convs_a if c["id"] == conv_id), None)
target_conv_c = next((c for c in convs_c if c["id"] == conv_id), None)

print("User A sees partner in conversation:", target_conv_a["partner"]["name"])
print("User C sees partner in conversation:", target_conv_c["partner"]["name"])
assert target_conv_a["partner"]["id"] == user_c_id, "User A must see User C as partner"
assert target_conv_c["partner"]["id"] == user_a_id, "User C must see User A as partner"

# TEST 6: Metrics & Connections List Consistency
print("\n--- TEST 6: Dashboard Metrics & Connections Section ---")
conn_list_a = requests.get(f"{base_url}/connections/?userId={user_a_id}").json()["data"]
conn_list_c = requests.get(f"{base_url}/connections/?userId={user_c_id}").json()["data"]
print("User A active connections:", conn_list_a["metrics"]["activeConnections"])
print("User C active connections:", conn_list_c["metrics"]["activeConnections"])
print("Total active users from MongoDB:", conn_list_a["metrics"]["activeUsers"])
assert conn_list_a["metrics"]["activeConnections"] >= 1
assert conn_list_c["metrics"]["activeConnections"] >= 1

# TEST 7: Next.js API Routes Proxy Verification
print("\n--- TEST 7: Next.js Frontend API Routes Proxy Verification ---")
next_base = "http://localhost:3000/api"
next_conn_res = requests.get(f"{next_base}/connections?userId={user_a_id}").json()
print("Next.js /api/connections status:", next_conn_res.get("success"))
print("Connections returned via Next.js:", len(next_conn_res.get("connections", [])))
assert next_conn_res.get("success") is True
assert len(next_conn_res.get("connections", [])) >= 1

print("\n=== ALL E2E LIFECYCLE TESTS PASSED PERFECTLY! ===")
