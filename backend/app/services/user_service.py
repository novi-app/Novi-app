"""
User service - business logic for user operations.
"""
import uuid
from app.models.user import UserPreferences
from app.services.embedding_service import generate_user_embedding

def generate_temp_user_id() -> str:
    """Generate temporary user ID."""
    return f"temp_{uuid.uuid4().hex[:12]}"

def onboard_user(preferences: UserPreferences) -> dict:
    """
    Process user onboarding.
    
    Args:
        preferences: User preferences from onboarding flow
    
    Returns:
        Dict with user_id, embedding, and status
    
    Note:
        Generates embedding but doesn't save to DB yet.
        Full implementation in [BACK-007] will save to Firebase.
    """
    temp_user_id = generate_temp_user_id()
    
    # Generate user embedding from preferences
    preferences_dict = preferences.model_dump()
    user_embedding = generate_user_embedding(preferences_dict)
    
    return {
        "user_id": temp_user_id,
        "embedding": user_embedding,
        "status": "success"
    }
