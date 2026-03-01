import type { InterventionLevel, FreezeRuleType } from "./events";

export interface FreezeEvent {
  rule: FreezeRuleType;
  level: InterventionLevel;
  timestamp: number;
  context: Record<string, any>;
}

export interface FreezeConfig {
  thresholds: {
    gentle: number;    // 90 seconds
    moderate: number;  // 120 seconds
    urgent: number;    // 180 seconds
  };
  cooldownMs: number;  // 60 seconds default
}

export class FreezeDetector {
  private sessionStart = Date.now();
  private lastActivity = Date.now();
  
  private cooldownUntil: Record<FreezeRuleType, number> = {} as Record<FreezeRuleType, number>;
  private dismissCount = 0;

  // Tracking state
  private cardsViewed = new Set<string>();
  private scrollEvents: Array<{
    direction: "up" | "down";
    distance: number;
    timestamp: number;
  }> = [];
  private totalScrollDistance = 0;
  private filterChanges: string[] = [];
  private cardClicks: Record<string, number[]> = {};

  constructor(
    private config: FreezeConfig,
    private onFreeze: (event: FreezeEvent) => void
  ) {
    // Periodic evaluation for inactivity detection
    setInterval(() => this.evaluate(Date.now()), 2000);
  }

  /* ------------------ PUBLIC API ------------------ */

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
        this.trackScroll(data.direction, data.distance || 0, now);
        break;

      case "filter_change":
        this.trackFilter(data.value, now);
        break;
    }

    this.evaluate(now);
  }

  dismissIntervention() {
    this.dismissCount++;

    // Escalating cooldown: 2min → 4min → stop
    const cooldown =
      this.dismissCount === 1 ? 120000 :
      this.dismissCount === 2 ? 240000 :
      Infinity;

    // Apply cooldown to all rules
    Object.keys(this.cooldownUntil).forEach(rule => {
      this.cooldownUntil[rule as FreezeRuleType] = Date.now() + cooldown;
    });
  }

  resetDismissals() {
    this.dismissCount = 0;
  }

  /* ------------------ TRACKING ------------------ */

  private trackScroll(direction: "up" | "down", distance: number, now: number) {
    // Only track significant scrolls (> 50px)
    if (distance < 50) return;

    this.scrollEvents.push({ direction, distance, timestamp: now });

    // Keep only last 90 seconds
    this.scrollEvents = this.scrollEvents.filter(e => now - e.timestamp < 90000);

    // Recalculate total distance
    this.totalScrollDistance = this.scrollEvents.reduce((sum, e) => sum + e.distance, 0);
  }

  private trackFilter(value: string, now: number) {
    this.filterChanges.push(value);
    
    // Keep only recent changes (last 60 seconds or 6 changes)
    if (this.filterChanges.length > 6) {
      this.filterChanges.shift();
    }
  }

  private trackCardClick(id: string, now: number) {
    if (!this.cardClicks[id]) {
      this.cardClicks[id] = [];
    }

    this.cardClicks[id].push(now);

    // Keep only clicks from last 60 seconds
    this.cardClicks[id] = this.cardClicks[id].filter(t => now - t < 60000);

    // Check for repeated clicks
    if (this.cardClicks[id].length >= 3) {
      this.trigger("card_reclicking", "MODERATE", {
        clicked_venue_id: id,
        click_count: this.cardClicks[id].length,
      });
    }
  }

  /* ------------------ RULE CHECKS ------------------ */

  private checkExploration(now: number) {
    // Only trigger if user viewed cards (different from pure inactivity)
    if (this.cardsViewed.size < 5) return;

    const idle = now - this.lastActivity;

    if (idle >= this.config.thresholds.moderate) {
      this.trigger("exploration_stall", "MODERATE", {
        cards_viewed: this.cardsViewed.size,
      });
    } else if (idle >= this.config.thresholds.gentle) {
      this.trigger("exploration_stall", "GENTLE", {
        cards_viewed: this.cardsViewed.size,
      });
    }
  }

  private checkScroll() {
    // Need minimum 500px total scroll
    if (this.totalScrollDistance < 500) return;

    const directions = this.scrollEvents.map(e => e.direction);
    const ups = directions.filter(d => d === "up").length;
    const downs = directions.filter(d => d === "down").length;

    // At least 3 ups AND 3 downs
    if (ups >= 3 && downs >= 3) {
      this.trigger("scroll_indecision", "GENTLE", {
        scroll_cycles: Math.min(ups, downs),
        total_scroll_distance: this.totalScrollDistance,
      });
    }
  }

  private checkFilters() {
    // Need at least 3 filter changes
    if (this.filterChanges.length < 3) return;

    const recentChanges = this.filterChanges.slice(-4);
    const unique = new Set(recentChanges);

    // If cycled between 2-3 options repeatedly
    if (unique.size >= 2 && unique.size < recentChanges.length) {
      this.trigger("filter_cycling", "MODERATE", {
        filter_changes: recentChanges,
      });
    }
  }

  private checkInactivity(now: number) {
    const idle = now - this.lastActivity;

    // Only trigger if no cards viewed (pure inactivity, not exploration)
    if (this.cardsViewed.size > 0) return;

    if (idle >= this.config.thresholds.urgent) {
      this.trigger("full_inactivity", "URGENT");
    } else if (idle >= this.config.thresholds.moderate) {
      this.trigger("full_inactivity", "MODERATE");
    }
  }

  /* ------------------ CORE ENGINE ------------------ */

  private evaluate(now: number) {
    this.checkExploration(now);
    this.checkScroll();
    this.checkFilters();
    this.checkInactivity(now);
  }

  private canTrigger(rule: FreezeRuleType, now: number): boolean {
    // If in cooldown, can't trigger
    if (this.cooldownUntil[rule] && now <= this.cooldownUntil[rule]) {
      return false;
    }
    return true;
  }

  private trigger(
    rule: FreezeRuleType,
    level: InterventionLevel,
    additionalContext?: Record<string, any>
  ) {
    const now = Date.now();

    if (!this.canTrigger(rule, now)) return;

    // Set cooldown
    this.cooldownUntil[rule] = now + this.config.cooldownMs;

    // Fire event with context
    this.onFreeze({
      rule,
      level,
      timestamp: now,
      context: {
        cards_viewed: this.cardsViewed.size,
        scroll_events: this.scrollEvents.length,
        filter_changes: this.filterChanges.length,
        time_on_screen_seconds: Math.round((now - this.sessionStart) / 1000),
        dismissal_count: this.dismissCount,
        ...additionalContext,
      },
    });
  }
}
