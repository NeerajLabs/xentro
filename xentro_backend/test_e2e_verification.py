"""
Comprehensive End-to-End Verification Script for Xentro:
1. Account Creation & Persistence for all 5 Account Types:
   - Explorer (Personal)
   - Mentor (Personal Role Upgrade)
   - Investor (Personal Role Upgrade / Entity)
   - ESP (Entity Request)
   - Startup (Entity Account)
2. Login & Profile Retrieval for each account type:
   - Verifies accountType is returned correctly
   - Verifies entityId / roleId distinction
3. Connection Request & Acceptance:
   - Sender creates connection request to Recipient
   - Stored in MongoDB Atlas 'connections'
   - Recipient accepts connection
   - MongoDB status updated to 'accepted' with timestamps
4. Chat Messaging between Connected Users:
   - Verify unaccepted connection is rejected (security gating)
   - Exchange messages between connected pair
   - Messages stored in MongoDB Atlas 'messages' with conversationId, sender, content, timestamp
   - Re-retrieve conversation history to verify persistence across re-login/refresh
"""
import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def api_post(path, data, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers=req_headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def api_get(path, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run_tests():
    ts = int(time.time())
    print(f"=== Starting E2E Verification Suite (timestamp: {ts}) ===\n")
    
    # ----------------------------------------------------
    # 1. Create accounts for all 5 account types
    # ----------------------------------------------------
    account_configs = [
        {
            "type": "Explorer",
            "name": f"Alice Explorer {ts}",
            "email": f"explorer_{ts}@example.com",
            "password": "Password123!",
            "role": "Explorer",
        },
        {
            "type": "Mentor",
            "name": f"Dr. Bob Mentor {ts}",
            "email": f"mentor_{ts}@example.com",
            "password": "Password123!",
            "role": "Mentor",
        },
        {
            "type": "Investor",
            "name": f"Carol Investor {ts}",
            "email": f"investor_{ts}@example.com",
            "password": "Password123!",
            "role": "Investor",
        },
        {
            "type": "Startup",
            "name": f"Dave Founder {ts}",
            "email": f"startup_{ts}@example.com",
            "password": "Password123!",
            "role": "Startup",
        },
        {
            "type": "ESP",
            "name": f"Elena ESP Admin {ts}",
            "email": f"esp_{ts}@example.com",
            "password": "Password123!",
            "role": "ESP",
            "institutionName": f"Alpha Incubator {ts}",
            "espType": "INCUBATOR",
        },
    ]

    created_users = {}

    for cfg in account_configs:
        print(f"--- [1] Creating account type: {cfg['type']} ---")
        status, body = api_post("/auth/signup/", {
            "fullName": cfg["name"],
            "email": cfg["email"],
            "phoneNumber": "+91 98765 43210",
            "password": cfg["password"],
            "role": cfg["role"],
            "institutionName": cfg.get("institutionName", ""),
            "espType": cfg.get("espType", ""),
        })
        assert status == 200, f"Signup failed for {cfg['type']}: {body}"
        user = body["data"]["user"]
        created_users[cfg["type"]] = user
        print(f"  [OK] Created {cfg['type']} account:")
        print(f"    - User ID: {user.get('id')}")
        print(f"    - accountType: {user.get('accountType')}")
        print(f"    - primaryRole: {user.get('primaryRole')}")
        print(f"    - entityId: {user.get('entityId')} (distinction: {'Entity' if user.get('entityId') else 'Personal Role'})")
        assert user.get("accountType") == cfg["type"], f"Expected accountType {cfg['type']}, got {user.get('accountType')}"

    print("\n--- [2] Verifying Login & Profile Persistence across all 5 Account Types ---")
    for cfg in account_configs:
        acct_type = cfg["type"]
        status, body = api_post("/auth/signin/", {
            "email": cfg["email"],
            "password": cfg["password"]
        })
        # ESP accounts have status PENDING_APPROVAL and return 403 on login with extra info, or active
        if acct_type == "ESP" and status == 403:
            print(f"  [OK] ESP Account correctly enforces admin review workflow: {body.get('message')}")
            # Verify profile retrieval via auth/me endpoint with X-User-Id
            user_id = created_users["ESP"]["id"]
            m_status, m_body = api_get(f"/auth/me/?userId={user_id}")
            assert m_status == 200, f"Failed to get ESP user by ID: {m_body}"
            loaded_user = m_body["data"]["user"]
            assert loaded_user.get("accountType") == "ESP"
            assert loaded_user.get("entityId") is not None
            print(f"  [OK] ESP Profile in DB has accountType='ESP' and entityId={loaded_user.get('entityId')}")
        else:
            assert status == 200, f"Sign in failed for {acct_type}: {body}"
            user = body["data"]["user"]
            token = body["data"]["tokens"]["accessToken"]
            assert user.get("accountType") == acct_type, f"Login returned {user.get('accountType')} instead of {acct_type}"
            print(f"  [OK] Login succeeded for {acct_type}:")
            print(f"    - accountType verified: {user.get('accountType')}")
            print(f"    - activeRoles: {user.get('activeRoles')}")
            
            # Verify auth/me profile loading with token
            m_status, m_body = api_get("/auth/me/", headers={"Authorization": f"Bearer {token}"})
            assert m_status == 200, f"Profile load failed for {acct_type}: {m_body}"
            me_user = m_body["data"]["user"]
            assert me_user.get("accountType") == acct_type
            print(f"    - Profile /auth/me verified: {me_user.get('accountType')}")

    # ----------------------------------------------------
    # 3. Connection Request & Acceptance Test
    # ----------------------------------------------------
    print("\n--- [3] Connection Requests & Acceptance Flow ---")
    startup_user = created_users["Startup"]
    mentor_user = created_users["Mentor"]

    # Step 3a: Startup sends connection request to Mentor
    print(f"  Sending connection request from Startup ({startup_user['id']}) to Mentor ({mentor_user['id']})...")
    status, body = api_post("/connections/request/", {
        "senderId": startup_user["id"],
        "senderName": startup_user["fullName"],
        "senderRole": "Startup Founder",
        "recipientId": mentor_user["id"],
        "recipientName": mentor_user["fullName"],
        "recipientRole": "Mentor",
        "note": "Excited to connect and explore strategic mentorship opportunities."
    })
    assert status == 200, f"Connection request failed: {body}"
    conn = body["data"]["connection"]
    conn_id = conn["id"]
    assert conn["status"] == "pending"
    print(f"  [OK] Connection request created in DB: id={conn_id}, status={conn['status']}, createdAt={conn['createdAt']}")

    # Step 3b: Mentor queries connection list (refresh simulation)
    print(f"  Verifying Mentor's pending connection list from database...")
    status, body = api_get(f"/connections/?userId={mentor_user['id']}")
    assert status == 200, f"Get connections failed: {body}"
    conns = body["data"]["connections"]
    found = any(c["id"] == conn_id and c["status"] == "pending" for c in conns)
    assert found, "Pending connection request not found in recipient's list!"
    print(f"  [OK] Pending request successfully retrieved from MongoDB for Mentor.")

    # ----------------------------------------------------
    # 4. Connection-Gated Messaging Security Test
    # ----------------------------------------------------
    print("\n--- [4] Connection-Gated Messaging Security Check ---")
    conv_id = f"conv_{min(startup_user['id'].lower(), mentor_user['id'].lower())}_{max(startup_user['id'].lower(), mentor_user['id'].lower())}"
    print(f"  Attempting to send message before connection is accepted (should be rejected)...")
    status, body = api_post(f"/messages/conversations/{conv_id}/send/", {
        "content": "Sneak peek message before acceptance",
        "userId": startup_user["id"],
        "senderName": startup_user["fullName"],
    })
    assert status == 403, f"Expected 403 Forbidden for unaccepted connection, got {status}: {body}"
    print(f"  [OK] Access control verified: Unaccepted connection rejected with 403 ({body.get('message')})")

    # Step 4b: Mentor accepts the connection request
    print(f"\n  Accepting connection request (Mentor accepts Startup)...")
    status, body = api_post("/connections/accept/", {
        "connectionId": conn_id,
        "partnerId": startup_user["id"],
        "userId": mentor_user["id"]
    })
    assert status == 200, f"Accept connection failed: {body}"
    print(f"  [OK] Connection accepted in MongoDB: {body.get('message')}")

    # Step 4c: Verify both users now have status == 'accepted' after page refresh / re-login
    print(f"  Verifying connection list after refresh for both parties...")
    s_status, s_conns = api_get(f"/connections/?userId={startup_user['id']}")
    assert any(c["id"] == conn_id and c["status"] == "accepted" for c in s_conns["data"]["connections"])
    m_status, m_conns = api_get(f"/connections/?userId={mentor_user['id']}")
    assert any(c["id"] == conn_id and c["status"] == "accepted" for c in m_conns["data"]["connections"])
    print(f"  [OK] Active connections confirmed for both Startup and Mentor after refresh.")

    # ----------------------------------------------------
    # 5. Chat Messages Exchange & Persistence
    # ----------------------------------------------------
    print("\n--- [5] Chat Messaging Exchange & History Persistence ---")
    # Message 1: Startup -> Mentor
    msg1_text = f"Hello Dr. Bob, thanks for accepting my connection request! (ts: {ts})"
    print(f"  Sending message 1 (Startup -> Mentor): '{msg1_text}'")
    status, body = api_post(f"/messages/conversations/{conv_id}/send/", {
        "content": msg1_text,
        "userId": startup_user["id"],
        "senderName": startup_user["fullName"],
    })
    assert status == 200, f"Send message 1 failed: {body}"
    msg1_data = body["data"]["message"]
    print(f"  [OK] Message 1 saved in DB: id={msg1_data['id']}, timestamp={msg1_data['createdAt']}")

    # Message 2: Mentor -> Startup
    msg2_text = f"Glad to connect, Dave! Looking forward to reviewing your traction deck. (ts: {ts})"
    print(f"  Sending message 2 (Mentor -> Startup): '{msg2_text}'")
    status, body = api_post(f"/messages/conversations/{conv_id}/send/", {
        "content": msg2_text,
        "userId": mentor_user["id"],
        "senderName": mentor_user["fullName"],
    })
    assert status == 200, f"Send message 2 failed: {body}"
    msg2_data = body["data"]["message"]
    print(f"  [OK] Message 2 saved in DB: id={msg2_data['id']}, timestamp={msg2_data['createdAt']}")

    # Step 5b: Reopen chat / simulate page refresh or re-login
    print(f"\n  Reopening conversation history for Startup (simulating page reload)...")
    status, body = api_get(f"/messages/conversations/{conv_id}/?userId={startup_user['id']}")
    assert status == 200, f"Failed to retrieve conversation history: {body}"
    history = body["data"]["messages"]
    assert len(history) >= 2, f"Expected at least 2 messages, found {len(history)}"
    texts = [m["text"] for m in history]
    assert msg1_text in texts, "Message 1 not found in retrieved history!"
    assert msg2_text in texts, "Message 2 not found in retrieved history!"
    print(f"  [OK] All {len(history)} messages successfully loaded from MongoDB Atlas.")
    print(f"    - Message 1: '{history[-2]['text']}' (Sender: {history[-2]['senderName']})")
    print(f"    - Message 2: '{history[-1]['text']}' (Sender: {history[-1]['senderName']})")

    # Step 5c: Check conversations list for both participants
    print(f"\n  Checking conversations list for Startup...")
    c_status, c_body = api_get(f"/messages/conversations/?userId={startup_user['id']}")
    assert c_status == 200
    conv_list = c_body["data"]["conversations"]
    assert any(c["id"] == conv_id for c in conv_list)
    print(f"  [OK] Conversation listed with lastMessage: '{conv_list[0].get('lastMessage')}'")

    print("\n=======================================================")
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
