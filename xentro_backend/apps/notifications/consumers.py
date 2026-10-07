"""
XENTRO Realtime Notifications WebSocket Consumer
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs'].get('user_id', 'general')
        self.room_group_name = f"notify_{self.user_id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def notify_alert(self, event):
        await self.send(text_data=json.dumps({
            "title": event["title"],
            "body": event["body"],
            "type": event.get("notificationType", "GENERAL"),
            "targetUrl": event.get("targetUrl", "")
        }))
