import math
import numpy as np
from typing import Dict, Any, List, Optional
from app.utils.firebase_client import get_user, get_venues


def cosine_similarity(user_vec: List[float], venue_vec: List[float]) -> float:
    """
    Calculate the cosine similarity between two vectors.
    Returns a score between -1.0 and 1.0 (higher is more similar).
    """
    # Convert lists to numpy arrays for fast computation
    v1 = np.array(user_vec)
    v2 = np.array(venue_vec)
    
    # Calculate dot product and magnitudes
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return float(dot_product / (norm1 * norm2))


def haversine_distance(user_lat: float, user_lon: float, venue_lat: float, venue_lon: float) -> float:
    """
    Calculate distance between two lat/lon points in kilometers using haversine_distance.
    """
    R = 6371.0 # Radius of Earth in kilometers

    lat1_rad = math.radians(user_lat)
    lon1_rad = math.radians(user_lon)
    lat2_rad = math.radians(venue_lat)
    lon2_rad = math.radians(venue_lon)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def get_recommendations(
    user_id: str,
    user_emb: str,
    user_lat: float, 
    user_lon: float, 
    radius_km: float = 5.0,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get top 10 venue recommendations for a user based on embedding similarity and location.
    """
    # 1. Load User
    user_embedding = user_emb
    # user_data = get_user(user_id)
    # if not user_data or "embedding" not in user_data:
    #     raise ValueError(f"User {user_id} not found or missing embedding.")
    
    # user_embedding = user_data["embedding"]

    # 2. Load Venues
    # We fetch more than 50 because many might be filtered out by distance and category
    all_venues = get_venues(limit=80, category=category) 
    scored_venues = []

    # 3. Filter and Score
    for venue in all_venues:
        # Location & Distance Check
        venue_lat = venue.get("location", {}).get("lat")
        venue_lon = venue.get("location", {}).get("lng")
        if venue_lat is None or venue_lon is None:
            continue
        
        distance = haversine_distance(user_lat, user_lon, venue_lat, venue_lon)     
        if distance > radius_km:
            continue
            
        # Similarity Check
        venue_embedding = venue.get("embedding")
        if not venue_embedding:
            continue
            
        similarity_score = cosine_similarity(user_embedding, venue_embedding)
        
        result = {
            "venue_id": venue.get("doc_id") or venue.get("place_id"),
            "name": venue.get("name"),
            "category": venue.get("category"),
            "distance_km": round(distance, 2),
            "similarity_score": round(similarity_score, 4),
            "solo_score": venue.get("solo_score"),
            "pro_tip": venue.get("pro_tip")
        }
        scored_venues.append(result)

    # 4. Sort and Return Top 10
    # Sort descending by similarity_score
    scored_venues.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return scored_venues[:10]