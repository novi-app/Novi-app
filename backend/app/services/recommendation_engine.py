"""
Recommendation engine - core matching logic.
Computes similarity between user and venue embeddings.
"""
import math
import zoneinfo
import numpy as np
from datetime import datetime
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

def is_open_for_next_hour(periods: list) -> bool:
    """
    Checks if a venue is open right now AND remains open for at least 1 more hour.
    Calculated using Tokyo Standard Time (JST).
    """
    if not periods:
        # If no hours are provided, assume it's open
        return True 

    # 1. Get current time in Tokyo
    tokyo_tz = zoneinfo.ZoneInfo("Asia/Tokyo")
    now = datetime.now(tokyo_tz)
    
    # Convert Python's weekday (1=Mon, 7=Sun) to Google's format (0=Sun, 1=Mon... 6=Sat)
    current_day = now.isoweekday() % 7 
    current_time_minutes = (now.hour * 60) + now.minute
    
    # 2. Loop through the venue's open periods
    for period in periods:
        open_data = period.get("open", {})
        close_data = period.get("close", {})
        
        # Check if it's open 24/7 (Google represents this as day 0, time 00:00 with no close)
        if open_data.get("day") == 0 and open_data.get("hour") == 0 and not close_data:
            return True
            
        open_day = open_data.get("day")
        close_day = close_data.get("day")
        
        open_minutes = (open_data.get("hour", 0) * 60) + open_data.get("minute", 0)
        close_minutes = (close_data.get("hour", 0) * 60) + close_data.get("minute", 0)

        # Case A: Standard same-day hours (e.g., 09:00 to 17:00)
        if open_day == current_day and open_day == close_day:
            if open_minutes <= current_time_minutes:
                # Is the close time at least 60 minutes away?
                if (close_minutes - current_time_minutes) >= 60:
                    return True

        # Case B: Late-night hours crossing midnight (Checking BEFORE midnight)
        elif open_day == current_day and close_day == (current_day + 1) % 7:
            if current_time_minutes >= open_minutes:
                # Calculate time until close tomorrow
                minutes_until_close = ((24 * 60) - current_time_minutes) + close_minutes
                if minutes_until_close >= 60:
                    return True
                    
        # Case C: Late-night hours crossing midnight (Checking AFTER midnight)
        elif close_day == current_day and open_day == (current_day - 1) % 7:
            if current_time_minutes < close_minutes:
                # Is the close time at least 60 minutes away?
                if (close_minutes - current_time_minutes) >= 60:
                    return True

    return False

def compute_composite_score(similarity: float, distance_km: float, radius_km: float) -> float:
    # Normalize distance to [0, 1] where 0 = far, 1 = nearby
    proximity_score = 1.0 - (distance_km / radius_km)
    
    # Weighted blend: 80% semantic match, 20% proximity
    return (0.8 * similarity) + (0.2 * proximity_score)

def get_recommendations(
    user_id: str,
    user_lat: float,
    user_lon: float,
    session_preferences: Optional[dict] = None,
    activity: str = "any",
    radius_km: float = 50.0,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get top N venue recommendations based on semantic similarity and location.
    
    Args:
        user_id: User's ID (to load their embedding)
        user_lat: User's latitude
        user_lon: User's longitude
        session_preferences: Optional live session data (vibe, activity, mood, budget)
        activity: Activity filter (e.g., "food", "drinks")
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
        
    # 2. Generate embedding (with session weighting if provided)
    if session_preferences:
        onboarding_preferences = user_data["preferences"]
        user_embedding = generate_session_embedding(
            onboarding_preferences,
            session_preferences,
        )

        budget_val = session_preferences.get("budget")
        if budget_val is not None:
            # User's budget -- Keep it 0 to strictly search for free options.
            # Otherwise, increase by 1 for better seaching results
            budget = 0 if budget_val == 0 else budget_val + 1

    else:
        user_embedding = user_data["embedding"]
        budget = 3

    # 3. Load venues (with optional activity filter)
    activity = None if activity == "any" else activity
    all_personalized_venues = get_venues(user_lat, user_lon, activity, radius_km, budget)
    
    scored_venues = []

    # 4. Filter by distance, budget, and compute similarity
    for venue in all_personalized_venues:
        # Check location exists
        venue_lat = venue.get("location", {}).get("latitude")
        venue_lon = venue.get("location", {}).get("longitude")
        if venue_lat is None or venue_lon is None:
            continue

        # --- Filter by Time (Closing soon) ---
        opening_hours_data = venue.get("regular_opening_hours", {})
        periods = opening_hours_data.get("periods", []) if isinstance(opening_hours_data, dict) else opening_hours_data
        
        if not is_open_for_next_hour(periods):
            continue
        # -------------------------------------
        
        # --- Filter by distance ---
        distance = haversine_distance(user_lat, user_lon, venue_lat, venue_lon)
        if distance > radius_km:
            continue
        # --------------------------
                
        # --- Compute similarity ---
        venue_embedding = venue.get("embedding")
        if not venue_embedding:
            continue
        
        similarity = cosine_similarity(user_embedding, venue_embedding)
        # --------------------------
        
        result = {
            "venue_id": venue.get("doc_id") or venue.get("place_id"),
            "name": venue.get("name"),
            "activity": venue.get("activity"),
            "category": venue.get("category"),
            "location": {
                "lat": venue_lat,
                "lng": venue_lon,
            },
            "address": venue.get("address"),
            "distance_km": round(distance, 2),
            "rating": venue.get("rating"),
            "price_level": venue.get("price_level"),
            "similarity_score": round(similarity, 4),
            "solo_score": venue.get("solo_score"),
            "solo_reason": venue.get("solo_reason"),
            "pro_tip": venue.get("pro_tip"),
        }
        scored_venues.append(result)

    # 5. Sort venues by similarity score and distance
    scored_venues.sort(
        key=lambda venue: compute_composite_score(venue["similarity_score"], venue["distance_km"], radius_km),
        reverse=True
    )
    
    return scored_venues[:limit]
