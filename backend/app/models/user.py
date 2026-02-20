from pydantic import BaseModel
from typing import Dict, Any

class OnboardRequest(BaseModel):
    preferences: Dict[str, Any]