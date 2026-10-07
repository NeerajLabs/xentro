from django.urls import path
from .views import EntitiesDirectoryView, EntityProfileView

urlpatterns = [
    path("entities/", EntitiesDirectoryView.as_view(), name="entities_directory"),
    path("entities/<str:entity_id>/", EntityProfileView.as_view(), name="entity_profile"),
]
