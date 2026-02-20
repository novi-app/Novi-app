import uuid

def onboard_user(preferences: dict):
    temp_user_id = f"temp_{uuid.uuid4().hex[:12]}"

    return {
        "user_id": temp_user_id,
        "preferences": preferences
    }