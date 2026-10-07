from django.urls import path
from .views import NotificationsListView, MarkReadNotificationView, MarkAllReadNotificationView, ClearNotificationsView

urlpatterns = [
    path("notifications/", NotificationsListView.as_view(), name="notifications_list"),
    path("notifications/clear/", ClearNotificationsView.as_view(), name="clear_all_notifications"),
    path("notifications/mark-all-read/", MarkAllReadNotificationView.as_view(), name="mark_all_notifications_read"),
    path("notifications/<str:notif_id>/read/", MarkReadNotificationView.as_view(), name="mark_notification_read"),
]
