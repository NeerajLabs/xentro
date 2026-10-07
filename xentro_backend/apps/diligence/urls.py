from django.urls import path
from .views import (
    DdLockerFilesView,
    DdPresignUploadView,
    DdDownloadUrlView,
    VerifyLockerAccessView,
    RequestLockerAccessView
)

urlpatterns = [
    path("dd/<str:startup_id>/files/", DdLockerFilesView.as_view(), name="dd_files"),
    path("dd/<str:startup_id>/upload-url/", DdPresignUploadView.as_view(), name="dd_upload_url"),
    path("dd/<str:startup_id>/verify-access/", VerifyLockerAccessView.as_view(), name="dd_verify_access"),
    path("dd/<str:startup_id>/request-access/", RequestLockerAccessView.as_view(), name="dd_request_access"),
    path("dd/file/<str:file_id>/download-url/", DdDownloadUrlView.as_view(), name="dd_download_url"),
]
