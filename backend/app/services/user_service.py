"""
User service - business logic for user operations.
"""
import uuid
from app.models.user import UserPreferences
from app.services.embedding_service import generate_user_embedding
from app.utils.firebase_client import save_user

def generate_user_id() -> str:
    """Generate user ID."""
    return f"usr_{uuid.uuid4().hex[:12]}"

def onboard_user(preferences: UserPreferences) -> dict:
    """
    Process user onboarding and save to Firestore.
    
    Args:
        preferences: User preferences from onboarding flow
    
    Returns:
        Dict with user_id, embedding, and status
    """
    user_id = generate_user_id()
    
    # 1. Generate user embedding from preferences
    preferences_dict = preferences.model_dump()
    user_embedding = generate_user_embedding(preferences_dict)

    # 2. Prepare the data payload for Firestore
    user_data = {
        "preferences": preferences_dict,
        "embedding": user_embedding
    }
    
    # 3. Save to Firestore
    save_user(user_id, user_data)
    
    # 4. Return the new ID and status
    return {
        "user_id": user_id,
        "status": "success"
    }