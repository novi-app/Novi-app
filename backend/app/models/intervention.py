"""
Intervention API models.
Defines request/response payloads for trigger-based intervention generation.
"""
from typing import Any, Optional
from pydantic import BaseModel


class InterventionRequest(BaseModel):
    """Incoming payload for generating one intervention message."""
    user_id: str
    trigger_type: str
    context: Optional[dict[str, Any]] = None # Optional trigger metadata such as venues_viewed and selected_venue.

class InterventionResponse(BaseModel):
    """Returned intervention with personalized message and a suggested next action."""
    user_id: str
    trigger_type: str
    message: str
    suggested_action: str
