from django.urls import path
from .views import IdentitySubmitView, IdentityStatusView, AdminIdentityQueueView, AdminIdentityReviewView

urlpatterns = [
    path("identity/submit/", IdentitySubmitView.as_view(), name="identity_submit"),
    path("identity/status/", IdentityStatusView.as_view(), name="identity_status"),
    path("admin/verification/identity/", AdminIdentityQueueView.as_view(), name="admin_identity_queue"),
    path("admin/verification/identity/<str:user_id>/review/", AdminIdentityReviewView.as_view(), name="admin_identity_review"),
]
