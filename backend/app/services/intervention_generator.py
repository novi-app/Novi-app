import json
import random
from pathlib import Path
from app.models.intervention import InterventionResponse

TEMPLATES_PATH = Path(__file__).parent.parent.parent / "data" / "intervention_templates.json"

def load_templates() -> dict:
    with open(TEMPLATES_PATH, "r") as f:
        return json.load(f)

def generate_intervention(user_id: str, trigger_type: str, context: dict = None) -> InterventionResponse:
    templates = load_templates()
    
    if trigger_type not in templates:
        trigger_type = "general_nudge"
    
    template_options = templates[trigger_type]
    selected = random.choice(template_options)
    
    message = selected["message_template"]
    
    return InterventionResponse(
        user_id=user_id,
        trigger_type=trigger_type,
        message=message
    )
