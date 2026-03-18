import json
import random
from pathlib import Path
from app.models.intervention import InterventionResponse

TEMPLATES_PATH = Path(__file__).parent.parent.parent / "data" / "intervention_templates.json"

def load_templates() -> dict:
    """Load intervention templates from JSON file."""
    try:
        with open(TEMPLATES_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"WARNING: Templates file not found at {TEMPLATES_PATH}")
        return {
            "general_nudge": [
                {"message_template": "Here's a great option for you."}
            ]
        }
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in templates file: {e}")
        return {
            "general_nudge": [
                {"message_template": "Here's a great option for you."}
            ]
        }


def generate_intervention(
    user_id: str, 
    trigger_type: str, 
    context: dict = None
) -> InterventionResponse:
    """
    Generate intervention message based on trigger type.
    
    Args:
        user_id: User identifier
        trigger_type: Type of freeze detected (exploration_stall, scroll_indecision, etc.)
        context: Additional context including venue_name
    
    Returns:
        InterventionResponse with formatted message
    """
    templates = load_templates()
    
    # Fallback to general_nudge if trigger_type not found
    if trigger_type not in templates:
        print(f"WARNING: Unknown trigger_type '{trigger_type}', using tab_switching")
        trigger_type = "tab_switching"
    
    template_options = templates[trigger_type]
    selected = random.choice(template_options)
    
    message = selected["message_template"]
    
    # Format message with venue_name if provided
    if context and "venue_name" in context:
        try:
            message = message.format(venue_name=context["venue_name"])
        except KeyError as e:
            print(f"WARNING: Failed to format message with venue_name: {e}")
            # Keep unformatted message as fallback
    
    return InterventionResponse(
        user_id=user_id,
        trigger_type=trigger_type,
        message=message
    )
