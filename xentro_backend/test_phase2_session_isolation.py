"""
========================================================================
XENTRO V1 — PHASE 2 DJANGO / PYTHON SECURITY TEST SUITE
========================================================================
Validates:
1. IsEntityMaster permission enforcement (Head only, active session in entity_sessions)
2. IsEntityWorkspace permission enforcement (Active membership, active session)
3. Personal context rejection from Master/Workspace endpoints
4. Cross-tenant access violation rejection
5. Suspended member rejection and revocation
6. Data conflict fail-closed behavior
========================================================================
"""
import sys
import unittest
from unittest.mock import MagicMock, patch

# Configure minimal Django settings if not configured
import os
import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="test_django_secret_key_phase2_testing",
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "rest_framework",
        ],
        DATABASES={},
    )
    django.setup()

from rest_framework.test import APIRequestFactory
from common.jwt_auth import XentroUserWrapper
from common.permissions import IsEntityMaster, IsEntityWorkspace, IsEntityMasterOrWorkspace


class Phase2SessionIsolationTestCase(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

        # Mock database collections
        self.mock_sessions_col = MagicMock()
        self.mock_entities_col = MagicMock()
        self.mock_memberships_col = MagicMock()

    def _make_request(self, user, headers=None, view_kwargs=None):
        request = self.factory.get("/test/endpoint/", HTTP_X_ENTITY_ID=headers.get("X-Entity-Id") if headers else None)
        request.user = user
        view = MagicMock()
        view.kwargs = view_kwargs or {}
        return request, view

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_01_valid_master_session_granted(self, mock_get_col):
        """Valid ENTITY_MASTER session bound to governing Head succeeds."""
        def get_col_side_effect(name):
            if name == "entity_sessions":
                col = MagicMock()
                col.find_one.return_value = {"sessionId": "sess_m_1", "status": "ACTIVE"}
                return col
            if name == "entities":
                col = MagicMock()
                col.find_one.return_value = {
                    "id": "ent_startup_a",
                    "currentOwnerUserId": "usr_founder",
                    "primaryOwnerId": "usr_founder",
                    "status": "ACTIVE",
                }
                return col
            return MagicMock()

        mock_get_col.side_effect = get_col_side_effect

        user = XentroUserWrapper(
            {"id": "usr_founder", "email": "founder@startup-a.com"},
            token_payload={
                "context": "ENTITY_MASTER",
                "entityId": "ent_startup_a",
                "sessionId": "sess_m_1",
                "isHead": True,
            }
        )

        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityMaster()
        self.assertTrue(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_02_personal_token_denied_master_endpoint(self, mock_get_col):
        """Personal account token cannot access Master endpoint."""
        user = XentroUserWrapper(
            {"id": "usr_founder", "email": "founder@startup-a.com"},
            token_payload={"context": "PERSONAL"}
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityMaster()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_03_workspace_token_denied_master_endpoint(self, mock_get_col):
        """Workspace token cannot elevate to Master endpoint."""
        user = XentroUserWrapper(
            {"id": "usr_employee", "email": "employee@startup-a.com"},
            token_payload={
                "context": "ENTITY_WORKSPACE",
                "entityId": "ent_startup_a",
                "sessionId": "sess_ws_1",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityMaster()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_04_cross_tenant_master_denied(self, mock_get_col):
        """Master token for Entity A cannot access Entity B."""
        user = XentroUserWrapper(
            {"id": "usr_founder", "email": "founder@startup-a.com"},
            token_payload={
                "context": "ENTITY_MASTER",
                "entityId": "ent_startup_a",
                "sessionId": "sess_m_1",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_b"})
        perm = IsEntityMaster()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_05_revoked_session_denied(self, mock_get_col):
        """Revoked Master session in entity_sessions is denied."""
        def get_col_side_effect(name):
            if name == "entity_sessions":
                col = MagicMock()
                col.find_one.return_value = None  # No ACTIVE session found
                return col
            return MagicMock()

        mock_get_col.side_effect = get_col_side_effect

        user = XentroUserWrapper(
            {"id": "usr_founder"},
            token_payload={
                "context": "ENTITY_MASTER",
                "entityId": "ent_startup_a",
                "sessionId": "sess_revoked",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityMaster()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_06_conflicting_owner_fields_fail_closed(self, mock_get_col):
        """Conflicting currentOwnerUserId and primaryOwnerId fails closed."""
        def get_col_side_effect(name):
            if name == "entity_sessions":
                col = MagicMock()
                col.find_one.return_value = {"sessionId": "sess_m_1", "status": "ACTIVE"}
                return col
            if name == "entities":
                col = MagicMock()
                col.find_one.return_value = {
                    "id": "ent_startup_a",
                    "currentOwnerUserId": "usr_founder",
                    "primaryOwnerId": "usr_other",  # Disagreement!
                }
                return col
            return MagicMock()

        mock_get_col.side_effect = get_col_side_effect

        user = XentroUserWrapper(
            {"id": "usr_founder"},
            token_payload={
                "context": "ENTITY_MASTER",
                "entityId": "ent_startup_a",
                "sessionId": "sess_m_1",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityMaster()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_ws_01_active_membership_workspace_granted(self, mock_get_col):
        """Active member with ENTITY_WORKSPACE session is granted workspace access."""
        def get_col_side_effect(name):
            if name == "entity_sessions":
                col = MagicMock()
                col.find_one.return_value = {"sessionId": "sess_ws_1", "status": "ACTIVE"}
                return col
            if name == "entities":
                col = MagicMock()
                col.find_one.return_value = {"id": "ent_startup_a", "status": "ACTIVE"}
                return col
            if name == "memberships":
                col = MagicMock()
                col.find_one.return_value = {
                    "entityId": "ent_startup_a",
                    "userId": "usr_employee",
                    "role": "Viewer",
                    "status": "ACTIVE",
                }
                return col
            return MagicMock()

        mock_get_col.side_effect = get_col_side_effect

        user = XentroUserWrapper(
            {"id": "usr_employee"},
            token_payload={
                "context": "ENTITY_WORKSPACE",
                "entityId": "ent_startup_a",
                "sessionId": "sess_ws_1",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityWorkspace()
        self.assertTrue(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_ws_02_suspended_member_denied_workspace(self, mock_get_col):
        """Suspended member is strictly denied workspace access."""
        def get_col_side_effect(name):
            if name == "entity_sessions":
                col = MagicMock()
                col.find_one.return_value = {"sessionId": "sess_ws_1", "status": "ACTIVE"}
                return col
            if name == "entities":
                col = MagicMock()
                col.find_one.return_value = {"id": "ent_startup_a", "status": "ACTIVE"}
                return col
            if name == "memberships":
                col = MagicMock()
                col.find_one.return_value = {
                    "entityId": "ent_startup_a",
                    "userId": "usr_employee",
                    "status": "SUSPENDED",
                }
                return col
            return MagicMock()

        mock_get_col.side_effect = get_col_side_effect

        user = XentroUserWrapper(
            {"id": "usr_employee"},
            token_payload={
                "context": "ENTITY_WORKSPACE",
                "entityId": "ent_startup_a",
                "sessionId": "sess_ws_1",
            }
        )
        request, view = self._make_request(user, view_kwargs={"entity_id": "ent_startup_a"})
        perm = IsEntityWorkspace()
        self.assertFalse(perm.has_permission(request, view))

    @patch("integrations.mongodb.get_collection")
    def test_dj_p2_master_or_ws_permits_both(self, mock_get_col):
        """IsEntityMasterOrWorkspace permits both valid Master and valid Workspace."""
        perm = IsEntityMasterOrWorkspace()

        # Test Master branch
        with patch.object(IsEntityMaster, "has_permission", return_value=True):
            self.assertTrue(perm.has_permission(MagicMock(), MagicMock()))

        # Test Workspace branch
        with patch.object(IsEntityMaster, "has_permission", return_value=False):
            with patch.object(IsEntityWorkspace, "has_permission", return_value=True):
                self.assertTrue(perm.has_permission(MagicMock(), MagicMock()))

        # Test Denied branch
        with patch.object(IsEntityMaster, "has_permission", return_value=False):
            with patch.object(IsEntityWorkspace, "has_permission", return_value=False):
                self.assertFalse(perm.has_permission(MagicMock(), MagicMock()))


if __name__ == "__main__":
    print("========================================================================")
    print("XENTRO V1 — PHASE 2 DJANGO / PYTHON SECURITY TEST RUNNER")
    print("========================================================================")
    suite = unittest.TestLoader().loadTestsFromTestCase(Phase2SessionIsolationTestCase)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    print(f"\nTOTAL TESTS: {result.testsRun} | PASSED: {result.testsRun - len(result.failures) - len(result.errors)} | FAILED: {len(result.failures) + len(result.errors)}")
    if not result.wasSuccessful():
        sys.exit(1)
