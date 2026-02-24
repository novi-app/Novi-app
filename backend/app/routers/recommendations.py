from fastapi import APIRouter, HTTPException
from app.models.venue import RecommendationRequest
from app.services.recommendation_engine import get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.post("/top3")
async def get_recommendations_endpoint(request: RecommendationRequest):
    userid = request.user_id
    useremb = request.user_emb
    lat = request.location.lat
    lng = request.location.lng
    category = request.intent

    scored_venues = []
    try:
        top10 = get_recommendations(userid, useremb, lat, lng, category=category)

        for venue in top10:
            solo_score = venue.get("solo_score", 50) / 100.0
            sim_score = venue.get("similarity_score", 0.0)

            # Hybrid Scoring (60/40 Split)
            final_hybrid_score = (0.6 * sim_score) + (0.4 * solo_score)

            venue_copy = venue.copy()
            venue_copy["hybrid_score"] = round(final_hybrid_score, 4)
            
            scored_venues.append(venue_copy)

        # 4. Sort by our new hybrid_score descending and slice top 3
        scored_venues.sort(key=lambda x: x["hybrid_score"], reverse=True)
        top_3 = scored_venues[:3]

        return {"recommendations": top_3}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine failed: {str(e)}")