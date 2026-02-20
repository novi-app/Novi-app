from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid

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
        # Generate temporary user ID
        temp_user_id = f"temp_{uuid.uuid4().hex[:12]}"

        # Convert preferences object → dict
        prefs_dict = request.preferences.model_dump()

        return {
            "success": True,
            "data": {
                "user_id": temp_user_id,
                "preferences": prefs_dict
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))