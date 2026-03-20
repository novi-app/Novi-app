const TEMPLATES: Record<string, string[]> = {
  exploration_stall: [
    "Sometimes the best choice is the first one that feels right.",
    "You've done enough research. Time to pick one!",
    "When everything looks good, just pick one and go.",
    "Here's a solid option. You can always explore more later!",
  ],
  scroll_indecision: [
    "Take a break from browsing — something great is right here.",
    "Sometimes doing something beats planning perfectly.",
    "Less scrolling, more doing.",
    "Less thinking, more doing.",
  ],
  card_reclicking: [
    "You keep coming back to this one. That's your answer!",
    "If it caught your eye multiple times, go for it!",
    "Your instincts are good. Go with it and enjoy the moment!",
    "Looks like you already know what you want.",
  ],
  selection_indecision: [
    "Trust your gut. Pick one and go!",
    "Any choice is a good choice. Just commit!",
    "You're overthinking this. Make the call!",
    "Ready to decide? Let's do this!",
  ],
  tab_switching: [
    "Ready to explore something new?",
    "We have some great spots for you. Time to pick one!",
    "Enough browsing. Let's find you something!",
    "Time to make a choice and go!",
  ],
};

export function pickInterventionMessage(triggerType: string): string {
  const options = TEMPLATES[triggerType] ?? TEMPLATES.tab_switching;
  return options[Math.floor(Math.random() * options.length)];
}
