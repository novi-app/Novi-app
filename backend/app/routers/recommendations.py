from fastapi import APIRouter, HTTPException
from app.models.venue import RecommendationRequest
from app.services.recommendation_engine import get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("")
async def get_venue_recommendations(request: RecommendationRequest):
    """
    Get personalized venue recommendations for a user.
    
    Request body:
    {
        "user_id": "user_abc123",
        "location": {"lat": 35.6762, "lng": 139.6503},
        "intent": "restaurant"  // or "cafe", "bar", "any"
    }
    
    Returns top 3 venue recommendations based on:
    - Semantic similarity (user preferences vs venue attributes)
    - Solo-friendliness score
    - Distance from user location
    """
    try:
        recommendations = get_recommendations(
            user_id=request.user_id,
            user_lat=request.location.lat,
            user_lon=request.location.lng,
            intent=request.intent,
            radius_km=5.0,
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
    