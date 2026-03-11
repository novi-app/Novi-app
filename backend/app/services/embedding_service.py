"""
Embedding generation service.
Converts text to vector embeddings using OpenAI.
Supports weighted combination of onboarding + session preferences.
"""
from openai import OpenAI
from config import settings
from typing import List
import numpy as np

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def preferences_to_text(preferences: dict) -> str:
    """
    Convert user preferences dict to text string for embedding.
    Handles both onboarding and session preferences.
    
    Args:
        preferences: User preferences dict
        
    Returns:
        Text representation of preferences
    """
    parts = []
    
    # Dietary preferences (onboarding)
    if preferences.get("dietary"):
        parts.extend(preferences["dietary"])
        
    # Activity preferences (onboarding)
    if preferences.get("activity_preference"):
        parts.extend(preferences["activity_preference"])
    
    # Session-specific fields (home screen)
    if preferences.get("vibe"):
        parts.extend(preferences["vibe"])
        
    if preferences.get("mood"):
        parts.append(preferences["mood"])
        
    return " ".join(parts)


def generate_text_embedding(text: str) -> List[float]:
    """Generate embedding from raw text string."""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate text embedding: {e}")


def generate_user_embedding(preferences: dict) -> List[float]:
    """
    Generate embedding vector from user preferences.
    """
    text = preferences_to_text(preferences)
    return generate_text_embedding(text)

def generate_session_embedding(
    onboarding_prefs: dict,
    session_prefs: dict,
) -> List[float]:
    """
    Generate embedding for current session, weighted with onboarding.
    """
    onboarding_text = preferences_to_text(onboarding_prefs)  # e.g. "halal adventure"
    session_text = preferences_to_text(session_prefs)         # e.g. "cozy relaxed"
    
    # 60/40 weighting via repetition in unified text(repetition works as a proxy for importance)
    combined_text = f"{session_text} {session_text} {session_text} {onboarding_text} {onboarding_text}"
    return generate_text_embedding(combined_text)
