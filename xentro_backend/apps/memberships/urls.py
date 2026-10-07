from django.urls import path
from .views import MyMembershipsView, InviteMemberView

urlpatterns = [
    path("memberships/my/", MyMembershipsView.as_view(), name="my_memberships"),
    path("memberships/invite/", InviteMemberView.as_view(), name="invite_member"),
]
