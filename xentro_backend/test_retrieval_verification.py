import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from apps.accounts.views import UserSupportComplaintView

def test_retrieval():
    factory = APIRequestFactory()
    view = UserSupportComplaintView.as_view()

    print('=== Verification 1: Retrieval for User with Existing Tickets ===')
    r1 = view(factory.get('/api/v1/support/complaints/?accountId=XU-911572'))
    assert r1.status_code == 200, f'Expected 200, got {r1.status_code}'
    data1 = r1.data.get('data', {})
    tickets1 = data1.get('tickets', [])
    count1 = data1.get('count', 0)
    assert len(tickets1) == count1, 'Count must match ticket list length'
    assert len(tickets1) >= 8, f'Expected at least 8 tickets, got {len(tickets1)}'
    print(f'Pass: Returned {len(tickets1)} tickets, count={count1}')

    stages_seen = set()
    for t in tickets1:
        stages_seen.add(t['stage'])
        assert 'adminNotes' not in t, f'Security violation: adminNotes leaked in ticket'
        assert t['userFacingStatus'] in ['Complaint sent', 'Under investigation', 'Resolved']
        assert 'id' in t
        assert 'createdAt' in t
        assert 'subject' in t
    print(f'Pass: Confidentiality verified. Stages present: {stages_seen}')

    print('\n=== Verification 2: Retrieval for User with Zero Tickets ===')
    r2 = view(factory.get('/api/v1/support/complaints/?accountId=usr_zero_tickets_999'))
    assert r2.status_code == 200, f'Expected 200, got {r2.status_code}'
    data2 = r2.data.get('data', {})
    tickets2 = data2.get('tickets', [])
    count2 = data2.get('count', 0)
    assert len(tickets2) == 0, f'Expected 0 tickets, got {len(tickets2)}'
    assert count2 == 0, f'Expected count 0, got {count2}'
    print(f'Pass: User with zero tickets returns count={count2}, tickets=[]')

    print('\n=== Verification 3: Cross-Format Identifier Matching ===')
    r3 = view(factory.get('/api/v1/support/complaints/?email=tanuja9502190765@gmail.com'))
    assert r3.status_code == 200
    assert len(r3.data['data']['tickets']) == count1
    print(f'Pass: Email query successfully returned all {len(r3.data["data"]["tickets"])} tickets')

    print('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===')

if __name__ == '__main__':
    test_retrieval()
