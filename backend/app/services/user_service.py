"""
User service - business logic for user operations.
"""
import uuid
from datetime import datetime
from app.models.user import UserPreferences
from app.services.embedding_service import generate_user_embedding
from app.utils.firebase_client import get_db

def generate_user_id() -> str:
    """Generate user ID."""
    return f"user_{uuid.uuid4().hex[:12]}"

def onboard_user(preferences: UserPreferences) -> dict:
    """
    Process user onboarding and save to Firestore.
    
    Args:
        preferences: User preferences from onboarding flow
    
    Returns:
        Dict with user_id and status
    """
    # Generate user ID
    user_id = generate_user_id()

    # Convert preferences to dict
    preferences_dict = preferences.model_dump()

    # Generate user embedding from preferences
    user_embedding = generate_user_embedding(preferences_dict)

    # Prepare the data payload for Firestore
    user_data = {
        "user_id": user_id,
        "preferences": preferences_dict,
        "embedding": user_embedding,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    # Save to Firestore
    db = get_db()
    db.collection("users").document(user_id).set(user_data)
    
    # Return the new user ID and status
    return {
        "user_id": user_id,
        "status": "success"
    }
