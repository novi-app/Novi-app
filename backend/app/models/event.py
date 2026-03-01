"""
Behavioral Events Models.
"""
from typing import Optional, Any, Literal
from pydantic import BaseModel, Field

class BehavioralEvent(BaseModel):
    """Single behavioral event with required fields."""
    event_id: Optional[str] = None  # For deduplication
    event_type: str  # Required: scroll_event, venue_view, etc.
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: Optional[int] = None  # Will be set by backend if missing
    
    # Additional properties (event-specific data)
    class Config:
        extra = "allow"  # Allow additional fields for event-specific properties


class EventBatchRequest(BaseModel):
    """Batch of behavioral events."""
    events: list[BehavioralEvent] = Field(
        min_length=1,
        max_length=500,
        description="Batch of behavioral events to persist in Firestore.",
    )
    session_id: Optional[str] = None
