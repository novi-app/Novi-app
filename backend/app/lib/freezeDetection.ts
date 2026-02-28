export type FreezeLevel = "GENTLE" | "MODERATE" | "URGENT";

export type FreezeRule =
  | "exploration_stall"
  | "scroll_indecision"
  | "filter_cycling"
  | "card_reclick"
  | "inactivity";

export interface FreezeEvent {
  rule: FreezeRule;
  level: FreezeLevel;
  timestamp: number;
  context?: Record<string, any>;
}

export interface FreezeConfig {
  thresholds: {
    gentle: number;
    moderate: number;
    urgent: number;
  };
  cooldownMs: number;
}

export class FreezeDetector {
  private lastActivity = Date.now();
  private cooldownUntil: Record<FreezeRule, number> = {} as Record<
    FreezeRule,
    number
  >;

  private dismissCount = 0;

  private cardsViewed = new Set<string>();
  private scrollDirections: ("up" | "down")[] = [];
  private filterChanges: string[] = [];
  private cardClicks: Record<string, number[]> = {};

  constructor(
    private config: FreezeConfig,
    private onFreeze: (event: FreezeEvent) => void
  ) {
    // periodic evaluation for inactivity detection
    setInterval(() => this.evaluate(Date.now()), 2000);
  }

  /* ------------------ PUBLIC EVENTS ------------------ */

  recordEvent(type: string, data?: any) {
    const now = Date.now();
    this.lastActivity = now;

    switch (type) {
      case "card_view":
        this.cardsViewed.add(data.id);
        break;

      case "card_click":
        this.trackCardClick(data.id, now);
        break;

      case "scroll":
        this.trackScroll(data.direction, now);
        break;

      case "filter_change":
        this.trackFilter(data.value);
        break;
    }

    this.evaluate(now);
  }

  dismissIntervention() {
    this.dismissCount++;

    const cooldown =
      this.dismissCount === 1
        ? 120000
        : this.dismissCount === 2
        ? 240000
        : Infinity;

    Object.keys(this.cooldownUntil).forEach(rule => {
      this.cooldownUntil[rule as FreezeRule] = Date.now() + cooldown;
    });
  }

  resetDismissals() {
    this.dismissCount = 0;
  }

  /* ------------------ RULE CHECKS ------------------ */

  private checkExploration(now: number) {
    if (this.cardsViewed.size < 5) return;

    const idle = now - this.lastActivity;

    if (idle >= this.config.thresholds.urgent)
      this.trigger("exploration_stall", "URGENT");
    else if (idle >= this.config.thresholds.moderate)
      this.trigger("exploration_stall", "MODERATE");
    else if (idle >= this.config.thresholds.gentle)
      this.trigger("exploration_stall", "GENTLE");
  }

  private trackScroll(direction: "up" | "down", now: number) {
    this.scrollDirections.push(direction);
    if (this.scrollDirections.length > 10)
      this.scrollDirections.shift();
  }

  private checkScroll() {
    if (this.scrollDirections.length < 6) return;

    const last = this.scrollDirections.slice(-6);

    const alternating = last.every(
      (dir, i, arr) => i === 0 || dir !== arr[i - 1]
    );

    if (alternating)
      this.trigger("scroll_indecision", "GENTLE");
  }

  private trackFilter(value: string) {
    this.filterChanges.push(value);
    if (this.filterChanges.length > 6)
      this.filterChanges.shift();
  }

  private checkFilters() {
    if (this.filterChanges.length < 4) return;

    const last = this.filterChanges.slice(-4);
    const unique = new Set(last);

    // cycling means repeating options
    if (unique.size < last.length)
      this.trigger("filter_cycling", "MODERATE");
  }

  private trackCardClick(id: string, now: number) {
    if (!this.cardClicks[id]) this.cardClicks[id] = [];

    this.cardClicks[id].push(now);

    this.cardClicks[id] = this.cardClicks[id].filter(
      t => now - t < 60000
    );

    if (this.cardClicks[id].length >= 3)
      this.trigger("card_reclick", "MODERATE");
  }

  private checkInactivity(now: number) {
    const idle = now - this.lastActivity;

    if (idle >= this.config.thresholds.urgent)
      this.trigger("inactivity", "URGENT");
    else if (idle >= this.config.thresholds.moderate)
      this.trigger("inactivity", "MODERATE");
    else if (idle >= this.config.thresholds.gentle)
      this.trigger("inactivity", "GENTLE");
  }

  /* ------------------ CORE ENGINE ------------------ */

  private evaluate(now: number) {
    this.checkExploration(now);
    this.checkScroll();
    this.checkFilters();
    this.checkInactivity(now);
  }

  private canTrigger(rule: FreezeRule, now: number) {
    return (
      !this.cooldownUntil[rule] ||
      now > this.cooldownUntil[rule]
    );
  }

  private trigger(rule: FreezeRule, level: FreezeLevel) {
    const now = Date.now();

    if (!this.canTrigger(rule, now)) return;

    this.cooldownUntil[rule] = now + this.config.cooldownMs;

    this.onFreeze({
      rule,
      level,
      timestamp: now
    });
  }
}