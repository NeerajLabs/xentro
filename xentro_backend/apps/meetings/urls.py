from django.urls import path
from .views import CreateMeetingView, MyMeetingsView

urlpatterns = [
    path("meetings/create/", CreateMeetingView.as_view(), name="create_meeting"),
    path("meetings/my/", MyMeetingsView.as_view(), name="my_meetings"),
]
