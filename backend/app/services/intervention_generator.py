"""
Intervention generation service.
Selects a trigger-specific template and personalizes it with context.
"""
import random
import logging
from collections.abc import Mapping
from typing import Any

from app.data.intervention_templates import DEFAULT_TRIGGER_TYPE, INTERVENTION_TEMPLATES

logger = logging.getLogger(__name__)

def _extract_venue_name(context: Mapping[str, Any] | None) -> str:
    """Resolve the best venue name from request context for message personalization."""
    if not context:
        return "this venue"

    direct_name = context.get("venue_name")
    if isinstance(direct_name, str) and direct_name.strip():
        return direct_name.strip()

    selected_venue = context.get("selected_venue")
    if isinstance(selected_venue, Mapping):
        selected_name = selected_venue.get("name") or selected_venue.get("title")
        if isinstance(selected_name, str) and selected_name.strip():
            return selected_name.strip()

    venues_viewed = context.get("venues_viewed")
    if isinstance(venues_viewed, list) and venues_viewed:
        first_item = venues_viewed[0]
        # Support either a list of names or a list of venue objects.
        if isinstance(first_item, str) and first_item.strip():
            return first_item.strip()
        if isinstance(first_item, Mapping):
            first_name = first_item.get("name") or first_item.get("title")
            return first_name.strip()

    return "this venue"


def _choose_template(trigger_type: str) -> tuple[str, dict[str, str]]:
    """Pick one random template from the matching trigger type (with fallback)."""
    trigger = trigger_type.strip().lower() if trigger_type else ""
    template_key = trigger if trigger in INTERVENTION_TEMPLATES else DEFAULT_TRIGGER_TYPE
    template = random.choice(INTERVENTION_TEMPLATES[template_key])
    return template_key, template


def generate_intervention(
    user_id: str,
    trigger_type: str,
    context: Mapping[str, Any] | None = None,
) -> dict[str, str]:
    """Generate one intervention payload containing message and suggested action."""
    if not user_id.strip():
        raise ValueError("user_id is required")
    if not trigger_type.strip():
        raise ValueError("trigger_type is required")
    
    logger.info(f"Generating intervention for user {user_id}, trigger: {trigger_type}")
    
    template_trigger_type, template = _choose_template(trigger_type=trigger_type)
    venue_name = _extract_venue_name(context=context)
    
    logger.debug(f"Selected template type: {template_trigger_type}, venue: {venue_name}")
    
    placeholders = {"venue_name": venue_name}
    message = template["message_template"].format(**placeholders)
    suggested_action = template["suggested_action"].format(**placeholders)
    
    return {
        "user_id": user_id,
        "trigger_type": template_trigger_type,
        "message": message,
        "suggested_action": suggested_action,
    }
