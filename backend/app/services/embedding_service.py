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
    
    # Budget (onboarding or session override)
    if preferences.get("budget"):
        budget_text_map = {
            1: "budget-friendly affordable inexpensive",
            2: "moderate reasonably-priced mid-range",
            3: "upscale premium expensive"
        }
        budget_val = preferences["budget"]
        if budget_val in budget_text_map:
            parts.append(budget_text_map[budget_val])
    
    # Activity preferences (onboarding)
    if preferences.get("activity_preference"):
        parts.extend(preferences["activity_preference"])
    
    # Session-specific fields (home screen)
    if preferences.get("vibe"):
        parts.extend(preferences["vibe"])
    
    if preferences.get("intent"):
        parts.append(preferences["intent"])
    
    if preferences.get("mood"):
        parts.append(preferences["mood"])
    
    if preferences.get("timing"):
        parts.append(preferences["timing"])
    
    return " ".join(parts)


def generate_text_embedding(text: str) -> List[float]:
    """Generate embedding from raw text string."""
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
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


def combine_embeddings_weighted(
    onboarding_embedding: List[float],
    session_embedding: List[float],
    onboarding_weight: float = 0.4,
    session_weight: float = 0.6
) -> List[float]:
    """
    Combine two embeddings with weighted averaging.
    60% session (live) + 40% onboarding (stable)
    """
    vec_onboarding = np.array(onboarding_embedding, dtype=np.float32)
    vec_session = np.array(session_embedding, dtype=np.float32)
    
    combined = (onboarding_weight * vec_onboarding) + (session_weight * vec_session)
    
    return combined.tolist()


def generate_session_embedding(
    onboarding_embedding: List[float],
    session_preferences: dict,
    onboarding_weight: float = 0.4,
    session_weight: float = 0.6
) -> List[float]:
    """
    Generate embedding for current session, weighted with onboarding.
    """
    session_text = preferences_to_text(session_preferences)
    session_embedding = generate_text_embedding(session_text)
    
    return combine_embeddings_weighted(
        onboarding_embedding,
        session_embedding,
        onboarding_weight,
        session_weight
    )
