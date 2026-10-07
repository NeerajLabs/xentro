"""
XENTRO Meetings API
Supports Google Meet fallback links and Dyte video call creation.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from integrations.dyte_service import create_meeting_room
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

class CreateMeetingView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request):
        data = request.data
        title = data.get("title", "Xentro Advisory Session")
        scheduled_time = data.get("scheduledTime", datetime.datetime.now(datetime.timezone.utc).isoformat())
        participants = data.get("participants", [request.user.id])
        if request.user.id not in participants:
            participants.append(request.user.id)

        # Create room via Google Meet fallback / Dyte
        room_info = create_meeting_room(title, participants)

        meeting_id = generate_xentro_id("meeting")
        meeting_doc = {
            "id": meeting_id,
            "title": title,
            "hostId": request.user.id,
            "participants": participants,
            "scheduledTime": scheduled_time,
            "provider": room_info["provider"],
            "meetingUrl": room_info["meeting_url"],
            "status": "SCHEDULED", # SCHEDULED, LIVE, COMPLETED, CANCELLED
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        meetings_col = get_collection("meetings")
        meetings_col.insert_one(meeting_doc)
        meeting_doc.pop("_id", None)

        return api_success({"meeting": meeting_doc}, "Meeting scheduled successfully.")

class MyMeetingsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request):
        meetings_col = get_collection("meetings")
        meetings = meetings_col.find({"participants": request.user.id}, sort=[("scheduledTime", 1)])
        clean = []
        for m in meetings:
            m.pop("_id", None)
            clean.append(m)
        return api_success({"meetings": clean})
