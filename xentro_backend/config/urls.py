"""
XENTRO Master URL Configuration
All business API routes are namespaced under `/api/v1/`.
"""
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "Xentro Modular Monolith Backend",
        "version": "1.0.0",
        "database": "MongoDB",
        "realtime": "Django Channels + WebSockets",
        "cache": "Redis",
        "workers": "Celery"
    })

urlpatterns = [
    path("", health_check, name="root_health"),
    path("api/v1/health/", health_check, name="api_health"),

    # API v1 Namespaces
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.authentication.urls")),
    path("api/v1/", include("apps.admin_ops.urls")),
    path("api/v1/", include("apps.verification.urls")),
    path("api/v1/", include("apps.entities.urls")),
    path("api/v1/", include("apps.memberships.urls")),
    path("api/v1/", include("apps.startups.urls")),
    path("api/v1/", include("apps.investors.urls")),
    path("api/v1/", include("apps.mentors.urls")),
    path("api/v1/", include("apps.esps.urls")),
    path("api/v1/", include("apps.meetings.urls")),
    path("api/v1/", include("apps.diligence.urls")),
    path("api/v1/", include("apps.finance.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.connections.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.feed.urls")),
    path("api/v1/", include("apps.opportunities.urls")),
    path("api/v1/", include("apps.entitlements.urls")),
]
