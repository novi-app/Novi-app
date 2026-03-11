import numpy as np
import logging
from app.utils.firebase_client import get_user, get_db
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

# Define our nudging weights
NUDGE_WEIGHTS = {
    "directions_clicked": 0.05,
    "route_check": 0.05,
    "external_link_opened": 0.03,
    "recommendation_details_viewed": 0.03,
    "venue_view": 0.02,
    "recommendation_card_clicked": 0.02
}

def apply_embedding_nudge(user_id: str, venue_id: str, event_type: str):
    """
    Pulls the user's embedding slightly closer to the venue's embedding 
    based on the strength of the interaction.
    """
    weight = NUDGE_WEIGHTS.get(event_type)
    if not weight:
        return # Not an event we care about nudging
        
    db = get_db()
    
    # 1. Fetch User and Venue
    with ThreadPoolExecutor(max_workers=2) as executor:
        user_future = executor.submit(db.collection("users").document(user_id).get)
        venue_future = executor.submit(db.collection("venues").document(venue_id).get)
        user_doc = user_future.result()
        venue_doc = venue_future.result()
    
    if not user_doc.exists or not venue_doc.exists:
        return
        
    user_data = user_doc.to_dict()
    venue_data = venue_doc.to_dict()
    
    user_emb = user_data.get("embedding")
    venue_emb = venue_data.get("embedding")
    
    if not user_emb or not venue_emb:
        return
        
    # 2. Vector Math (The Nudge)
    v_user = np.array(user_emb, dtype=np.float32)
    v_venue = np.array(venue_emb, dtype=np.float32)
    
    # Weighted combination
    v_new = ((1.0 - weight) * v_user) + (weight * v_venue)
    
    # Normalize back to unit length (Crucial for Cosine Similarity)
    norm = np.linalg.norm(v_new)
    if norm > 0:
        v_new = v_new / norm
        
    # 3. Save back to Firestore
    db.collection("users").document(user_id).update({
        "embedding": v_new.tolist()
    })
    logger.info(f"Successfully nudged user {user_id} towards venue {venue_id} (Weight: {weight})")