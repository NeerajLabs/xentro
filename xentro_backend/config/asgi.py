"""
ASGI config for xentro_backend with Django Channels support.
"""
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.messaging.routing import websocket_urlpatterns as messaging_ws_urls
from apps.notifications.routing import websocket_urlpatterns as notif_ws_urls

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            messaging_ws_urls + notif_ws_urls
        )
    ),
})
