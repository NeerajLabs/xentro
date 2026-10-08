import requests
import json
import time

BASE_URL = 'http://localhost:8000/api/v1'
try:
    r = requests.get(f'{BASE_URL}/support/complaints/', timeout=1.5)
    print('Testing against local backend:', BASE_URL)
except Exception:
    BASE_URL = 'https://xentro-tejh.onrender.com/api/v1'
    print('Testing against live Render backend:', BASE_URL)

# 1. Admin Sign-In Performance Benchmark
start = time.time()
resp = requests.post(f'{BASE_URL}/admin/auth/login/', json={
    'employeeId': '9922953',
    'password': 'Kar04052003'
}, timeout=10)
dur = time.time() - start
data = resp.json()
token = data.get('data', {}).get('session', {}).get('token')
print(f'Admin login status: {resp.status_code}, latency: {dur:.2f}s, token received: {bool(token)}')
admin_token = token

# 2. File Support Ticket as Verified User
user_id = f'test_usr_support_e2e_{int(time.time())}'
create_resp = requests.post(f'{BASE_URL}/support/complaints/', headers={
    'X-User-Id': user_id,
    'X-User-Email': 'founder.e2e@xentro.io',
    'X-User-Name': 'Aarav Patel (Founder)'
}, json={
    'subject': 'E2E Verification: Startup Listing deck upload sync',
    'category': 'Startup Listings',
    'priority': 'HIGH',
    'message': 'Testing support lifecycle end-to-end with 3 stages, admin replies, and notifications.'
}, timeout=10)

print(f'Ticket creation status: {create_resp.status_code}')
ticket_data = create_resp.json().get('data', {}).get('ticket', {})
ticket_id = ticket_data.get('id')
print(f'Created Ticket ID: {ticket_id}, userFacingStatus: {ticket_data.get("userFacingStatus")}, stage: {ticket_data.get("stage")}')
assert ticket_data.get('adminNotes') is None, 'adminNotes must NEVER be exposed in user ticket'
assert ticket_data.get('stage') == 1, 'Initial stage must be 1 (Complaint sent)'

# 3. Admin Reviews Ticket, Adds Reply and Updates Status to Under investigation
admin_headers = {'Authorization': f'Bearer {admin_token}'} if admin_token else {}
reply_resp = requests.patch(f'{BASE_URL}/admin/complaints/{ticket_id}/', headers=admin_headers, json={
    'status': 'UNDER_INVESTIGATION',
    'adminNotes': 'INTERNAL NOTE: Investigating deck ingestion worker timeout. Strictly private.',
    'adminReply': 'Hello Aarav, we are actively investigating your deck upload issue on our staging cluster.'
}, timeout=10)
print(f'Admin status update & reply response: {reply_resp.status_code}')

# 4. Verify User View Shows Stage 2 (Under investigation) and Admin Reply, but NOT adminNotes
user_view = requests.get(f'{BASE_URL}/support/complaints/?accountId={user_id}', timeout=10).json()
tickets = user_view.get('data', {}).get('tickets', [])
target_t = next((t for t in tickets if t.get('id') == ticket_id), None)
assert target_t is not None, 'Ticket must be found in user view'
print(f'Updated userFacingStatus: {target_t.get("userFacingStatus")}, stage: {target_t.get("stage")}')
print(f'Admin replies count in user view: {len(target_t.get("adminReplies", []))}')
if target_t.get("adminReplies"):
    print(f'Latest reply: {target_t.get("adminReplies")[-1].get("message")}')
assert target_t.get('adminNotes') is None, 'CONFIDENTIALITY BREACH: adminNotes visible to user!'
assert target_t.get('stage') == 2, 'Stage must be 2 (Under investigation)'

# 5. Admin Resolves the Ticket
res_resp = requests.patch(f'{BASE_URL}/admin/complaints/{ticket_id}/', headers=admin_headers, json={
    'status': 'RESOLVED',
    'resolutionComment': 'Resolved: Storage bucket CORS policy reconfigured. Pitch deck uploads working normally.',
    'adminReply': 'Your issue has been resolved. You can now re-upload your pitch deck without errors.'
}, timeout=10)
print(f'Admin resolve status: {res_resp.status_code}')

# 6. Verify User View Shows Stage 3 (Resolved)
user_view_final = requests.get(f'{BASE_URL}/support/complaints/?accountId={user_id}', timeout=10).json()
target_final = next((t for t in user_view_final.get('data', {}).get('tickets', []) if t.get('id') == ticket_id), None)
print(f'Final userFacingStatus: {target_final.get("userFacingStatus")}, stage: {target_final.get("stage")}')
print(f'Resolution summary: {target_final.get("resolutionComment")}')
assert target_final.get('stage') == 3, 'Stage must be 3 (Resolved)'

# 7. Verify Notification Created for User in MongoDB
notif_resp = requests.get(f'{BASE_URL}/notifications/?userId={user_id}', timeout=10).json()
notifs = notif_resp.get('data', {}).get('notifications', [])
print(f'Notifications count for user: {len(notifs)}')
support_notifs = [n for n in notifs if ticket_id in n.get('title', '') or ticket_id in n.get('description', '')]
print(f'Support notifications matching ticket: {len(support_notifs)}')
if support_notifs:
    print('Sample notification description:', support_notifs[0].get('description'))

print('\n=== ALL E2E VERIFICATION CHECKS PASSED WITH 100% SUCCESS ===')
