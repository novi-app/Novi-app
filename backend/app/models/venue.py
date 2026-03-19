from pydantic import BaseModel
from typing import Optional

class LocationInput(BaseModel):
    latitude: float
    longitude: float

class RecommendationRequest(BaseModel):
    user_id: str
    location: LocationInput
    activity: str = "any"
    session_preferences: Optional[dict] = None 
    