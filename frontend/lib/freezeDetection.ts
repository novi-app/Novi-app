import type { InterventionLevel, FreezeRuleType } from "./events";

export interface FreezeEvent {
  rule: FreezeRuleType;
  level: InterventionLevel;
  timestamp: number;
  context: Record<string, any>;
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
  private sessionStart = Date.now();
  private lastActivity = Date.now();
  private lastTriggerTime = 0;
  private dismissCount = 0;
  private triggeredRules = new Set<FreezeRuleType>();

  // Tracking data
  private cardsViewed = new Set<string>();
  private detailsViews: Record<string, number[]> = {};
  private scrollEvents: Array<{
    direction: "up" | "down";
    distance: number;
    timestamp: number;
  }> = [];
  private totalScrollDistance = 0;

  private _intervalId!: number;

  constructor(
    private config: FreezeConfig,
    private onFreeze: (event: FreezeEvent) => void
  ) {
    this._intervalId = window.setInterval(() => this.evaluate(Date.now()), 3000);
  }

  destroy() {
    window.clearInterval(this._intervalId);
  }

  recordCardView(venueId: string) {
    this.cardsViewed.add(venueId);
    this.lastActivity = Date.now();
  }

  recordDetailsView(venueId: string) {
    const now = Date.now();
    this.lastActivity = now;

    if (!this.detailsViews[venueId]) {
      this.detailsViews[venueId] = [];
    }
    
    this.detailsViews[venueId].push(now);
    this.detailsViews[venueId] = this.detailsViews[venueId].filter(t => now - t < 180000);

    const viewCount = this.detailsViews[venueId].length;
    console.log(`📊 Details viewed ${viewCount} times for venue ${venueId}`);

    if (viewCount >= 7) {
      this.trigger("card_reclicking", "MODERATE", {
        venue_id: venueId,
        view_count: viewCount,
      });
    } else if (viewCount >= 5) {
      this.trigger("card_reclicking", "GENTLE", {
        venue_id: venueId,
        view_count: viewCount,
      });
    }

    this.evaluate(now);
  }

  recordScroll(direction: "up" | "down", distance: number) {
    const now = Date.now();
    this.lastActivity = now;

    if (distance < 50) return;
    
    this.scrollEvents.push({ direction, distance, timestamp: now });
    this.scrollEvents = this.scrollEvents.filter(e => now - e.timestamp < 90000);
    this.totalScrollDistance = this.scrollEvents.reduce((sum, e) => sum + e.distance, 0);

    this.evaluate(now);
  }

  dismissIntervention() {
    this.dismissCount++;
    
    const cooldown =
      this.dismissCount === 1 ? 120000 :
      this.dismissCount === 2 ? 240000 :
      Infinity;

    this.lastTriggerTime = Date.now() + cooldown;
    console.log(`⏸️ Intervention dismissed (count: ${this.dismissCount}), cooldown until: ${new Date(this.lastTriggerTime).toLocaleTimeString()}`);
  }

  resetDismissals() {
    this.dismissCount = 0;
    this.triggeredRules.clear();
    this.lastTriggerTime = 0;
  }

  private checkExploration(now: number) {
    if (this.cardsViewed.size < 7) return;
    
    const idle = now - this.lastActivity;
    
    if (idle >= this.config.thresholds.moderate) {
      this.trigger("exploration_stall", "MODERATE", { 
        cards_viewed: this.cardsViewed.size,
        idle_seconds: Math.round(idle / 1000)
      });
    } else if (idle >= this.config.thresholds.gentle) {
      this.trigger("exploration_stall", "GENTLE", { 
        cards_viewed: this.cardsViewed.size,
        idle_seconds: Math.round(idle / 1000)
      });
    }
  }

  private checkScroll() {
    if (this.totalScrollDistance < 600) return;

    const directions = this.scrollEvents.map(e => e.direction);
    const ups = directions.filter(d => d === "up").length;
    const downs = directions.filter(d => d === "down").length;

    if (ups >= 6 && downs >= 6) {
      this.trigger("scroll_indecision", "GENTLE", {
        scroll_cycles: Math.min(ups, downs),
        total_scroll_distance: this.totalScrollDistance,
      });
    }
  }

  private evaluate(now: number) {
    this.checkExploration(now);
    this.checkScroll();
  }

  private canTrigger(rule: FreezeRuleType, now: number): boolean {
    if (this.triggeredRules.has(rule)) {
      console.log(`❌ Rule "${rule}" already triggered`);
      return false;
    }

    if (now < this.lastTriggerTime) {
      console.log(`❌ In cooldown until ${new Date(this.lastTriggerTime).toLocaleTimeString()}`);
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

    console.log(`🔥🔥🔥 FREEZE TRIGGERED: ${rule} (${level}) 🔥🔥🔥`);

    this.triggeredRules.add(rule);
    this.lastTriggerTime = now + this.config.cooldownMs;

    this.onFreeze({
      rule,
      level,
      timestamp: now,
      context: {
        cards_viewed: this.cardsViewed.size,
        scroll_events: this.scrollEvents.length,
        time_on_screen_seconds: Math.round((now - this.sessionStart) / 1000),
        dismissal_count: this.dismissCount,
        ...additionalContext,
      },
    });
  }
}

// ==========================================
// STANDALONE HELPERS FOR HOME PAGE & TABS
// ==========================================

/**
 * Track selection clicks on home page (activity/vibe/mood)
 * Call this from your home page button handlers
 */
export function trackSelectionClick(type: "activity" | "vibe" | "mood", value: string): boolean {
  const clicks = JSON.parse(localStorage.getItem("novi_selection_clicks") || "[]");
  clicks.push({ type, value, timestamp: Date.now() });
  
  // Keep only last 5 minutes
  const recent = clicks.filter((c: any) => Date.now() - c.timestamp < 300000);
  localStorage.setItem("novi_selection_clicks", JSON.stringify(recent));
  
  console.log(`🎯 Selection clicks: ${recent.length} (${type}: ${value})`);
  
  // Return true if should trigger intervention
  return recent.length >= 4;
}

/**
 * Clear selection clicks when user successfully navigates to recommendations
 */
export function clearSelectionClicks() {
  localStorage.removeItem("novi_selection_clicks");
  console.log("🔄 Selection clicks cleared");
}

/**
 * Track tab switches (call from bottom nav)
 * Returns current tab name if should trigger intervention, null otherwise
 */
export function trackTabSwitch(toTab: "home" | "saved" | "profile"): string | null {
  const switches = JSON.parse(localStorage.getItem("novi_tab_switches") || "[]");
  
  // Only count as switch if different from last tab
  const lastSwitch = switches[switches.length - 1];
  if (lastSwitch && lastSwitch.tab === toTab) {
    return null; // Same tab, don't count
  }
  
  switches.push({ tab: toTab, timestamp: Date.now() });
  
  // Keep only last 3 minutes
  const recent = switches.filter((s: any) => Date.now() - s.timestamp < 180000);
  localStorage.setItem("novi_tab_switches", JSON.stringify(recent));
  
  console.log(`🔄 Tab switches: ${recent.length} (current: ${toTab})`);
  
  // Return current tab if should trigger
  return recent.length >= 4 ? toTab : null;
}

/**
 * Clear tab switches
 */
export function clearTabSwitches() {
  localStorage.removeItem("novi_tab_switches");
  console.log("🔄 Tab switches cleared");
}
