"""
Embedding generation service.
Converts text to vector embeddings using OpenAI.
"""
from openai import OpenAI
from config import settings
from typing import List

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def preferences_to_text(preferences: dict) -> str:
    """
    Convert user preferences dict to text string for embedding.
    
    Args:
        preferences: User preferences from onboarding
        
    Returns:
        Text representation of preferences
        
    Example:
        Input: {
            "dietary": ["vegetarian"],
            "budget": "moderate",
            "vibes": ["authentic", "quiet"],
            "travel_style": "slow_explorer"
        }
        Output: "vegetarian moderate authentic quiet slow_explorer"
    """
    parts = []
    
    # Add dietary preferences
    if preferences.get("dietary"):
        parts.extend(preferences["dietary"])
    
    # Add budget
    if preferences.get("budget"):
        parts.append(preferences["budget"])
    
    # Add vibes
    if preferences.get("vibes"):
        parts.extend(preferences["vibes"])
    
    # Add travel style
    if preferences.get("travel_style"):
        parts.append(preferences["travel_style"])
    
    # Join with spaces
    text = " ".join(parts)
    return text

def generate_user_embedding(preferences: dict) -> List[float]:
    """
    Generate embedding vector from user preferences.
    
    Args:
        preferences: User preferences dict from onboarding
        
    Returns:
        List of 1536 floats (embedding vector)
        
    Raises:
        Exception: If OpenAI API call fails
    
    """
    # Convert preferences to text
    text = preferences_to_text(preferences)
    
    # Generate embedding via OpenAI
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        
        # Extract embedding from response
        embedding = response.data[0].embedding
        
        return embedding
        
    except Exception as e:
        raise Exception(f"Failed to generate user embedding: {e}")

def generate_text_embedding(text: str) -> List[float]:
    """
    Generate embedding from raw text string.
    
    Useful for: venue descriptions, search queries, etc.
    
    Args:
        text: Any text string
        
    Returns:
        List of 1536 floats (embedding vector)
    """
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
        
    except Exception as e:
        raise Exception(f"Failed to generate text embedding: {e}")
