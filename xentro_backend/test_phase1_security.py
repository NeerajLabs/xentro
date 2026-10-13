"""
XENTRO V1 — PHASE 1 AUTOMATED SECURITY REGRESSION TEST SUITE (Django / Python)
Covers: SEC-04 (Role Escalation), Financial Data Access, Backdoor Removal, and Member Invitations.
"""
import os
import sys
import time
import json
import jwt
from unittest.mock import MagicMock, patch

# Ensure xentro_backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Set minimal DJANGO_SETTINGS_MODULE
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory, force_authenticate
from common.jwt_auth import XentroJWTAuthentication
from apps.authentication.views import SwitchActiveRoleView
from apps.finance.views import StartupFinanceMetricsView, check_startup_finance_access
from apps.memberships.views import InviteMemberView

TEST_SECRET = os.getenv('JWT_SECRET', 'xentro-jwt-access-secret-2026-sha256-key')

def make_test_token(payload, secret=TEST_SECRET, expires_in=3600):
    p = payload.copy()
    now = int(time.time())
    p['iat'] = now
    p['exp'] = now + expires_in
    return jwt.encode(p, secret, algorithm='HS256')

results = []

def run_test(test_id, scenario, fn):
    try:
        fn()
        results.append((test_id, scenario, 'PASS', None))
        print(f"[PASS] {test_id}: {scenario}")
    except Exception as e:
        results.append((test_id, scenario, 'FAIL', str(e)))
        print(f"[FAIL] {test_id}: {scenario} -> {e}")

print('=================================================================')
print('XENTRO V1 — PHASE 1 SECURITY REGRESSION TEST RUNNER (DJANGO / PYTHON)')
print('=================================================================')

# --- TEST GROUP 1: JWT AUTHENTICATION & BACKDOOR REMOVAL ---
def test_jwt_missing():
    auth = XentroJWTAuthentication()
    req = APIRequestFactory().get('/api/test/')
    res = auth.authenticate(req)
    assert res is None, "Missing token should return None (unauthenticated)"

def test_jwt_backdoor_xa_sec():
    auth = XentroJWTAuthentication()
    req = APIRequestFactory().get('/api/test/', HTTP_AUTHORIZATION='Bearer xa_sec_superadmin')
    try:
        auth.authenticate(req)
        assert False, "Backdoor xa_sec_ token must raise AuthenticationFailed"
    except AuthenticationFailed:
        pass

def test_jwt_backdoor_admin_string():
    auth = XentroJWTAuthentication()
    req = APIRequestFactory().get('/api/test/', HTTP_AUTHORIZATION='Bearer admin')
    try:
        auth.authenticate(req)
        assert False, "Backdoor string 'admin' must raise AuthenticationFailed"
    except AuthenticationFailed:
        pass

def test_jwt_expired():
    auth = XentroJWTAuthentication()
    expired_token = make_test_token({'sub': 'test_u1', 'email': 'u1@example.com'}, expires_in=-10)
    req = APIRequestFactory().get('/api/test/', HTTP_AUTHORIZATION=f'Bearer {expired_token}')
    try:
        auth.authenticate(req)
        assert False, "Expired token must raise AuthenticationFailed"
    except AuthenticationFailed:
        pass

def test_jwt_tampered():
    auth = XentroJWTAuthentication()
    valid_token = make_test_token({'sub': 'test_u1', 'email': 'u1@example.com'})
    tampered_token = valid_token[:-4] + 'xxxx'
    req = APIRequestFactory().get('/api/test/', HTTP_AUTHORIZATION=f'Bearer {tampered_token}')
    try:
        auth.authenticate(req)
        assert False, "Tampered signature must raise AuthenticationFailed"
    except AuthenticationFailed:
        pass

run_test('DJ-AUTH-01', 'Missing token returns None (unauthenticated)', test_jwt_missing)
run_test('DJ-AUTH-02', 'Backdoor xa_sec_ token rejected with AuthenticationFailed', test_jwt_backdoor_xa_sec)
run_test('DJ-AUTH-03', 'Backdoor admin string rejected with AuthenticationFailed', test_jwt_backdoor_admin_string)
run_test('DJ-AUTH-04', 'Expired token rejected with AuthenticationFailed', test_jwt_expired)
run_test('DJ-AUTH-05', 'Tampered signature rejected with AuthenticationFailed', test_jwt_tampered)

# --- TEST GROUP 2: ROLE ESCALATION (SwitchActiveRoleView - SEC-04) ---
def test_role_arbitrary_entity_escalation():
    factory = APIRequestFactory()
    view = SwitchActiveRoleView.as_view()
    
    mock_user = MagicMock()
    mock_user.id = 'usr_100'
    mock_user.is_authenticated = True
    
    for forbidden_role in ['Founder', 'Managing Partner', 'Admin', 'SuperAdmin', 'Owner']:
        req = factory.post('/api/v1/auth/switch-role/', {'role': forbidden_role}, format='json')
        force_authenticate(req, user=mock_user)
        
        response = view(req)
        assert response.status_code == 403, f"Role {forbidden_role} should return 403, got {response.status_code}"
        assert "Unauthorized role" in response.data.get('message', '')

def test_role_unverified_mentor_conversion_blocked():
    factory = APIRequestFactory()
    view = SwitchActiveRoleView.as_view()
    
    mock_user = MagicMock()
    mock_user.id = 'usr_100'
    mock_user.is_authenticated = True
    
    with patch('apps.authentication.views.get_collection') as mock_col_func:
        mock_col = MagicMock()
        mock_col.find_one.return_value = {
            'id': 'usr_100',
            'accountType': 'Explorer',
            'activeRoles': ['Explorer'], # Has NOT converted to Mentor
        }
        mock_col_func.return_value = mock_col
        
        req = factory.post('/api/v1/auth/switch-role/', {'role': 'Mentor'}, format='json')
        force_authenticate(req, user=mock_user)
        
        response = view(req)
        assert response.status_code == 403
        assert "verified personal account upgrade workflow" in response.data.get('message', '')

def test_role_valid_switch_if_converted():
    factory = APIRequestFactory()
    view = SwitchActiveRoleView.as_view()
    
    mock_user = MagicMock()
    mock_user.id = 'usr_100'
    mock_user.is_authenticated = True
    
    with patch('apps.authentication.views.get_collection') as mock_col_func:
        mock_col = MagicMock()
        mock_col.find_one.return_value = {
            'id': 'usr_100',
            'email': 'usr100@example.com',
            'fullName': 'Alice Test',
            'accountType': 'Explorer',
            'activeRoles': ['Explorer', 'Mentor'], # Legitimately converted
        }
        mock_col_func.return_value = mock_col
        
        req = factory.post('/api/v1/auth/switch-role/', {'role': 'Mentor'}, format='json')
        force_authenticate(req, user=mock_user)
        
        response = view(req)
        assert response.status_code == 200
        assert response.data.get('data', {}).get('activeRole') == 'Mentor'

run_test('DJ-ROLE-01', 'Arbitrary entity roles (Founder, Admin, Owner) rejected (403)', test_role_arbitrary_entity_escalation)
run_test('DJ-ROLE-02', 'Unconverted user cannot switch to Mentor (403)', test_role_unverified_mentor_conversion_blocked)
run_test('DJ-ROLE-03', 'Legitimately converted user successfully switches to Mentor (200)', test_role_valid_switch_if_converted)

# --- TEST GROUP 3: FINANCIAL DATA ACCESS CONTROLS ---
def test_finance_unauthenticated():
    factory = APIRequestFactory()
    view = StartupFinanceMetricsView.as_view()
    
    req = factory.get('/api/v1/finance/startup/ST-001/')
    from common.jwt_auth import XentroAnonymousUser
    req.user = XentroAnonymousUser()
    
    response = view(req, startup_id='ST-001')
    assert response.status_code in [401, 403], f"Unauthenticated request must be denied, got {response.status_code}"

def test_finance_unrelated_user():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()
        
        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'founder_id',
                    'currentOwnerUserId': 'founder_id',
                }
                return mock_entities
            elif name == 'memberships':
                mock_memberships.find_one.return_value = None # Not a member
                return mock_memberships
            elif name == 'diligence_access_requests':
                mock_dd_reqs.find_one.return_value = None # No approved DD grant
                return mock_dd_reqs
            return MagicMock()
            
        mock_col_func.side_effect = col_side_effect
        
        allowed = check_startup_finance_access('unrelated_user_id', 'ST-001')
        assert allowed is False

def test_finance_viewer_member_blocked():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()
        
        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'founder_id',
                    'currentOwnerUserId': 'founder_id',
                }
                return mock_entities
            elif name == 'memberships':
                # Viewer role without finance permissions
                mock_memberships.find_one.return_value = {
                    'userId': 'viewer_user_id',
                    'entityId': 'ST-001',
                    'role': 'Viewer',
                    'status': 'ACTIVE',
                    'permissions': ['VIEW_PUBLIC_PROFILE'],
                }
                return mock_memberships
            elif name == 'diligence_access_requests':
                mock_dd_reqs.find_one.return_value = None
                return mock_dd_reqs
            return MagicMock()
            
        mock_col_func.side_effect = col_side_effect
        
        allowed = check_startup_finance_access('viewer_user_id', 'ST-001')
        assert allowed is False

def test_finance_founder_allowed():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'founder_id',
                    'currentOwnerUserId': 'founder_id',
                }
                return mock_entities
            return MagicMock()
            
        mock_col_func.side_effect = col_side_effect
        
        allowed = check_startup_finance_access('founder_id', 'ST-001')
        assert allowed is True

run_test('DJ-FIN-01', 'Unauthenticated request to finance metrics denied', test_finance_unauthenticated)
run_test('DJ-FIN-02', 'Unrelated authenticated user denied access to startup financials', test_finance_unrelated_user)
run_test('DJ-FIN-03', 'Viewer member denied access to confidential financials', test_finance_viewer_member_blocked)
run_test('DJ-FIN-04', 'Entity Head granted authorized access to financials', test_finance_founder_allowed)

# --- TEST GROUP 4: MEMBER INVITATIONS (InviteMemberView) ---
def test_invite_owner_role_escalation_blocked():
    factory = APIRequestFactory()
    view = InviteMemberView.as_view()
    
    mock_user = MagicMock()
    mock_user.id = 'usr_admin'
    mock_user.is_authenticated = True
    
    with patch('apps.memberships.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        
        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_admin',
                    'currentOwnerUserId': 'usr_admin',
                }
                return mock_entities
            elif name == 'memberships':
                return mock_memberships
            return MagicMock()
            
        mock_col_func.side_effect = col_side_effect
        
        req = factory.post('/api/v1/memberships/invite/', {
            'entityId': 'ST-001',
            'email': 'newguy@example.com',
            'role': 'Owner' # Attempting to invite Owner
        }, format='json')
        force_authenticate(req, user=mock_user)
        
        response = view(req)
        assert response.status_code == 403, f"Owner role invitation should return 403, got {response.status_code}"
        assert "Governing Head and Owner roles cannot be assigned" in response.data.get('message', '')

def test_invite_unrelated_user_blocked():
    factory = APIRequestFactory()
    view = InviteMemberView.as_view()
    
    mock_user = MagicMock()
    mock_user.id = 'unrelated_usr'
    mock_user.is_authenticated = True
    
    with patch('apps.memberships.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        
        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'real_owner',
                    'currentOwnerUserId': 'real_owner',
                }
                return mock_entities
            elif name == 'memberships':
                mock_memberships.find_one.return_value = None # No membership
                return mock_memberships
            return MagicMock()
            
        mock_col_func.side_effect = col_side_effect
        
        req = factory.post('/api/v1/memberships/invite/', {
            'entityId': 'ST-001',
            'email': 'newguy@example.com',
            'role': 'Member'
        }, format='json')
        force_authenticate(req, user=mock_user)
        
        response = view(req)
        assert response.status_code == 403
        assert "Access denied" in response.data.get('message', '')

run_test('DJ-INV-01', 'Inviting Owner/Head role rejected (400)', test_invite_owner_role_escalation_blocked)
run_test('DJ-INV-02', 'Unrelated user cannot issue invitations for entity (403)', test_invite_unrelated_user_blocked)

print('=================================================================')
passed_count = len([r for r in results if r[2] == 'PASS'])
failed_count = len([r for r in results if r[2] == 'FAIL'])
print(f"SUMMARY: {passed_count} PASSED, {failed_count} FAILED OUT OF {len(results)} TESTS")
print('=================================================================')

if failed_count > 0:
    sys.exit(1)
else:
    sys.exit(0)
