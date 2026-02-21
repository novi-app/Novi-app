from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    
    Required variables (will raise error if missing):
    - OPENAI_API_KEY
    - GOOGLE_PLACES_API_KEY
    
    Optional variables (have defaults):
    - ENVIRONMENT (default: "development")
    - API_HOST (default: "0.0.0.0")
    - API_PORT (default: 8000)
    """
    
    # Required API keys
    OPENAI_API_KEY: str
    GOOGLE_PLACES_API_KEY: str
    
    # Firebase credentials (one of these required)
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-service-account.json"
    FIREBASE_CREDENTIALS_BASE64: Optional[str] = None
    
    # Optional configuration
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra env vars not defined here
        case_sensitive=True
    )

# Singleton instance
settings = Settings()
