from django.urls import path
from .views import InvestorMeView, InvestorDealsView

urlpatterns = [
    path("investors/me/", InvestorMeView.as_view(), name="investor_me"),
    path("investors/setup/", InvestorMeView.as_view(), name="investor_setup"),
    path("investors/deals/", InvestorDealsView.as_view(), name="investor_deals"),
]
