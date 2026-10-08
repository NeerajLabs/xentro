"""
XENTRO Social Feed API
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

def resolve_request_user_id(request):
    """Helper to extract requesting user id from token, session cookie, or headers."""
    if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
        return request.user.id
    if request.headers.get("x-user-id"):
        return request.headers.get("x-user-id")
    if request.query_params.get("userId"):
        return request.query_params.get("userId")
    
    token = None
    if request.COOKIES.get("xentro_session"):
        token = request.COOKIES.get("xentro_session")
    elif request.headers.get("Authorization"):
        auth_header = request.headers.get("Authorization")
        if "Bearer " in auth_header:
            token = auth_header.replace("Bearer ", "").strip()

    if token:
        try:
            from common.jwt_auth import decode_jwt_token
            payload = decode_jwt_token(token)
            if payload and payload.get("user_id"):
                return payload.get("user_id")
        except Exception:
            pass
    return None


_indexes_ready = False


def ensure_feed_indexes():
    """Unique indexes guarantee one like per user per post and one row per comment id."""
    global _indexes_ready
    if _indexes_ready:
        return
    try:
        get_collection("post_likes").create_index([("postId", 1), ("userId", 1)], unique=True)
        get_collection("post_comments").create_index("id", unique=True)
        get_collection("post_comments").create_index([("postId", 1), ("createdAt", 1)])
        _indexes_ready = True
    except Exception:
        # Existing duplicate rows would block index creation; dedupe logic below still applies.
        pass


def serialize_comment(doc):
    doc = dict(doc)
    doc.pop("_id", None)
    return {
        "id": doc.get("id"),
        "postId": doc.get("postId"),
        "author": doc.get("author") or {},
        "content": doc.get("content", ""),
        "timestamp": doc.get("timestamp") or "Recently",
        "createdAt": doc.get("createdAt"),
        "likes": doc.get("likes", 0),
        "isLiked": False,
    }


def list_post_comments(post_id):
    comments_col = get_collection("post_comments")
    return [serialize_comment(c) for c in comments_col.find({"postId": post_id}, sort=[("createdAt", 1)])]


class FeedPostsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        ensure_feed_indexes()
        current_user_id = resolve_request_user_id(request)
        feed_col = get_collection("feed_posts")
        likes_col = get_collection("post_likes")
        users_col = get_collection("users")

        posts = list(feed_col.find(
            {"is_deleted": {"$ne": True}, "deleted": {"$ne": True}, "status": {"$nin": ["DELETED", "ARCHIVED"]}},
            sort=[("createdAt", -1)],
            limit=50
        ))
        clean = []
        for p in posts:
            p.pop("_id", None)
            post_id = p.get("id")

            # Enrich author information from users collection
            author_id = p.get("authorId")
            u_doc = None
            if author_id:
                u_doc = users_col.find_one({
                    "id": author_id,
                    "isActive": {"$ne": False},
                    "accountStatus": {"$nin": ["DELETED", "REJECTED", "SUSPENDED"]},
                    "deleted": {"$ne": True},
                    "is_deleted": {"$ne": True}
                })
                # If author was removed or deactivated, do not show their posts
                if not u_doc:
                    continue

            author_name = (u_doc.get("fullName") or u_doc.get("username") if u_doc else p.get("authorName")) or "Ecosystem Member"
            author_username = (u_doc.get("username") if u_doc else None) or f"@{author_name.lower().replace(' ', '')}"
            author_avatar = (u_doc.get("avatar") if u_doc else p.get("authorAvatar")) or f"https://api.dicebear.com/7.x/initials/svg?seed={author_name}"
            
            author_role = (u_doc.get("role") or u_doc.get("accountType") if u_doc else p.get("authorRole")) or "Ecosystem Member"
            if u_doc and not u_doc.get("role") and u_doc.get("activeRoles"):
                author_role = u_doc["activeRoles"][0]

            author_company = (u_doc.get("startupName") or u_doc.get("organization") or u_doc.get("company") if u_doc else p.get("authorCompany")) or ""

            role_lower = str(author_role).lower()
            if "mentor" in role_lower:
                role_type = "mentor"
            elif "investor" in role_lower:
                role_type = "investor"
            elif "esp" in role_lower:
                role_type = "esp"
            elif "startup" in role_lower or "founder" in role_lower:
                role_type = "startup"
            else:
                role_type = "explorer"

            p["author"] = {
                "id": author_id or f"usr_{post_id}",
                "name": author_name,
                "username": author_username if author_username.startswith("@") else f"@{author_username}",
                "role": author_role,
                "company": author_company,
                "avatar": author_avatar,
                "verified": True
            }
            p["authorName"] = author_name
            p["authorRole"] = author_role
            p["authorCompany"] = author_company
            p["authorAvatar"] = author_avatar
            p["authorRoleType"] = role_type

            # Live like count is always derived from post_likes (never a stale cached value)
            total_likes = likes_col.count_documents({"postId": post_id})
            p["likesCount"] = total_likes

            # Persisted comments
            comments = list_post_comments(post_id)
            p["commentsList"] = comments
            p["commentsCount"] = len(comments)

            # Calculate user-specific like state
            if current_user_id:
                has_liked = likes_col.find_one({"postId": post_id, "userId": current_user_id}) is not None
                p["isLiked"] = has_liked
            else:
                p["isLiked"] = False

            clean.append(p)

        return api_success({"posts": clean})

    def post(self, request):
        author_id = resolve_request_user_id(request)
        if not author_id:
            author_id = request.data.get("authorId") or (request.data.get("author") or {}).get("id")

        content = request.data.get("content", "").strip()
        media_urls = request.data.get("mediaUrls", [])
        tags = request.data.get("tags", [])
        post_type = request.data.get("postType", "General Update")

        if not content and not media_urls:
            return api_error("Post content or media is required.")

        users_col = get_collection("users")
        u_doc = None
        if author_id:
            u_doc = users_col.find_one({"id": author_id})

        author_name = (u_doc.get("fullName") or u_doc.get("username") if u_doc else (request.data.get("author") or {}).get("name")) or "Ecosystem Member"
        author_role = (u_doc.get("role") or u_doc.get("accountType") if u_doc else (request.data.get("author") or {}).get("role")) or "Ecosystem Member"
        author_company = (u_doc.get("startupName") or u_doc.get("organization") if u_doc else (request.data.get("author") or {}).get("company")) or ""
        author_avatar = (u_doc.get("avatar") if u_doc else (request.data.get("author") or {}).get("avatar")) or f"https://api.dicebear.com/7.x/initials/svg?seed={author_name}"

        post_id = request.data.get("id") or generate_xentro_id("opportunity")
        role_type = request.data.get("authorRoleType") or (request.data.get("author") or {}).get("roleType") or (u_doc.get("accountType", "").lower() if u_doc else "startup")
        doc = {
            "id": post_id,
            "authorId": author_id,
            "authorName": author_name,
            "authorRole": author_role,
            "authorRoleType": role_type,
            "authorCompany": author_company,
            "authorAvatar": author_avatar,
            "content": content,
            "postType": post_type,
            "mediaUrls": media_urls,
            "tags": tags,
            "likesCount": 0,
            "commentsCount": 0,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        feed_col = get_collection("feed_posts")
        feed_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"post": doc}, "Post created successfully.", status_code=201)

class ToggleLikePostView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, post_id):
        ensure_feed_indexes()
        user_id = resolve_request_user_id(request)
        if not user_id:
            user_id = request.data.get("userId")
        if not user_id:
            return api_error("Authentication required to like a post.", status_code=401)

        feed_col = get_collection("feed_posts")
        post = feed_col.find_one({"id": post_id})
        if not post:
            return api_error("Post not found", status_code=404)

        likes_col = get_collection("post_likes")
        desired = request.data.get("liked")
        if desired is None:
            # Legacy toggle behaviour when no explicit desired state is sent
            desired = likes_col.find_one({"postId": post_id, "userId": user_id}) is None
        desired = bool(desired)

        if desired:
            # Idempotent: upsert never creates a duplicate like for the same user
            likes_col.update_one(
                {"postId": post_id, "userId": user_id},
                {"$setOnInsert": {
                    "postId": post_id,
                    "userId": user_id,
                    "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }},
                upsert=True,
            )
        else:
            likes_col.delete_many({"postId": post_id, "userId": user_id})
        is_liked = desired

        # Calculate exact total likeCount independently
        total_likes = likes_col.count_documents({"postId": post_id})
        feed_col.update_one({"id": post_id}, {"$set": {"likesCount": total_likes}})

        return api_success({
            "postId": post_id,
            "likeCount": total_likes,
            "isLiked": is_liked
        })


class PostCommentsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, post_id):
        ensure_feed_indexes()
        comments = list_post_comments(post_id)
        return api_success({"postId": post_id, "comments": comments, "commentsCount": len(comments)})

    def post(self, request, post_id):
        ensure_feed_indexes()
        feed_col = get_collection("feed_posts")
        if not feed_col.find_one({"id": post_id}):
            return api_error("Post not found", status_code=404)

        comment = request.data.get("comment") or request.data
        content = (comment.get("content") or "").strip()
        if not content:
            return api_error("Comment content is required.")

        user_id = resolve_request_user_id(request)
        author = comment.get("author") or {}
        if user_id and not author.get("id"):
            author["id"] = user_id

        comment_id = comment.get("id") or generate_xentro_id("opportunity")
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        comments_col = get_collection("post_comments")
        # Idempotent on comment id: retries / duplicate submits never create a second row
        comments_col.update_one(
            {"id": comment_id},
            {"$setOnInsert": {
                "id": comment_id,
                "postId": post_id,
                "author": author,
                "content": content,
                "timestamp": comment.get("timestamp") or "Just now",
                "likes": 0,
                "createdAt": now,
            }},
            upsert=True,
        )

        comments = list_post_comments(post_id)
        feed_col.update_one({"id": post_id}, {"$set": {"commentsCount": len(comments)}})
        return api_success({
            "postId": post_id,
            "comment": next((c for c in comments if c["id"] == comment_id), None),
            "comments": comments,
            "commentsCount": len(comments),
        })
