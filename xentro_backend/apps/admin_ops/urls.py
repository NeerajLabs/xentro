from django.urls import path
from .views import (
    AdminLoginView,
    AdminOverviewView,
    AdminEntityVerifyView,
    AdminAuditLogsView,
    AdminRegistrationRequestsView,
    AdminRegistrationActionView,
    AdminRolesListView,
    AdminSwitchRoleView,
    AdminUsersListView,
    AdminUserDetailView
)

urlpatterns = [
    path("admin/auth/login/", AdminLoginView.as_view(), name="admin_login"),
    path("admin/overview/", AdminOverviewView.as_view(), name="admin_overview"),
    path("admin/entities/<str:entity_id>/verify/", AdminEntityVerifyView.as_view(), name="admin_entity_verify"),
    path("admin/audit-logs/", AdminAuditLogsView.as_view(), name="admin_audit_logs"),
    path("admin/users/", AdminUsersListView.as_view(), name="admin_users_list"),
    path("admin/users/<str:user_id>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("admin/registration-requests/", AdminRegistrationRequestsView.as_view(), name="admin_registration_requests"),
    path("admin/registration-requests/<str:user_id>/action/", AdminRegistrationActionView.as_view(), name="admin_registration_action"),
    path("admin/roles/", AdminRolesListView.as_view(), name="admin_roles_list"),
    path("admin/switch-role/", AdminSwitchRoleView.as_view(), name="admin_switch_role"),
]
