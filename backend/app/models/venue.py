from pydantic import BaseModel

class LocationInput(BaseModel):
    lat: float
    lng: float

class RecommendationRequest(BaseModel):
    user_id: str
    location: LocationInput
    intent: str = "any"  # "restaurant", "cafe", "bar", "any"
