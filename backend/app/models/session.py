"""
Session preferences model.
Captured on home screen each time the user requests recommendations.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class SessionPreferences(BaseModel):
    vibe: List[str] = []
    intent: str = "food"
    mood: str = "relaxed"
    timing: str = "now"
    budget: Optional[int] = Field(default=None, ge=1, le=3)
    
