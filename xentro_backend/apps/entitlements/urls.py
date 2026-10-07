from django.urls import path
from .views import EntityEntitlementsView, AdminGrantEntitlementView

urlpatterns = [
    path("entitlements/<str:entity_id>/", EntityEntitlementsView.as_view(), name="entity_entitlements"),
    path("admin/entitlements/grant/", AdminGrantEntitlementView.as_view(), name="admin_grant_entitlement"),
]
