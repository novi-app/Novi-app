DEFAULT_TRIGGER_TYPE = "tab_switching"

INTERVENTION_TEMPLATES: dict[str, list[dict[str, str]]] = {
  "exploration_stall": [
    {
      "message_template": "Sometimes the best choice is the first one that feels right. {venue_name} looks great!"
    },
    {
      "message_template": "You've done enough research. {venue_name} is calling!"
    },
    {
      "message_template": "When everything looks good, pick one and go. Try {venue_name}!"
    },
    {
      "message_template": "Here's a solid option: {venue_name}. You can always explore more later!"
    }
  ],
  
  "scroll_indecision": [
    {
      "message_template": "Take a break from browsing. {venue_name} is a great place to reset!"
    },
    {
      "message_template": "Sometimes doing something beats planning perfectly. Try {venue_name}!"
    },
    {
      "message_template": "Try {venue_name}. You can always explore more later!"
    },
    {
      "message_template": "Less thinking, more doing. Head to {venue_name}!"
    }
  ],
  
  "card_reclicking": [
    {
      "message_template": "You keep coming back to {venue_name}. That's your answer!"
    },
    {
      "message_template": "If {venue_name} caught your eye multiple times, go for it!"
    },
    {
      "message_template": "Your instincts are good. Go with {venue_name} and enjoy the moment!"
    },
    {
      "message_template": "{venue_name} is perfect for what you're looking for!"
    }
  ],
  
  "selection_indecision": [
    {
      "message_template": "Trust your gut. Pick one and go!"
    },
    {
      "message_template": "Any choice is a good choice. Just commit!"
    },
    {
      "message_template": "You're overthinking this. Make the call!"
    },
    {
      "message_template": "Ready to decide? Let's do this!"
    }
  ],
  
  "tab_switching": [
    {
      "message_template": "Ready to explore something new?"
    },
    {
      "message_template": "We have some great spots for you. Time to pick one!"
    },
    {
      "message_template": "Enough browsing. Let's find you something!"
    },
    {
      "message_template": "Time to make a choice and go!"
    }
  ]
}
