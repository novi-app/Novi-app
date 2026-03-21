from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.models.user import OnboardingRequest, OnboardingResponse, UserPreferences
from app.services.user_service import onboard_user
from app.services.embedding_service import generate_user_embedding
from app.utils.firebase_client import get_db, get_user
from openai import OpenAIError

router = APIRouter(prefix="/api/user", tags=["user"])


class UpdatePreferencesRequest(BaseModel):
    dietary: Optional[List[str]] = None
    budget: Optional[int] = None
    activity_preference: Optional[List[str]] = None
    excluded_categories: Optional[List[str]] = None


@router.post("/onboard", response_model=OnboardingResponse)
async def onboard_user_endpoint(request: OnboardingRequest):
    try:
        result = onboard_user(request.username, request.preferences)
        return result
    
    except ValueError as ve:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid onboarding data: {str(ve)}"
        )
        
    except OpenAIError as oe:
        raise HTTPException(
            status_code=502, 
            detail="The AI profile generator is currently unavailable. Please try again later."
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Onboarding failed: {str(e)}"
        )

@router.get("/{user_id}")
async def get_user_profile(user_id: str):
    try:
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user_id,
            "username": user.get("username", "User"),
            "preferences": user.get("preferences", {}),
            "saved_venues": user.get("saved_venues", []),
            "created_at": user.get("created_at"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user profile: {str(e)}"
        )


@router.patch("/{user_id}/preferences")
async def update_user_preferences(user_id: str, request: UpdatePreferencesRequest):
    try:
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db = get_db()
        current_prefs = user.get("preferences", {})
        
        updated_prefs = current_prefs.copy()
        
        if request.dietary is not None:
            updated_prefs["dietary"] = request.dietary
        if request.budget is not None:
            updated_prefs["budget"] = request.budget
        if request.activity_preference is not None:
            updated_prefs["activity_preference"] = request.activity_preference
        if request.excluded_categories is not None:
            updated_prefs["excluded_categories"] = request.excluded_categories
        
        new_embedding = generate_user_embedding(updated_prefs)
        
        db.collection("users").document(user_id).update({
            "preferences": updated_prefs,
            "embedding": new_embedding,
            "updated_at": datetime.utcnow().isoformat()
        })
        
        return {
            "status": "success",
            "message": "Preferences updated",
            "preferences": updated_prefs
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update preferences: {str(e)}"
        )
