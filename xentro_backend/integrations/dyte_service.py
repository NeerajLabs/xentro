"""
XENTRO Video Meetings Service
Supports Google Meet fallback links and Dyte room creation.
"""
import os
import uuid
import logging
import requests

logger = logging.getLogger(__name__)

DYTE_API_KEY = os.getenv("DYTE_API_KEY", "")
DYTE_ORG_ID = os.getenv("DYTE_ORGANIZATION_ID", "")
DEFAULT_PROVIDER = os.getenv("DEFAULT_MEETING_PROVIDER", "GOOGLE_MEET")

def create_meeting_room(title: str, participants: list) -> dict:
    """
    Creates a meeting room.
    If DYTE credentials are not available, defaults to Google Meet format.
    """
    room_code = uuid.uuid4().hex[:10]
    
    if DEFAULT_PROVIDER == "DYTE" and DYTE_API_KEY and DYTE_ORG_ID:
        try:
            # Dyte v2 Meetings API
            resp = requests.post(
                "https://api.dyte.io/v2/meetings",
                headers={
                    "Authorization": f"Basic {DYTE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={"title": title},
                timeout=5
            )
            if resp.status_code == 201:
                data = resp.json().get("data", {})
                return {
                    "provider": "DYTE",
                    "meeting_id": data.get("id"),
                    "meeting_url": f"https://app.dyte.io/meeting/{data.get('id')}",
                    "room_name": data.get("room_name")
                }
        except Exception as e:
            logger.warning(f"Dyte room creation failed: {e}. Falling back to Google Meet.")

    # Google Meet fallback
    # Format: abc-defg-hij
    clean_code = f"{room_code[:3]}-{room_code[3:7]}-{room_code[7:10]}"
    return {
        "provider": "GOOGLE_MEET",
        "meeting_id": f"gmeet_{room_code}",
        "meeting_url": f"https://meet.google.com/{clean_code}",
        "room_name": title
    }
