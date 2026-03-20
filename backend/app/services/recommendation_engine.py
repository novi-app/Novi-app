import threading
import numpy as np
from typing import List, Dict, Any, Optional
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta
from google.cloud.firestore_v1 import Query
from app.utils.firebase_client import get_db, get_user
from app.services.embedding_service import generate_session_embedding, generate_user_embedding

_trending_cache: Dict[str, Any] = {"data": None, "fetched_at": None}
_TRENDING_MEM_TTL_MINUTES = 10    # in-memory L1: avoids Firestore reads on hot path
_TRENDING_FS_TTL_HOURS = 6        # Firestore L2: persists across restarts and instances
_TRENDING_CACHE_DOC = ("cache", "trending")


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def get_recommendations(
    user_id: str,
    user_lat: float,
    user_lon: float,
    session_preferences: Optional[dict] = None,
    activity: str = "any",
    radius_km: float = 30.0,
    limit: int = 5
) -> List[Dict[str, Any]]:
    
    user_data = get_user(user_id)
    if not user_data:
        raise ValueError(f"User {user_id} not found")
    
    onboarding_prefs = user_data.get("preferences", {})
    budget = onboarding_prefs.get("budget", 2)
    
    db = get_db()
    query = db.collection("venues")
    
    if activity and activity != "any":
        query = query.where("activity", "==", activity)
    
    query = query.limit(1000)
    
    all_venues = []
    for doc in query.stream():
        venue_data = doc.to_dict()
        venue_data["doc_id"] = doc.id
        all_venues.append(venue_data)
    
    if not all_venues:
        return []
    
    if session_preferences:
        user_embedding = generate_session_embedding(onboarding_prefs, session_preferences)
    else:
        user_embedding = user_data.get("embedding")
        if not user_embedding:
            user_embedding = generate_user_embedding(onboarding_prefs)
    
    scored_venues = []
    
    for venue in all_venues:
        if "embedding" not in venue:
            continue
        
        location = venue.get("location", {})
        venue_lat = location.get("latitude") or location.get("lat")
        venue_lon = location.get("longitude") or location.get("lng")
        
        if not venue_lat or not venue_lon:
            continue
        
        distance = haversine_distance(user_lat, user_lon, venue_lat, venue_lon)
        
        if distance > radius_km:
            continue
        
        venue_price = venue.get("price_level", 0)
        if venue_price > budget + 1 and venue_price != 0:
            continue

        venue_embedding = venue.get("embedding", [])
        
        similarity = cosine_similarity(user_embedding, venue_embedding)
        
        if distance <= 5:
            distance_penalty = 0.0
        elif distance <= 15:
            distance_penalty = 0.1
        elif distance <= 30:
            distance_penalty = 0.2
        else:
            continue
        
        adjusted_score = similarity * (1 - distance_penalty)
        
        result = {
            "venue_id": venue.get("doc_id") or venue.get("place_id"),
            "name": venue.get("name"),
            "activity": venue.get("activity"),
            "category": venue.get("category"),
            "location": {
                "latitude": venue_lat,
                "longitude": venue_lon,
            },
            "address": venue.get("address"),
            "distance_km": round(distance, 2),
            "rating": venue.get("rating"),
            "reviews_count": venue.get("reviews_count", 0),
            "price_level": venue_price,
            "website": venue.get("website"),
            "phone": venue.get("phone"),
            "opening_hours": venue.get("opening_hours", {}),
            "photo": venue.get("photo"),
            "similarity_score": round(similarity, 4),
            "solo_score": venue.get("solo_score"),
            "solo_reason": venue.get("solo_reason"),
            "pro_tip": venue.get("pro_tip"),
            "tags": venue.get("tags", []),
            "combined_score": round(adjusted_score, 4),
        }
        scored_venues.append(result)
    
    scored_venues.sort(key=lambda x: x["combined_score"], reverse=True)
    
    return scored_venues[:limit]


def _fetch_trending_from_source(limit: int = 10) -> List[Dict[str, Any]]:
    """Run the full venues query — only called when both caches are stale."""
    db = get_db()
    docs = db.collection("venues") \
        .where("rating", ">=", 4.5) \
        .order_by("rating", direction=Query.DESCENDING) \
        .limit(limit * 3) \
        .stream()
    results = []
    for doc in docs:
        venue_data = doc.to_dict()
        if venue_data.get("reviews_count", 0) >= 100:
            venue_data["venue_id"] = doc.id
            results.append(venue_data)
            if len(results) >= limit:
                break
    return results


def _read_firestore_trending() -> Optional[Dict[str, Any]]:
    """Read from Firestore cache. Returns the doc dict or None if missing/stale."""
    try:
        col, doc_id = _TRENDING_CACHE_DOC
        doc = get_db().collection(col).document(doc_id).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        refreshed_at = data.get("refreshed_at")
        if not refreshed_at:
            return None
        if isinstance(refreshed_at, str):
            refreshed_at = datetime.fromisoformat(refreshed_at)
        if datetime.utcnow() - refreshed_at > timedelta(hours=_TRENDING_FS_TTL_HOURS):
            return None
        return data
    except Exception as e:
        print(f"[trending] Firestore cache read failed: {e}")
        return None


def _write_firestore_trending(venues: List[Dict[str, Any]]) -> None:
    try:
        col, doc_id = _TRENDING_CACHE_DOC
        get_db().collection(col).document(doc_id).set({
            "venues": venues,
            "refreshed_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        print(f"[trending] Firestore cache write failed: {e}")


def refresh_trending_cache(limit: int = 10) -> List[Dict[str, Any]]:
    """Recompute trending venues and update both caches. Safe to call from cron."""
    global _trending_cache
    results = _fetch_trending_from_source(limit)
    _trending_cache = {"data": results, "fetched_at": datetime.utcnow()}
    _write_firestore_trending(results)
    print(f"[trending] Cache refreshed — {len(results)} venues")
    return results


def warm_trending_cache() -> None:
    """Called at startup: pre-warms in-memory cache from Firestore, or triggers
    a background refresh if the Firestore cache is also stale."""
    global _trending_cache
    try:
        fs = _read_firestore_trending()
        if fs:
            _trending_cache = {"data": fs["venues"], "fetched_at": datetime.utcnow()}
            print(f"[trending] Cache pre-warmed from Firestore — {len(fs['venues'])} venues")
        else:
            print("[trending] Firestore cache stale — background refresh started")
            threading.Thread(target=refresh_trending_cache, daemon=True).start()
    except Exception as e:
        print(f"[trending] Warm failed: {e}")


def get_trending_venues(limit: int = 10) -> List[Dict[str, Any]]:
    global _trending_cache
    now = datetime.utcnow()

    # L1 — in-memory (10 min): zero-latency on hot path
    if (
        _trending_cache["data"] is not None
        and _trending_cache["fetched_at"] is not None
        and now - _trending_cache["fetched_at"] < timedelta(minutes=_TRENDING_MEM_TTL_MINUTES)
    ):
        return _trending_cache["data"][:limit]

    # L2 — Firestore (6 h): survives restarts and is shared across instances
    fs = _read_firestore_trending()
    if fs:
        _trending_cache = {"data": fs["venues"], "fetched_at": now}
        return fs["venues"][:limit]

    # L3 — full query + refresh both caches
    return refresh_trending_cache(limit)
