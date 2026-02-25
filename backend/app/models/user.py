from pydantic import BaseModel, Field
from typing import List

class UserPreferences(BaseModel):
    dietary: List[str] = []
    budget: int = Field(default=2, ge=1, le=3)
    activity_preference: List[str] = []

class OnboardingRequest(BaseModel):
    preferences: UserPreferences

class OnboardingResponse(BaseModel):
    user_id: str
    status: str