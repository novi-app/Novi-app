from pydantic import BaseModel
from typing import List

class UserPreferences(BaseModel):
    dietary: List[str]
    budget: str
    vibes: List[str]
    travel_style: str

class OnboardingRequest(BaseModel):
    preferences: UserPreferences

class OnboardingResponse(BaseModel):
    user_id: str
    status: str
    