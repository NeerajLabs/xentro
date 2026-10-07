from django.urls import path
from .views import ConversationsListView, MessagesHistoryView, MarkReadView

urlpatterns = [
    path("messages/conversations/", ConversationsListView.as_view(), name="conversations_list"),
    path("messages/conversations/<str:conversation_id>/", MessagesHistoryView.as_view(), name="messages_history"),
    path("messages/conversations/<str:conversation_id>/send/", MessagesHistoryView.as_view(), name="send_message"),
    path("messages/conversations/<str:conversation_id>/read/", MarkReadView.as_view(), name="mark_conversation_read"),
    path("messages/read/", MarkReadView.as_view(), name="mark_all_read"),
]
