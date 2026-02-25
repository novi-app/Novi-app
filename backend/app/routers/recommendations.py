from fastapi import APIRouter, HTTPException
from app.models.venue import RecommendationRequest
from app.services.recommendation_engine import get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("")
async def get_venue_recommendations(request: RecommendationRequest):
    """
    Get personalized venue recommendations.
    
    Supports optional session preferences for live weighting:
    - 60% weight on session (current mood/vibe)
    - 40% weight on onboarding (stable preferences)
    
    Request body:
    {
        "user_id": "user_abc123",
        "location": {"lat": 35.6762, "lng": 139.6503},
        "intent": "restaurant",
        "session_preferences": {  // Optional
            "vibe": ["lively"],
            "mood": "spontaneous",
            "budget": 3  // Override onboarding budget
        }
    }
    """
    try:
        recommendations = get_recommendations(
            user_id=request.user_id,
            user_lat=request.location.lat,
            user_lon=request.location.lng,
            session_preferences=request.session_preferences,
            intent=request.intent,
            radius_km=50.0,
            limit=3
        )
        
        return {
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )
    