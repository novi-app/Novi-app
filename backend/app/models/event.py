"""
Behavioural Events Model.
Used to validate the events request.
"""
from typing import Optional, Any
from pydantic import BaseModel, Field

class EventBatchRequest(BaseModel):
    events: list[dict[str, Any]] = Field(
        min_length=1,
        max_length=500,
        description="Batch of behavioral events to persist in Firestore.",
    )
    session_id: Optional[str] = None # If Doesn't Exist, It will be generated.
