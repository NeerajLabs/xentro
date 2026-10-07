"""
XENTRO Realtime Chat WebSocket Consumer
"""
import json
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from integrations.mongodb import get_collection

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id', 'general')
        self.room_group_name = f"chat_{self.conversation_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            sender_id = data.get("senderId", "anonymous")
            content = data.get("content", "")
            msg_type = data.get("type", "TEXT") # TEXT, ATTACHMENT, TYPING

            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

            if msg_type != "TYPING":
                # Save to MongoDB
                messages_col = get_collection("messages")
                msg_doc = {
                    "conversationId": self.conversation_id,
                    "senderId": sender_id,
                    "content": content,
                    "type": msg_type,
                    "createdAt": timestamp
                }
                messages_col.insert_one(msg_doc)

            # Broadcast to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "senderId": sender_id,
                    "content": content,
                    "messageType": msg_type,
                    "timestamp": timestamp
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({"error": str(e)}))

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "senderId": event["senderId"],
            "content": event["content"],
            "type": event["messageType"],
            "timestamp": event["timestamp"]
        }))
