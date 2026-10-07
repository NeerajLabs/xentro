from django.urls import path
from .views import StartupFinanceMetricsView, ImportSpreadsheetView

urlpatterns = [
    path("finance/<str:startup_id>/metrics/", StartupFinanceMetricsView.as_view(), name="startup_finance_metrics"),
    path("finance/<str:startup_id>/import-spreadsheet/", ImportSpreadsheetView.as_view(), name="import_spreadsheet"),
]
