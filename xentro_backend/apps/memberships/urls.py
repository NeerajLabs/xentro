from django.urls import path
from .views import MyMembershipsView, InviteMemberView, AcceptInvitationView

urlpatterns = [
    path("memberships/my/", MyMembershipsView.as_view(), name="my_memberships"),
    path("memberships/invite/", InviteMemberView.as_view(), name="invite_member"),
    path("memberships/invitations/<str:invitation_id>/accept/", AcceptInvitationView.as_view(), name="accept_invitation"),
]

