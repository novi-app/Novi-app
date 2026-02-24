from pydantic import BaseModel
from typing import List, Dict, Any

class LocationInput(BaseModel):
    lat: float
    lng: float

class RecommendationRequest(BaseModel):
    user_id: str
    user_emb: List
    location: LocationInput
    intent: str  # e.g., "dinner", "cafe", "sightseeing"