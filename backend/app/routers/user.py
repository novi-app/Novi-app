from fastapi import APIRouter, HTTPException
from app.models.user import OnboardingRequest, OnboardingResponse
from app.services.user_service import onboard_user
from openai import OpenAIError

router = APIRouter(prefix="/api/user", tags=["user"])

@router.post("/onboard", response_model=OnboardingResponse)
async def onboard_user_endpoint(request: OnboardingRequest):
    """
    Create user profile with embedding and save to Firebase.
    """
    try:
        # Calling the service layer to save to the database
        result = onboard_user(request.preferences)
        return result
    
    except ValueError as ve:
        # Catch custom logic errors (e.g., invalid budget string)
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid onboarding data: {str(ve)}"
        )
        
    except OpenAIError as oe:
        # Catch OpenAI API crashes, rate limits, or billing issues
        raise HTTPException(
            status_code=502, 
            detail="The AI profile generator is currently unavailable. Please try again later."
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Onboarding failed: {str(e)}"
        )
    
