from typing import Any, Optional
from pydantic import BaseModel

class InterventionRequest(BaseModel):
    user_id: str
    trigger_type: str
    context: Optional[dict[str, Any]] = None

class InterventionResponse(BaseModel):
    user_id: str
    trigger_type: str
    message: str
