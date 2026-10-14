"""
XENTRO V1 — PHASE 1.1 SECURITY VALIDATION & ENVIRONMENT ISOLATION TEST SUITE (Django / Python)
Tests:
1. Database Safety Guard & Isolation (Rejects xentro_db, rejects production targets, validates test namespaces)
2. JWT Cryptographic Verification & Backdoor Eradication (X-Admin-Employee-Id header bypass removed, refresh tokens rejected)
3. Startup Admin Financial Access & Capability Delegation (Founder allowed, Finance allowed, Admin without capability denied, Admin with MANAGE_FINANCE allowed, Viewer denied)
4. Diligence Grant Expiration & Revocation Checks
5. Membership Normalization & Invitation Status Checks
"""
import os
import sys
import time
import datetime
from unittest.mock import MagicMock, patch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['APP_ENV'] = 'test'

import django
django.setup()

import jwt
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory
from common.jwt_auth import XentroJWTAuthentication, JWT_SECRET, JWT_ALGORITHM
from common.db_safety_guard import (
    DatabaseIsolationError,
    assert_safe_for_test_mutation,
    resolve_and_validate_database_config,
    redact_mongo_uri,
)
from apps.finance.views import check_startup_finance_access

results = []

def run_test(test_id, scenario, fn):
    try:
        fn()
        results.append((test_id, scenario, 'PASS', None))
        print(f"[PASS] {test_id}: {scenario}")
    except Exception as e:
        results.append((test_id, scenario, 'FAIL', str(e)))
        print(f"[FAIL] {test_id}: {scenario} -> {e}")

print('========================================================================')
print('XENTRO V1 — PHASE 1.1 SECURITY VALIDATION TEST RUNNER (DJANGO / PYTHON)')
print('========================================================================')

# --- GROUP 1: DATABASE ENVIRONMENT ISOLATION & SAFETY GUARD ---
def test_db_guard_rejects_primary_db():
    try:
        assert_safe_for_test_mutation("xentro_db", "Integration Test Fixture")
        raise AssertionError("Expected DatabaseIsolationError for xentro_db")
    except DatabaseIsolationError as e:
        assert "strictly forbidden on protected database 'xentro_db'" in str(e)

def test_db_guard_rejects_production_alias():
    try:
        assert_safe_for_test_mutation("xentro_production", "Integration Test Fixture")
        raise AssertionError("Expected DatabaseIsolationError for xentro_production")
    except DatabaseIsolationError as e:
        assert "strictly forbidden on protected database 'xentro_production'" in str(e)

def test_db_guard_rejects_unapproved_name():
    try:
        assert_safe_for_test_mutation("random_cluster_db", "Integration Test Fixture")
        raise AssertionError("Expected DatabaseIsolationError for random_cluster_db")
    except DatabaseIsolationError as e:
        assert "not an approved test namespace" in str(e)

def test_db_guard_accepts_test_db():
    assert_safe_for_test_mutation("xentro_test", "Test Operation")
    assert_safe_for_test_mutation("test_isolated", "Test Operation")

def test_db_guard_redacts_credentials():
    raw_uri = "mongodb+srv://test_user:SuperSecretPassword123@cluster0.abc.mongodb.net/xentro_db"
    redacted = redact_mongo_uri(raw_uri)
    assert "SuperSecretPassword123" not in redacted
    assert "[REDACTED_SECRET]" in redacted

run_test('DJ-ISOL-01', 'Safety guard rejects primary production database "xentro_db"', test_db_guard_rejects_primary_db)
run_test('DJ-ISOL-02', 'Safety guard rejects production alias "xentro_production"', test_db_guard_rejects_production_alias)
run_test('DJ-ISOL-03', 'Safety guard rejects unapproved target database', test_db_guard_rejects_unapproved_name)
run_test('DJ-ISOL-04', 'Safety guard accepts isolated test namespace "xentro_test"', test_db_guard_accepts_test_db)
run_test('DJ-ISOL-05', 'Safety guard redacts credentials in connection URI error messages', test_db_guard_redacts_credentials)

# --- GROUP 2: JWT AUTHENTICATION & BACKDOOR ERADICATION ---
def test_admin_employee_id_backdoor_eradicated():
    auth = XentroJWTAuthentication()
    factory = APIRequestFactory()
    req = factory.get('/api/test/', HTTP_X_ADMIN_EMPLOYEE_ID='9922953')
    res = auth.authenticate(req)
    assert res is None, "Unauthenticated request with X-Admin-Employee-Id header MUST return None, not SuperAdmin!"

def test_admin_string_header_eradicated():
    auth = XentroJWTAuthentication()
    factory = APIRequestFactory()
    req = factory.get('/api/test/', HTTP_X_ADMIN_EMPLOYEE_ID='admin')
    res = auth.authenticate(req)
    assert res is None, "Unauthenticated request with X-Admin-Employee-Id: admin MUST return None!"

def test_refresh_token_rejected_as_access_token():
    auth = XentroJWTAuthentication()
    factory = APIRequestFactory()
    now = int(time.time())
    payload = {
        'sub': 'usr_100',
        'type': 'refresh', # Refresh token
        'iat': now,
        'exp': now + 3600,
    }
    refresh_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    req = factory.get('/api/test/', HTTP_AUTHORIZATION=f'Bearer {refresh_token}')
    try:
        auth.authenticate(req)
        raise AssertionError("Expected AuthenticationFailed for refresh token")
    except AuthenticationFailed as e:
        assert "Refresh tokens cannot be used" in str(e)

run_test('DJ-AUTH-06', 'Unauthenticated X-Admin-Employee-Id header backdoor is eradicated', test_admin_employee_id_backdoor_eradicated)
run_test('DJ-AUTH-07', 'X-Admin-Employee-Id: admin header returns None (unauthenticated)', test_admin_string_header_eradicated)
run_test('DJ-AUTH-08', 'Refresh token cannot impersonate access token (AuthenticationFailed)', test_refresh_token_rejected_as_access_token)

# --- GROUP 3: STARTUP ADMIN FINANCIAL ACCESS & CAPABILITY DELEGATION ---
def test_finance_founder_authorized():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                return mock_memberships
            if name == 'diligence_access_requests':
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_founder', 'ST-001') is True

def test_finance_role_authorized():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = {
                    'entityId': 'ST-001',
                    'userId': 'usr_finance',
                    'role': 'Finance',
                    'status': 'ACTIVE',
                    'permissions': ['FINANCE'],
                }
                return mock_memberships
            if name == 'diligence_access_requests':
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_finance', 'ST-001') is True

def test_finance_admin_without_capability_denied():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = {
                    'entityId': 'ST-001',
                    'userId': 'usr_admin',
                    'role': 'Admin',
                    'status': 'ACTIVE',
                    'permissions': ['ADMIN', 'MANAGE_TEAM'], # Broad Admin WITHOUT MANAGE_FINANCE
                }
                return mock_memberships
            if name == 'diligence_access_requests':
                mock_dd_reqs.find_one.return_value = None
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_admin', 'ST-001') is False, "Admin without MANAGE_FINANCE must be denied!"

def test_finance_admin_with_manage_finance_capability_authorized():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = {
                    'entityId': 'ST-001',
                    'userId': 'usr_admin_fin',
                    'role': 'Admin',
                    'status': 'ACTIVE',
                    'permissions': ['ADMIN', 'MANAGE_TEAM', 'MANAGE_FINANCE'], # Explicit delegation
                }
                return mock_memberships
            if name == 'diligence_access_requests':
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_admin_fin', 'ST-001') is True

def test_finance_viewer_denied():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = {
                    'entityId': 'ST-001',
                    'userId': 'usr_viewer',
                    'role': 'Viewer',
                    'status': 'ACTIVE',
                    'permissions': ['VIEW_ONLY'],
                }
                return mock_memberships
            if name == 'diligence_access_requests':
                mock_dd_reqs.find_one.return_value = None
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_viewer', 'ST-001') is False

def test_finance_suspended_member_denied():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = {
                    'entityId': 'ST-001',
                    'userId': 'usr_suspended',
                    'role': 'Finance',
                    'status': 'SUSPENDED',
                    'permissions': ['FINANCE'],
                }
                return mock_memberships
            if name == 'diligence_access_requests':
                mock_dd_reqs.find_one.return_value = None
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_suspended', 'ST-001') is False

def test_finance_expired_diligence_grant_denied():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = None
                return mock_memberships
            if name == 'diligence_access_requests':
                past_iso = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2)).isoformat()
                mock_dd_reqs.find_one.return_value = {
                    'entityId': 'ST-001',
                    'requesterId': 'usr_investor',
                    'status': 'Approved',
                    'validUntil': past_iso, # Expired
                    'grantedFolders': ['Financial'],
                }
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_investor', 'ST-001') is False

def test_finance_revoked_diligence_grant_denied():
    with patch('apps.finance.views.get_collection') as mock_col_func:
        mock_entities = MagicMock()
        mock_memberships = MagicMock()
        mock_dd_reqs = MagicMock()

        def col_side_effect(name):
            if name == 'entities':
                mock_entities.find_one.return_value = {
                    'id': 'ST-001',
                    'createdByUserId': 'usr_founder',
                    'currentOwnerUserId': 'usr_founder',
                }
                return mock_entities
            if name == 'memberships':
                mock_memberships.find_one.return_value = None
                return mock_memberships
            if name == 'diligence_access_requests':
                future_iso = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
                mock_dd_reqs.find_one.return_value = {
                    'entityId': 'ST-001',
                    'requesterId': 'usr_investor',
                    'status': 'Approved',
                    'isRevoked': True, # Revoked
                    'validUntil': future_iso,
                    'grantedFolders': ['Financial'],
                }
                return mock_dd_reqs
            return MagicMock()

        mock_col_func.side_effect = col_side_effect
        assert check_startup_finance_access('usr_investor', 'ST-001') is False

run_test('DJ-FIN-01', 'Startup Founder authorized for financial data', test_finance_founder_authorized)
run_test('DJ-FIN-02', 'Startup Finance role authorized for financial data', test_finance_role_authorized)
run_test('DJ-FIN-03', 'Startup Admin without MANAGE_FINANCE capability is denied (False)', test_finance_admin_without_capability_denied)
run_test('DJ-FIN-04', 'Startup Admin with MANAGE_FINANCE capability is authorized (True)', test_finance_admin_with_manage_finance_capability_authorized)
run_test('DJ-FIN-05', 'Startup Viewer is denied financial access (False)', test_finance_viewer_denied)
run_test('DJ-FIN-06', 'Suspended member is denied financial access (False)', test_finance_suspended_member_denied)
run_test('DJ-FIN-07', 'Expired diligence grant is denied (False)', test_finance_expired_diligence_grant_denied)
run_test('DJ-FIN-08', 'Revoked diligence grant is denied (False)', test_finance_revoked_diligence_grant_denied)

print('========================================================================')
total = len(results)
passed = sum(1 for r in results if r[2] == 'PASS')
failed = sum(1 for r in results if r[2] == 'FAIL')
print(f"TOTAL TESTS: {total} | PASSED: {passed} | FAILED: {failed}")
print('========================================================================')

if failed > 0:
    sys.exit(1)
