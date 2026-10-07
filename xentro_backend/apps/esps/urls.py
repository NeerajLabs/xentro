from django.urls import path
from .views import EspRequestView, EspEndorseStartupView

urlpatterns = [
    path("esp/request/", EspRequestView.as_view(), name="esp_request"),
    path("esp/<str:esp_id>/endorse/", EspEndorseStartupView.as_view(), name="esp_endorse"),
]
