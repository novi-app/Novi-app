"""
Recommendation engine - core matching logic.
Computes similarity between user and venue embeddings.
"""
import math
import numpy as np
from typing import Dict, Any, List, Optional
from app.utils.firebase_client import get_user, get_venues
from app.services.embedding_service import generate_session_embedding


def cosine_similarity(user_vec: List[float], venue_vec: List[float]) -> float:
    """Calculate cosine similarity between two embedding vectors."""
    v1 = np.array(user_vec, dtype=np.float32)
    v2 = np.array(venue_vec, dtype=np.float32)
    
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return float(dot_product / (norm1 * norm2))


def haversine_distance(
    user_lat: float,
    user_lon: float,
    venue_lat: float,
    venue_lon: float
) -> float:
    """Calculate distance between two lat/lon points in kilometers."""
    R = 6371.0  # Earth radius in km

    lat1_rad = math.radians(user_lat)
    lon1_rad = math.radians(user_lon)
    lat2_rad = math.radians(venue_lat)
    lon2_rad = math.radians(venue_lon)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def get_recommendations(
    user_id: str,
    user_lat: float,
    user_lon: float,
    session_preferences: Optional[dict] = None,
    intent: str = "any",
    radius_km: float = 50.0,
    limit: int = 3
) -> List[Dict[str, Any]]:
    """
    Get top N venue recommendations based on semantic similarity and location.
    
    Args:
        user_id: User's ID (to load their embedding)
        user_lat: User's latitude
        user_lon: User's longitude
        session_preferences: Optional live session data (vibe, intent, mood, budget override)
        intent: Category filter (e.g., "restaurant", "cafe")
        radius_km: Maximum distance from user location
        limit: Number of recommendations to return
        
    Returns:
        List of venue dicts sorted by match score
        
    Raises:
        ValueError: If user not found or missing embedding
    """
    # 1. Load user data
    user_data = get_user(user_id)
    if not user_data or "embedding" not in user_data:
        raise ValueError(f"User {user_id} not found or missing embedding")
    
    # 2. Determine budget limit
    user_budget = user_data.get("preferences", {}).get("budget", 2)  # Default moderate
    if session_preferences and session_preferences.get("budget"):
        user_budget = session_preferences["budget"]  # Session override
    
    # 3. Generate embedding (with session weighting if provided)
    if session_preferences:
        onboarding_embedding = user_data["embedding"]
        user_embedding = generate_session_embedding(
            onboarding_embedding,
            session_preferences,
            onboarding_weight=0.4,
            session_weight=0.6
        )
    else:
        user_embedding = user_data["embedding"]

    # 4. Load venues (with optional category filter)
    category = None if intent == "any" else intent
    all_venues = get_venues(limit=100, category=category)
    
    scored_venues = []

    # 5. Filter by distance, budget, and compute similarity
    for venue in all_venues:
        # Check location exists
        venue_lat = venue.get("location", {}).get("lat")
        venue_lon = venue.get("location", {}).get("lng")
        if venue_lat is None or venue_lon is None:
            continue
        
        # Filter by distance
        distance = haversine_distance(user_lat, user_lon, venue_lat, venue_lon)
        if distance > radius_km:
            continue
        
        # Filter by budget
        # Allow price_level=0 (unknown/free) to pass through
        # Otherwise filter venues above user's budget
        venue_price = venue.get("price_level", 0)
        if venue_price > user_budget and venue_price != 0:
            continue
        
        # Check embedding exists
        venue_embedding = venue.get("embedding")
        if not venue_embedding:
            continue
        
        # Compute similarity
        similarity = cosine_similarity(user_embedding, venue_embedding)
        
        # Combine with solo score (60% similarity, 40% solo score)
        solo_score = venue.get("solo_score", 50) / 100.0  # Normalize to 0-1
        combined_score = (0.6 * similarity) + (0.4 * solo_score)
        
        result = {
            "venue_id": venue.get("doc_id") or venue.get("place_id"),
            "name": venue.get("name"),
            "category": venue.get("category"),
            "location": {
                "lat": venue_lat,
                "lng": venue_lon,
            },
            "address": venue.get("address"),
            "distance_km": round(distance, 2),
            "rating": venue.get("rating"),
            "price_level": venue_price,
            "similarity_score": round(similarity, 4),
            "solo_score": venue.get("solo_score"),
            "solo_reason": venue.get("solo_reason"),
            "pro_tip": venue.get("pro_tip"),
            "combined_score": round(combined_score, 4),
        }
        scored_venues.append(result)

    # 6. Sort by combined score and return top N
    scored_venues.sort(key=lambda x: x["combined_score"], reverse=True)
    
    return scored_venues[:limit]
