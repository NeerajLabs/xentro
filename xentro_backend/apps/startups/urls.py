from django.urls import path
from .views import MyStartupsView, StartupDetailView, StartupAsksView, StartupDiscoverView

urlpatterns = [
    path("startups/discover/", StartupDiscoverView.as_view(), name="startups_discover"),
    path("startups/my/", MyStartupsView.as_view(), name="my_startups"),
    path("startups/", MyStartupsView.as_view(), name="create_startup"),
    path("startups/<str:startup_id>/", StartupDetailView.as_view(), name="startup_detail"),
    path("startups/<str:startup_id>/asks/", StartupAsksView.as_view(), name="startup_asks"),
]
