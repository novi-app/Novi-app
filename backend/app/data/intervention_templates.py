"""
Intervention templates grouped by trigger type.
Each message template can include {venue_name} for personalization.
"""

DEFAULT_TRIGGER_TYPE = "general_nudge"

INTERVENTION_TEMPLATES: dict[str, list[dict[str, str]]] = {
    "choice_overload": [
        {
            "message_template": "Too many options can be draining. Start with {venue_name} and decide after 15 minutes there.",
            "suggested_action": "Open {venue_name} details",
        },
        {
            "message_template": "If you're stuck comparing, use a quick rule: pick {venue_name} now and keep momentum.",
            "suggested_action": "Commit to {venue_name}",
        },
        {
            "message_template": "A small decision beats endless scrolling. Try {venue_name} as your first stop.",
            "suggested_action": "Set {venue_name} as first stop",
        },
        {
            "message_template": "When choices feel noisy, lock one option. {venue_name} is a solid next move.",
            "suggested_action": "Navigate to {venue_name}",
        },
    ],
    "decision_fatigue": [
        {
            "message_template": "You've reviewed enough for now. Let {venue_name} carry this next step.",
            "suggested_action": "Choose {venue_name} now",
        },
        {
            "message_template": "Quick reset: no more comparing for 10 minutes. Head to {venue_name}.",
            "suggested_action": "Start route to {venue_name}",
        },
        {
            "message_template": "Decision fatigue is real. Use {venue_name} as your low-effort default.",
            "suggested_action": "Use {venue_name} as default",
        },
        {
            "message_template": "Energy check: make one lightweight pick. {venue_name} fits that well.",
            "suggested_action": "Confirm {venue_name}",
        },
    ],
    "distance_hesitation": [
        {
            "message_template": "{venue_name} is close enough to keep things easy. A short trip can unlock the day.",
            "suggested_action": "View ETA to {venue_name}",
        },
        {
            "message_template": "If distance is blocking you, start small: go to {venue_name} first.",
            "suggested_action": "Open directions to {venue_name}",
        },
        {
            "message_template": "You don't need a perfect plan. {venue_name} is a practical nearby step.",
            "suggested_action": "Navigate to {venue_name}",
        },
        {
            "message_template": "Momentum matters more than precision. Begin with {venue_name} and adjust later.",
            "suggested_action": "Start with {venue_name}",
        },
    ],
    "general_nudge": [
        {
            "message_template": "If you're unsure where to begin, {venue_name} is a strong and simple choice.",
            "suggested_action": "Explore {venue_name}",
        },
        {
            "message_template": "You already did the hard part. Make the next move with {venue_name}.",
            "suggested_action": "Pick {venue_name}",
        },
        {
            "message_template": "A confident first step helps. Try {venue_name} and reevaluate after arrival.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "Keep it light: choose {venue_name} now, then decide what's next on the way.",
            "suggested_action": "Start with {venue_name}",
        },
    ],
}
