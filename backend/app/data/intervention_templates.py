"""
Intervention templates grouped by freeze detection rule type.
Each message template can include {venue_name} for personalization.
"""

DEFAULT_TRIGGER_TYPE = "general_nudge"

INTERVENTION_TEMPLATES: dict[str, list[dict[str, str]]] = {
    "exploration_stall": [
        {
            "message_template": "Sometimes the best choice is the first one that feels right. {venue_name} looks great.",
            "suggested_action": "View {venue_name}",
        },
        {
            "message_template": "You've done enough research. Trust your gut and try {venue_name}.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "Here's a solid option: {venue_name}. You can always explore more later.",
            "suggested_action": "Start with {venue_name}",
        },
        {
            "message_template": "When everything looks good, pick one and go. {venue_name} won't disappoint.",
            "suggested_action": "Choose {venue_name}",
        },
    ],
    
    "scroll_indecision": [
        {
            "message_template": "Take a break from browsing. {venue_name} is a great place to reset.",
            "suggested_action": "Head to {venue_name}",
        },
        {
            "message_template": "Sometimes doing something beats planning perfectly. Try {venue_name}.",
            "suggested_action": "Visit {venue_name}",
        },
        {
            "message_template": "Your instincts are good. Go with {venue_name} and enjoy the moment.",
            "suggested_action": "Pick {venue_name}",
        },
        {
            "message_template": "Less thinking, more doing. {venue_name} is calling.",
            "suggested_action": "Start journey to {venue_name}",
        },
    ],
    
    "filter_cycling": [
        {
            "message_template": "You're overthinking this. {venue_name} matches what you're looking for.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "All these options are good. Start with {venue_name} and adjust as you go.",
            "suggested_action": "Choose {venue_name}",
        },
        {
            "message_template": "Ready to decide? {venue_name} is a solid pick.",
            "suggested_action": "Pick {venue_name}",
        },
        {
            "message_template": "Trust the recommendation. {venue_name} is what you need right now.",
            "suggested_action": "Visit {venue_name}",
        },
    ],
    
    "card_reclicking": [
        {
            "message_template": "You keep coming back to {venue_name}. That's your answer.",
            "suggested_action": "Commit to {venue_name}",
        },
        {
            "message_template": "If {venue_name} caught your eye multiple times, go for it.",
            "suggested_action": "Choose {venue_name}",
        },
        {
            "message_template": "Stop second-guessing. {venue_name} is clearly on your mind.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "Your gut is telling you something. Listen to it and try {venue_name}.",
            "suggested_action": "Visit {venue_name}",
        },
    ],
    
    "full_inactivity": [
        {
            "message_template": "Ready to explore? {venue_name} is a great place to start.",
            "suggested_action": "Visit {venue_name}",
        },
        {
            "message_template": "You've got this. Head to {venue_name} and see where the day takes you.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "Why not {venue_name}? It's exactly what you're looking for.",
            "suggested_action": "Choose {venue_name}",
        },
        {
            "message_template": "Let's make this easy. {venue_name} is your next stop.",
            "suggested_action": "Start with {venue_name}",
        },
    ],
    
    # Fallback for unknown trigger types
    "general_nudge": [
        {
            "message_template": "Here's a great option: {venue_name}.",
            "suggested_action": "Explore {venue_name}",
        },
        {
            "message_template": "Try {venue_name}. You can always explore more later.",
            "suggested_action": "Visit {venue_name}",
        },
        {
            "message_template": "{venue_name} is perfect for what you're looking for.",
            "suggested_action": "Go to {venue_name}",
        },
        {
            "message_template": "Make it simple. Start with {venue_name}.",
            "suggested_action": "Pick {venue_name}",
        },
    ],
}
