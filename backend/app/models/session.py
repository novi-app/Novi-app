from pydantic import BaseModel
from typing import List

class SessionPreferences(BaseModel):
    activity: str = "food"
    vibe: List[str] = []
    mood: str = "relaxed"
    
