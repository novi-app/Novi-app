DEFAULT_TRIGGER_TYPE = "general_nudge"

INTERVENTION_TEMPLATES: dict[str, list[dict[str, str]]] = {
    "exploration_stall": [
        {
            "message_template": "Sometimes the best choice is the first one that feels right. {venue_name} looks great.",
        },
        {
            "message_template": "You've done enough research. Trust your gut and try {venue_name}.",
        },
        {
            "message_template": "Here's a solid option: {venue_name}. You can always explore more later.",
        },
        {
            "message_template": "When everything looks good, pick one and go. {venue_name} won't disappoint.",
        },
    ],
    
    "scroll_indecision": [
        {
            "message_template": "Take a break from browsing. {venue_name} is a great place to reset.",
        },
        {
            "message_template": "Sometimes doing something beats planning perfectly. Try {venue_name}.",
        },
        {
            "message_template": "Your instincts are good. Go with {venue_name} and enjoy the moment.",
        },
        {
            "message_template": "Less thinking, more doing. {venue_name} is calling.",
        },
    ],
    
    "filter_cycling": [
        {
            "message_template": "You're overthinking this. {venue_name} matches what you're looking for.",
        },
        {
            "message_template": "All these options are good. Start with {venue_name} and adjust as you go.",
        },
        {
            "message_template": "Ready to decide? {venue_name} is a solid pick.",
        },
        {
            "message_template": "Trust the recommendation. {venue_name} is what you need right now.",
        },
    ],
    
    "card_reclicking": [
        {
            "message_template": "You keep coming back to {venue_name}. That's your answer.",
        },
        {
            "message_template": "If {venue_name} caught your eye multiple times, go for it.",
        },
        {
            "message_template": "Stop second-guessing. {venue_name} is clearly on your mind.",
        },
        {
            "message_template": "Your gut is telling you something. Listen to it and try {venue_name}.",
        },
    ],
    
    "full_inactivity": [
        {
            "message_template": "Ready to explore? {venue_name} is a great place to start.",
        },
        {
            "message_template": "You've got this. Head to {venue_name} and see where the day takes you.",
        },
        {
            "message_template": "Why not {venue_name}? It's exactly what you're looking for.",
        },
        {
            "message_template": "Let's make this easy. {venue_name} is your next stop.",
        },
    ],
    
    # Fallback for unknown trigger types
    "general_nudge": [
        {
            "message_template": "Here's a great option: {venue_name}.",
        },
        {
            "message_template": "Try {venue_name}. You can always explore more later.",
        },
        {
            "message_template": "{venue_name} is perfect for what you're looking for.",
        },
        {
            "message_template": "Make it simple. Start with {venue_name}.",
        },
    ],
}
