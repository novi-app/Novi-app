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
        
        # Note: We're returning the embedding for now to show it works
        # In production, we'd save to DB and NOT return the embedding
        # (it's 1536 numbers, too large for API response)
        
        return {
            "user_id": result["user_id"],
            "status": result["status"],
            "embedding_preview": result["embedding"][:5],  # Just first 5 for testing
            "embedding_dimensions": len(result["embedding"])
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Onboarding failed: {str(e)}"
        )
    