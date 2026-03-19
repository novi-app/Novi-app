import json
import random
from pathlib import Path
from app.models.intervention import InterventionResponse
from app.data.intervention_templates import INTERVENTION_TEMPLATES


def generate_intervention(
    user_id: str, 
    trigger_type: str, 
    context: dict = None
) -> InterventionResponse:

    templates = INTERVENTION_TEMPLATES
    
    if trigger_type not in templates:
        print(f"WARNING: Unknown trigger_type '{trigger_type}', using tab_switching")
        trigger_type = "tab_switching"
    
    template_options = templates[trigger_type]
    selected = random.choice(template_options)
    
    message = selected["message_template"]
    
    if context and "venue_name" in context:
        try:
            message = message.format(venue_name=context["venue_name"])
        except KeyError as e:
            print(f"WARNING: Failed to format message with venue_name: {e}")
    
    return InterventionResponse(
        user_id=user_id,
        trigger_type=trigger_type,
        message=message
    )
