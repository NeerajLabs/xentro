from django.urls import path
from .views import TokenRefreshView, SwitchActiveRoleView

urlpatterns = [
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/active-role/", SwitchActiveRoleView.as_view(), name="switch_active_role"),
]
