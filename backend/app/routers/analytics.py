from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.utils.firebase_client import get_db
from app.models.event import EventBatchRequest

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def _now_ms() -> int:
    # Milliseconds since epoch, consistent with frontend timestamps.
    return int(datetime.now(tz=timezone.utc).timestamp() * 1000)


def _generate_session_id() -> str:
    # Fallback session id when none is provided by the client.
    return f"session_{_now_ms()}_{uuid4().hex[:8]}"


@router.post("/event")
async def log_analytics_events(request: EventBatchRequest):
    """
    Save a batch of behavioral events to Firestore.

    - Target collection: behavioral_events
    - Ensures each event has a session_id
    """
    try:
        db = get_db()

        # Resolve a batch-level session id: request field -> first event -> generated fallback.
        batch_session_id = request.session_id
        if not batch_session_id:
            for event in request.events:
                event_session_id = event.get("session_id")
                if event_session_id:
                    batch_session_id = str(event_session_id)
                    break

        if not batch_session_id:
            batch_session_id = _generate_session_id()

        # Write all events in a single Firestore batch for efficiency.
        write_batch = db.batch()
        for event in request.events:
            event_type = event.get("event_type")
            if not event_type:
                raise HTTPException(
                    status_code=400,
                    detail="Each event must include 'event_type'.",
                )

            # Copy to avoid mutating the request body; normalize key fields.
            payload = dict(event)
            payload["event_type"] = str(event_type)
            payload["session_id"] = str(payload.get("session_id") or batch_session_id)
            if "timestamp" not in payload:
                payload["timestamp"] = _now_ms()

            event_ref = db.collection("behavioral_events").document()
            write_batch.set(event_ref, payload)

        write_batch.commit()
        return {
            "status": "logged",
            "count": len(request.events),
            "session_id": batch_session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log events: {e}")
