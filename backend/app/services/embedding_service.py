from openai import OpenAI
from config import settings
from typing import List

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def create_embedding_text(dietary: List[str] = None, vibe: List[str] = None, mood: str = None) -> str:
    parts = []
    
    if dietary:
        parts.extend(dietary)
    
    if vibe:
        parts.extend(vibe)
    
    if mood:
        parts.append(mood)
    
    return " ".join(parts).strip()


def generate_embedding(text: str) -> List[float]:
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {e}")


def generate_user_embedding(preferences: dict) -> List[float]:
    dietary = preferences.get("dietary", [])
    text = create_embedding_text(dietary=dietary)
    
    if not text:
        text = "exploring Tokyo"
    
    return generate_embedding(text)


def generate_session_embedding(onboarding_preferences: dict, session_preferences: dict) -> List[float]:
    dietary = onboarding_preferences.get("dietary", [])
    vibe = session_preferences.get("vibe", [])
    mood = session_preferences.get("mood")
    
    text = create_embedding_text(dietary=dietary, vibe=vibe, mood=mood)
    
    if not text:
        text = "exploring Tokyo"
    
    return generate_embedding(text)
