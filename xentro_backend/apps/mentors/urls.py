from django.urls import path
from .views import MentorMeView, MentorRequestsView, MentorListView

urlpatterns = [
    path("mentors/", MentorListView.as_view(), name="mentors_list"),
    path("mentors/me/", MentorMeView.as_view(), name="mentor_me"),
    path("mentors/setup/", MentorMeView.as_view(), name="mentor_setup"),
    path("mentors/requests/", MentorRequestsView.as_view(), name="mentor_requests"),
]
