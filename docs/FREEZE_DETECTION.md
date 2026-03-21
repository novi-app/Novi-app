# Freeze Detection

This document describes the rule-based freeze detection system in Novi's recommendation experience. The goal is to identify when users are experiencing decision paralysis while browsing venue recommendations and trigger appropriate interventions based on defined behavioral patterns.

V2 will focus on machine learning-based detection. This rule-based approach serves as the first step in understanding user behavior.

**Note:** All thresholds are starting points for user testing and are implemented as configurable constants to enable rapid iteration.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Tiered Freeze Thresholds](#2-tiered-freeze-thresholds)
3. [Detection Rules](#3-detection-rules)
   - [3.1 Exploration Stall](#31-exploration-stall)
   - [3.2 Scroll Indecision](#32-scroll-indecision)
   - [3.3 Card Re-clicking](#33-card-re-clicking)
   - [3.4 Tab Switching](#34-tab-switching)
   - [3.5 Selection Clicking](#35-selection-clicking)
4. [Throttling Logic](#4-throttling-logic)
   - [4.1 FreezeDetector Cooldown](#41-freezedetector-cooldown)
   - [4.2 Dismissal Escalation](#42-dismissal-escalation)
   - [4.3 Standalone Rule Cooldowns](#43-standalone-rule-cooldowns)
5. [Event Payload](#5-event-payload)
6. [State Machine](#6-state-machine)
7. [Edge Cases](#7-edge-cases)
8. [Not Yet Implemented](#8-not-yet-implemented)

---

## 1. Architecture Overview

The system has two distinct detection approaches:

**`FreezeDetector` class** — used on the recommendations page. Tracks in-memory behavioral signals (card views, scroll events, details views) and evaluates them on a 3-second interval. Fires a `FreezeEvent` callback when a rule is triggered.

**Standalone localStorage functions** — used across the tab layout and home/onboarding pages. Track discrete user actions (tab switches, selection filter clicks) in localStorage so state persists across navigation. Each has its own cooldown key.

```
FreezeDetector (class)          Standalone functions
─────────────────────           ──────────────────────────────────
exploration_stall               trackTabSwitch()
scroll_indecision               trackSelectionClick()
card_reclicking
```

---

## 2. Tiered Freeze Thresholds

| Level | Intervention Style |
|-------|--------------------|
| **GENTLE** | Subtle nudge |
| **MODERATE** | Standard prompt |
| **URGENT** | Strong intervention |

Thresholds that map to these levels are configured per-rule (see below). The `FreezeDetector` accepts `gentle` and `moderate` thresholds via `FreezeConfig.thresholds`.

---

## 3. Detection Rules

### 3.1 Exploration Stall

**Implemented in:** `FreezeDetector.checkExploration()`, evaluated every 3 seconds.

**Condition:**
- User has viewed ≥ **7** unique venue cards
- No activity for longer than the idle threshold

| Idle Time | Level |
|-----------|-------|
| ≥ `config.thresholds.gentle` | GENTLE |
| ≥ `config.thresholds.moderate` | MODERATE |

**Context emitted:** `cards_viewed`, `idle_seconds`

**Rationale:** User is browsing but not engaging, indicating inability to commit to a choice.

---

### 3.2 Scroll Indecision

**Implemented in:** `FreezeDetector.checkScroll()`, called on every `recordScroll()`.

**Condition:**
- Total scroll distance ≥ **800 px** within the last 90 seconds (micro-adjustments < 50 px are excluded)
- ≥ **5 direction reversals** (each switch from down→up or up→down counts as one) — equivalent to ~3 back-and-forth swipe cycles

| Threshold | Level |
|-----------|-------|
| Pattern detected | GENTLE |

**Context emitted:** `scroll_cycles` (reversals ÷ 2), `total_scroll_distance`

**Rationale:** Back-and-forth scrolling indicates comparison paralysis—user keeps revisiting options without deciding.

---

### 3.3 Card Re-clicking

**Implemented in:** `FreezeDetector.recordDetailsView()`, called when a venue detail view is opened.

**Condition:**
- Same venue detail viewed multiple times within a **3-minute** (180 s) rolling window

| View Count (3-min window) | Level |
|---------------------------|-------|
| ≥ 5 | GENTLE |
| ≥ 10 | MODERATE |

**Context emitted:** `venue_id`, `view_count`

**Rationale:** User opens the same venue repeatedly but doesn't commit — interested but hesitant.

---

### 3.4 Tab Switching

**Implemented in:** `trackTabSwitch()` — standalone localStorage function, called from `TabsLayout` on every pathname change.

**Condition:**
- ≥ **7** distinct tab switches within a **200-second** rolling window
- Consecutive switches to the same tab are ignored
- If the gap between two consecutive switches exceeds **60 seconds**, the counter resets (only rapid bursts count)
- Not in cooldown (`novi_freeze_cooldown`)

| Threshold | Level |
|-----------|-------|
| ≥ 7 switches in 200 s (rapid) | GENTLE (handled by caller) |

**Cooldown:** Set via `setTabSwitchCooldown()`. Default **3 minutes** (180 s) after dismissal. Also set to **2 minutes** when the user accepts a recommendation (grace period). Counter is cleared (`clearTabSwitches()`) on dismissal or accept.

**Context sent to API:** `current_tab` (which tab the user landed on when trigger fired)

**Rationale:** Repeatedly switching between Home / Saved / Profile without engaging indicates the user doesn't know where to start.

---

### 3.5 Selection Clicking

**Implemented in:** `trackSelectionClick()` — standalone localStorage function, called from the home page when a user taps activity/vibe/mood filters.

**Condition:**
- ≥ **6** selection clicks within a **5-minute** (300 s) rolling window
- Not in cooldown (`novi_freeze_cooldown`)

| Threshold | Level |
|-----------|-------|
| ≥ 6 clicks in 5 min | GENTLE (handled by caller) |

**Cooldown:** Set via `setSelectionCooldown()`. Default **2 minutes** (120 s) after dismissal. Counter is cleared (`clearSelectionClicks()`) on dismissal.

**Context sent to API:** `type` (activity | vibe | mood), `value` of the last selection

**Rationale:** Rapidly cycling through filters without committing suggests the user is unsure what kind of experience they want.

---

## 4. Throttling Logic

### 4.1 FreezeDetector Cooldown

After any rule in `FreezeDetector` fires:
- The triggering rule is added to `triggeredRules`
- `lastTriggerTime` is set to `now + config.cooldownMs`
- No rule can fire again until `lastTriggerTime` has passed
- If the cooldown expires and the same rule is still active, `triggeredRules` is cleared so it can re-fire

Cooldown does **not** persist across sessions (in-memory only).

### 4.2 Dismissal Escalation

When `dismissIntervention()` is called on a `FreezeDetector` instance:

| Dismissal Count | Cooldown Applied |
|----------------|-----------------|
| 1st | 120 seconds |
| 2nd | 240 seconds |
| 3rd+ | Infinity (stop for session) |

Call `resetDismissals()` to clear the escalation state (e.g. after meaningful re-engagement).

### 4.3 Standalone Rule Cooldowns

Tab switching and selection clicking share a single unified localStorage cooldown key:

| Rule | localStorage key | Default cooldown |
|------|-----------------|-----------------|
| Tab switching | `novi_freeze_cooldown` | 180 s |
| Selection clicking | `novi_freeze_cooldown` | 120 s |

Because both rules share the same key, triggering either one suppresses the other for the duration of the cooldown. These cooldowns **do** persist across page navigations within the same browser session, but are not explicitly cleared on session end (they expire naturally by timestamp).

---

## 5. Event Payload

`FreezeDetector` emits a `FreezeEvent` object to the `onFreeze` callback:

```typescript
interface FreezeEvent {
  rule: FreezeRuleType;      // "exploration_stall" | "scroll_indecision" | "card_reclicking"
  level: InterventionLevel;  // "GENTLE" | "MODERATE" | "URGENT"
  timestamp: number;         // Unix ms
  context: {
    cards_viewed: number;
    scroll_events: number;
    time_on_screen_seconds: number;
    dismissal_count: number;
    // Rule-specific additions:
    idle_seconds?: number;           // exploration_stall
    scroll_cycles?: number;          // scroll_indecision
    total_scroll_distance?: number;  // scroll_indecision
    venue_id?: string;               // card_reclicking
    view_count?: number;             // card_reclicking
  };
}
```

Standalone rules (tab switching, selection clicking) send their context directly to the `/api/intervention` endpoint as part of the HTTP POST body — they do not use the `FreezeEvent` interface.

---

## 6. State Machine

```
WATCHING ──[condition met]──► DETECTING ──[threshold reached]──► FIRED
                                                                     │
                                                              enter SUPPRESSED
                                                                     │
                          ┌──────────────────────────────────────────┘
                          │
                          ├──[cooldown expires, condition persists]──► FIRED again
                          │
                          ├──[cooldown expires, condition gone]──► WATCHING
                          │
                          └──[user dismisses]──► SUPPRESSED (escalated cooldown)
```

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Two rules fire within the same cooldown window | Second rule is blocked by `canTrigger()`. Both rules have the same shared `lastTriggerTime`. |
| Same tab navigated to consecutively | `trackTabSwitch` ignores it — consecutive duplicate tabs are not counted |
| Tab switch after a long pause (> 60 s) | Counter resets — only rapid bursts within 60 s of each other accumulate toward the threshold |
| Network failure on `/api/intervention` call | Caller falls back to a hardcoded message; intervention still shown |
| Standalone cooldown expires naturally | No explicit reset needed; timestamp comparison handles expiry |
| `FreezeDetector` destroyed mid-session | `destroy()` clears the evaluation interval; no further events fire |
