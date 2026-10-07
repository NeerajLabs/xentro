from django.urls import path
from .views import FeedPostsView, ToggleLikePostView, PostCommentsView

urlpatterns = [
    path("feed/posts/", FeedPostsView.as_view(), name="feed_posts"),
    path("feed/posts/<str:post_id>/like/", ToggleLikePostView.as_view(), name="toggle_like"),
    path("feed/posts/<str:post_id>/comments/", PostCommentsView.as_view(), name="post_comments"),
]
