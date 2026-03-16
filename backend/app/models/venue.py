from pydantic import BaseModel
from typing import Optional

class LocationInput(BaseModel):
    lat: float
    lng: float

class RecommendationRequest(BaseModel):
    user_id: str
    location: LocationInput
    activity: str = "any"
    session_preferences: Optional[dict] = None 
    