from django.urls import path
from .views import OpportunitiesListView, ApplyOpportunityView, ImportOpportunitiesCsvView

urlpatterns = [
    path("opportunities/", OpportunitiesListView.as_view(), name="opportunities_list"),
    path("opportunities/import-csv/", ImportOpportunitiesCsvView.as_view(), name="opportunities_import_csv"),
    path("opportunities/<str:opp_id>/apply/", ApplyOpportunityView.as_view(), name="apply_opportunity"),
]
