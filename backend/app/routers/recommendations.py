from fastapi import APIRouter, HTTPException
from app.models.venue import RecommendationRequest
from app.services.recommendation_engine import get_recommendations, get_trending_venues

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("")
async def get_venue_recommendations(request: RecommendationRequest):
    try:
        recommendations = get_recommendations(
            user_id=request.user_id,
            user_lat=request.location.latitude,
            user_lon=request.location.longitude,
            session_preferences=request.session_preferences,
            activity=request.activity,
            radius_km=30.0,
            limit=5
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


@router.get("/trending")
async def get_trending():
    try:
        venues = get_trending_venues(limit=10)
        return {
            "venues": venues,
            "count": len(venues)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trending venues: {str(e)}"
        )
    