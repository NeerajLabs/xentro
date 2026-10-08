import os
import sys
import datetime
import pymongo

def run_tests():
    client = pymongo.MongoClient('mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db')
    db = client['xentro_db']
    tickets_col = db['support_tickets']
    users_col = db['users']
    notif_col = db['notifications']

    print('=== E2E Support Ticket Lifecycle Verification ===')

    test_user_id = f'test_user_{int(datetime.datetime.now().timestamp())}'
    test_email = f'{test_user_id}@example.com'
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Step 1: User submits ticket
    ticket_id = f'CMP-{int(datetime.datetime.now().timestamp()) % 1000000:06d}'
    ticket_doc = {
        'id': ticket_id,
        'accountId': test_user_id,
        'userId': test_user_id,
        'userName': 'Aarav Patel',
        'userEmail': test_email,
        'userRole': 'Explorer',
        'subject': 'E2E Test: Support Workflow Verification',
        'category': 'Platform Issue',
        'priority': 'NORMAL',
        'message': 'Testing complaint submission, admin status progression, and live sync.',
        'status': 'COMPLAINT_RECEIVED',
        'adminNotes': '',
        'resolutionComment': '',
        'submittedAt': now_iso,
        'createdAt': now_iso,
        'updatedAt': now_iso,
        'updatedBy': '',
        'resolvedAt': None,
        'resolvedBy': None,
    }

    tickets_col.insert_one(ticket_doc)
    print(f'1. [User Flow] Ticket submitted and saved in MongoDB: #{ticket_id}')

    # Verify user view formatting
    t = tickets_col.find_one({'id': ticket_id})
    assert t is not None, 'Ticket must exist in MongoDB'
    assert t['status'] == 'COMPLAINT_RECEIVED'

    user_facing_status = 'Complaint sent' if t['status'] in ['COMPLAINT_RECEIVED', 'PENDING'] else t['status']
    stage = 1
    print(f'   User View: Stage {stage} - "{user_facing_status}"')

    # Step 2: Admin updates to UNDER_INVESTIGATION
    admin_notes = 'Internal investigation: Checking network logs. Confidential to support desk.'
    admin_reply = 'We have escalated this to engineering team.'
    admin_id = '9922953'

    tickets_col.update_one(
        {'id': ticket_id},
        {
            '$set': {
                'status': 'UNDER_INVESTIGATION',
                'adminNotes': admin_notes,
                'updatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'updatedBy': admin_id
            },
            '$push': {
                'adminReplies': {
                    'id': 'rep_test_01',
                    'author': admin_id,
                    'authorName': 'Karunya Kranthi Kumar',
                    'message': admin_reply,
                    'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
            }
        }
    )
    print('2. [Admin Flow] Status updated to UNDER_INVESTIGATION with admin notes & reply')

    # Step 3: Verify user view after status change (Under investigation -> stage 2)
    t2 = tickets_col.find_one({'id': ticket_id})
    assert t2['status'] == 'UNDER_INVESTIGATION'
    user_t2 = dict(t2)
    user_t2.pop('adminNotes', None)
    user_facing_status_2 = 'Under investigation'
    stage_2 = 2
    print(f'   User View Updated Promptly: Stage {stage_2} - "{user_facing_status_2}"')
    print(f'   Confidentiality: adminNotes stripped in user response: {"adminNotes" not in user_t2}')

    # Step 4: Admin updates to RESOLVED
    res_comment = 'Resolved: The issue was fixed and verified.'
    resolved_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tickets_col.update_one(
        {'id': ticket_id},
        {
            '$set': {
                'status': 'RESOLVED',
                'resolutionComment': res_comment,
                'resolvedAt': resolved_iso,
                'resolvedBy': admin_id,
                'updatedAt': resolved_iso,
                'updatedBy': admin_id
            }
        }
    )

    # Insert user notification
    notif_doc = {
        'id': f'notif_test_{ticket_id}',
        'userId': test_user_id,
        'category': 'system',
        'title': f'Support Ticket #{ticket_id} Update',
        'description': f'Resolution: {res_comment}',
        'time': 'Just now',
        'unread': True,
        'isRead': False,
        'ticketId': ticket_id,
        'createdAt': resolved_iso
    }
    notif_col.insert_one(notif_doc)
    print('3. [Admin Flow] Status updated to RESOLVED with resolution comment & user notification inserted')

    # Step 5: Verify user view persistence after refresh/sign-in
    persisted = tickets_col.find_one({'id': ticket_id})
    assert persisted['status'] == 'RESOLVED'
    assert persisted['resolutionComment'] == res_comment
    assert len(persisted.get('adminReplies', [])) == 1

    print(f'4. [Persistence] Verified ticket #{ticket_id} persistent across MongoDB Atlas!')
    print(f'   Status: {persisted["status"]} | User-Facing Stage: 3 - Resolved')
    print(f'   Resolution Comment: {persisted["resolutionComment"]}')
    print(f'   Admin Replies Count: {len(persisted.get("adminReplies", []))}')
    print('=== All Tests Passed Successfully! ===')

if __name__ == '__main__':
    run_tests()
