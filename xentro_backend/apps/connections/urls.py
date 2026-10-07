from django.urls import path
from .views import (
    ConnectionListView,
    ConnectionRequestView,
    ConnectionAcceptView,
    ConnectionDeclineView,
    ConnectionStatusView,
)

urlpatterns = [
    path("connections/", ConnectionListView.as_view(), name="connections_list"),
    path("connections/request/", ConnectionRequestView.as_view(), name="connection_request"),
    path("connections/accept/", ConnectionAcceptView.as_view(), name="connection_accept"),
    path("connections/decline/", ConnectionDeclineView.as_view(), name="connection_decline"),
    path("connections/status/", ConnectionStatusView.as_view(), name="connection_status"),
]
