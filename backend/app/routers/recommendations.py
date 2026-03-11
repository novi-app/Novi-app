from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from app.models.venue import RecommendationRequest
from app.services.recommendation_engine import get_recommendations
from app.utils.firebase_client import get_db

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
        "activity": "food",
        "session_preferences": {  // Optional
            "vibe": ["lively"],
            "mood": ["spontaneous"],
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
            activity=request.activity,
            radius_km=50.0,
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
async def get_trending_venues():
    """
    Get top 5 trending Tokyo venues by solo_score.
    """
    try:
        db = get_db()
        query = db.collection("venues").order_by(
            "solo_score",
            direction=firestore.Query.DESCENDING
        )

        trending = []

        for snap in query.stream():
            venue = snap.to_dict() or {}
            venue.setdefault("doc_id", snap.id)

            venue_lat = venue.get("location", {}).get("latitude")
            venue_lng = venue.get("location", {}).get("longitude")
            if venue_lat is None or venue_lng is None:
                continue

            raw_solo_score = venue.get("solo_score")
            solo_score = raw_solo_score if isinstance(raw_solo_score, (int, float)) else 0

            trending.append({
                "venue_id": venue.get("doc_id") or venue.get("place_id"),
                "name": venue.get("name"),
                "category": venue.get("category"),
                "location": {
                    "lat": venue_lat,
                    "lng": venue_lng,
                },
                "address": venue.get("address"),
                "distance_km": 0.0,
                "rating": venue.get("rating"),
                "price_level": venue.get("price_level", 0),
                "solo_score": solo_score,
                "solo_reason": venue.get("solo_reason"),
                "pro_tip": venue.get("pro_tip"),
            })

            if len(trending) == 5:
                break

        return {
            "recommendations": trending,
            "count": len(trending)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trending recommendations: {str(e)}"
        )
    
