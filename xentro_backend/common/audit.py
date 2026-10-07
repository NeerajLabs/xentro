"""
XENTRO Immutable Audit Logging Engine
Tracks all critical administrative and security actions into MongoDB `audit_logs`.
"""
import datetime
import uuid
import logging
from integrations.mongodb import get_collection

logger = logging.getLogger(__name__)

def log_audit_event(
    admin_id: str,
    action: str,
    object_type: str,
    object_id: str,
    previous_state: dict = None,
    new_state: dict = None,
    reason: str = "",
    ip_address: str = "127.0.0.1"
):
    """Writes an immutable record into audit_logs collection."""
    try:
        col = get_collection("audit_logs")
        event = {
            "event_id": f"evt_{uuid.uuid4().hex[:12]}",
            "admin_id": admin_id,
            "action": action,
            "object_type": object_type,
            "object_id": object_id,
            "previous_state": previous_state or {},
            "new_state": new_state or {},
            "reason": reason,
            "ip_address": ip_address,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        col.insert_one(event)
        logger.info(f"[AUDIT] {admin_id} -> {action} on {object_type}:{object_id}")
        return event
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        return None
