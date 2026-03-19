import hashlib
from datetime import datetime, timedelta
from openai import OpenAI
from config import settings
from typing import Dict, List, Tuple

client = OpenAI(api_key=settings.OPENAI_API_KEY)

_embedding_cache: Dict[str, Tuple[List[float], datetime]] = {}
_EMBEDDING_TTL_HOURS = 1


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

    cache_key = hashlib.sha256(
        f"{sorted(dietary)}|{sorted(vibe)}|{mood}".encode()
    ).hexdigest()

    now = datetime.utcnow()
    if cache_key in _embedding_cache:
        embedding, cached_at = _embedding_cache[cache_key]
        if now - cached_at < timedelta(hours=_EMBEDDING_TTL_HOURS):
            return embedding

    text = create_embedding_text(dietary=dietary, vibe=vibe, mood=mood)
    if not text:
        text = "exploring Tokyo"

    embedding = generate_embedding(text)
    _embedding_cache[cache_key] = (embedding, now)
    return embedding
