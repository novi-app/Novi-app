from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

router = APIRouter(prefix="/api/user", tags=["user"])

class UserPreferences(BaseModel):
    dietary: List[str]
    budget: str
    vibes: List[str]
    travel_style: str

class OnboardingRequest(BaseModel):
    preferences: UserPreferences

@router.post("/onboard")
async def onboard_user(request: OnboardingRequest):
    """
    Create user profile and generate preference embedding
    """
    try:
        # TODO: Implement user creation logic
        # - Generate user embedding from preferences
        # - Save to Firebase
        
        return {
            "user_id": "temp_user_123",
            "status": "success",
            "message": "User onboarded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
