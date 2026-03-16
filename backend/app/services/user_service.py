import uuid
from datetime import datetime
from app.models.user import UserPreferences
from app.services.embedding_service import generate_user_embedding
from app.utils.firebase_client import get_db

def generate_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"

def onboard_user(username: str, preferences: UserPreferences) -> dict:
    user_id = generate_user_id()

    preferences_dict = preferences.model_dump()

    user_embedding = generate_user_embedding(preferences_dict)

    user_data = {
        "user_id": user_id,
        "username": username,
        "preferences": preferences_dict,
        "embedding": user_embedding,
        "saved_venues": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    db = get_db()
    db.collection("users").document(user_id).set(user_data)
    
    return {
        "user_id": user_id,
        "status": "success"
    }
