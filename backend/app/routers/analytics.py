from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.utils.firebase_client import get_db
from app.models.event import EventBatchRequest
import logging

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

# In-memory deduplication cache
_recent_event_ids: dict[str, int] = {}  # event_id -> timestamp_ms

def _now_ms() -> int:
    return int(datetime.now(tz=timezone.utc).timestamp() * 1000)

def _generate_session_id() -> str:
    return f"session_{_now_ms()}_{uuid4().hex[:12]}"

def _is_duplicate(event_id: str) -> bool:
    """Check if event_id was seen in last 60 seconds."""
    now = _now_ms()
    
    # Clean old entries (older than 60 seconds)
    expired_ids = [
        eid for eid, ts in _recent_event_ids.items()
        if now - ts > 60000
    ]
    for eid in expired_ids:
        del _recent_event_ids[eid]
    
    # Check if current event is duplicate
    if event_id in _recent_event_ids:
        return True
    
    # Mark as seen
    _recent_event_ids[event_id] = now
    return False


@router.post("/event")
async def log_analytics_events(request: EventBatchRequest):
    """
    Save a batch of behavioral events to Firestore.
    
    - Target collection: behavioral_events
    - Ensures each event has session_id and timestamp
    - Deduplicates events within 60-second window
    """
    try:
        db = get_db()

        # Resolve batch-level session_id
        batch_session_id = request.session_id
        if not batch_session_id:
            for event in request.events:
                if event.session_id:
                    batch_session_id = str(event.session_id)
                    break

        if not batch_session_id:
            batch_session_id = _generate_session_id()

        logger.info(f"Logging {len(request.events)} events for session {batch_session_id}")

        # Process events
        write_batch = db.batch()
        logged_count = 0
        duplicate_count = 0
        
        for event in request.events:
            # Check for duplicate using event_id
            if event.event_id and _is_duplicate(str(event.event_id)):
                duplicate_count += 1
                continue
            
            # Convert Pydantic model to dict for Firestore
            payload = event.model_dump(exclude_none=True)
            
            # Normalize fields
            payload["event_type"] = str(event.event_type)
            payload["session_id"] = str(event.session_id or batch_session_id)
            
            if "timestamp" not in payload or payload["timestamp"] is None:
                payload["timestamp"] = _now_ms()
            
            # Write to Firestore
            event_ref = db.collection("behavioral_events").document()
            write_batch.set(event_ref, payload)
            logged_count += 1

        write_batch.commit()
        
        logger.info(f"Successfully logged {logged_count} events ({duplicate_count} duplicates skipped)")
        
        response = {
            "status": "logged",
            "count": logged_count,
            "session_id": batch_session_id,
        }
        
        if duplicate_count > 0:
            response["duplicates_skipped"] = duplicate_count
        
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to log events: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to log events: {e}")
