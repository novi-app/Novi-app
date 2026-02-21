from fastapi import APIRouter, HTTPException
from app.models.user import OnboardingRequest, OnboardingResponse
from app.services.user_service import onboard_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.post("/onboard", response_model=OnboardingResponse)
async def onboard_user_endpoint(request: OnboardingRequest):
    """
    Create user profile (stub implementation).
    
    Currently generates temporary user_id without saving to database.
    Full implementation in [BACK-007] will:
    - Generate user embedding from preferences
    - Save user + embedding to Firebase
    - Return permanent user_id
    """
    try:
        result = onboard_user(request.preferences)
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Onboarding failed: {str(e)}"
        )
    