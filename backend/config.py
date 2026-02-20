# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_PLACES_API_KEY: str
    OPENAI_API_KEY: str
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# How To Use:
# Whenever you need a variable in the app,
# you simply write: from config import settings. at the head of the file
# and for key calling: settings.OPENAI_API_KEY or settings.GOOGLE_PLACES_API_KEY