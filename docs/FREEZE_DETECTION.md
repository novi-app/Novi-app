# Freeze Detection - v1

This document outlines the specification for rule-based freeze detection in Novi's recommendation experience. The goal is to identify when users are experiencing decision paralysis while browsing venue recommendations and to trigger appropriate interventions based on defined behavioral patterns. The detection logic is optimized for the MVP's single-page UI and designed to be robust, minimizing false positives while effectively identifying genuine freeze events. 

V2 will focus on machine learning-based detection, but this rule-based approach serves as a critical first step in understanding user behavior and providing timely support.

**Note:** All detection rules and thresholds are designed as starting points for user testing. Values (e.g., 3 clicks in 60 seconds, 60-second cooldowns) are implemented as configurable constants to enable rapid iteration based on real user behavior.


## Table of Contents
1. [Tiered Freeze Thresholds](#1-tiered-freeze-thresholds)
2. [Detection Rules](#2-detection-rules)
   - [2.1 Exploration Stall](#21-exploration-stall)
   - [2.2 Scroll Indecision](#22-scroll-indecision)
   - [2.3 Filter Cycling](#23-filter-cycling)
   - [2.4 Card Re-clicking](#24-card-re-clicking)
   - [2.5 Full Inactivity (Tiered)](#25-full-inactivity-tiered)
3. [Throttling Logic](#3-throttling-logic)
   - [3.1 Cooldown Period](#31-cooldown-period)
   - [3.2 Dismissal Escalation](#32-dismissal-escalation)
   - [3.3 Sustained Re-engagement Threshold](#33-sustained-re-engagement-threshold)
   - [3.4 Backend Event Payload](#34-backend-event-payload)
   - [3.5 State Machine](#35-state-machine)
   - [3.6 Edge Cases](#36-edge-cases)
4. [Conclusion](#4-conclusion)


## 1. Tiered Freeze Thresholds

Freeze events trigger at different thresholds corresponding to intervention urgency levels:

| Level | Threshold | Intervention Style |
|-------|-----------|-------------------|
| **GENTLE** | 90 seconds | Subtle nudge, 25% height modal |
| **MODERATE** | 120 seconds | Standard prompt, 60% height modal |
| **URGENT** | 180 seconds | Strong intervention, 90% height modal |

Each detection rule specifies which level(s) it triggers.

## 2. Detection Rules

These rules are designed to capture different patterns of user behavior that indicate potential freeze states. Each rule has specific conditions and thresholds for triggering interventions, as well as rationales for why these behaviors suggest decision paralysis.

### 2.1 Exploration Stall

**Condition:**
- User has viewed ≥ 5 venue cards (scrolled into viewport)
- No venue card clicks within the threshold period
- User still on recommendations page

| Threshold | Level |
|-----------|-------|
| 90 seconds | GENTLE |
| 120 seconds | MODERATE |

**Rationale:** User is browsing but not engaging with any venues, indicating inability to commit to a choice.


### 2.2 Scroll Indecision

**Condition:**
- User has scrolled down ≥ 4 times AND
- User has scrolled up ≥ 4 times
- Within 90-second window
- Total scroll distance ≥ 800 pixels (excludes micro-adjustments)

| Threshold        | Level  |
|------------------|--------|
| Pattern detected | GENTLE |

**Rationale:** Back-and-forth scrolling indicates comparison paralysis—user keeps revisiting options without deciding.



### 2.3 Filter Cycling

**Condition:**
- User has changed intent filter (restaurant/cafe/bar/etc.) ≥ 3 times
- Within 60-second window
- No venue card clicks between filter changes

| Threshold | Level |
|-----------|-------|
| 3 changes in 60s | MODERATE |

**Rationale:** Repeatedly switching categories without engaging indicates user doesn't know what they want.



### 2.4 Card Re-clicking

**Condition:**
- Same venue card clicked ≥ 3 times
- Within 60-second window
- No "View Details" completion (modal not opened or immediately closed)
- **Excludes:** Save/favorite button clicks (toggle interactions)

| Threshold | Level |
|-----------|-------|
| 3 clicks in 60s | MODERATE |

**Rationale:** User clicks a venue multiple times but doesn't follow through—interested but hesitant.



### 2.5 Full Inactivity (Tiered)

**Condition:**
- No user activity (taps, scrolls, keyboard input, or navigation)
- Tab is visible (not backgrounded)

| Threshold | Level |
|-----------|-------|
| 120 seconds | MODERATE |
| 180 seconds | URGENT |

**Rationale:** Extended inactivity signals user is stuck or has abandoned the page.

**Tab Visibility Handling:**
- Tab backgrounded: Pause timer
- Tab returns to foreground: Resume timer (do not reset)



## 3. Throttling Logic

To prevent overwhelming users with interventions and to respect their autonomy, we implement a throttling mechanism that governs how often freeze events can trigger for a given user/session. This includes cooldown periods after an event fires, escalation of cooldowns upon dismissal, and conditions for resetting the throttle based on user re-engagement.

### 3.1 Cooldown Period

**Base cooldown:** 60 seconds per rule, per session

After a freeze event fires:
- Rule is suppressed for 60 seconds
- Suppression resets early if user meaningfully re-engages (5+ seconds of activity)
- **Cooldowns do NOT carry over between sessions**

### 3.2 Dismissal Escalation

When user dismisses an intervention:

| Dismissal Count | Cooldown |
|----------------|----------|
| 1st dismissal | 120 seconds (2x) |
| 2nd dismissal | 240 seconds (4x) |
| 3rd dismissal | Stop for session |

**Rationale:** Respect user autonomy—if they repeatedly reject help, stop offering.



### 3.3 Sustained Re-engagement Threshold

**Brief activity doesn't reset cooldown.**

Re-engagement must be sustained for ≥ 5 seconds to reset throttle:
- Single scroll: Not sustained
- Continuous scrolling for 5+ seconds: Sustained
- Multiple clicks over 5 seconds: Sustained



### 3.4 Backend Event Payload

Each freeze event must include:

```typescript
{
  event_id: string;        // UUID (for deduplication)
  rule_type: string;       // Which rule triggered
  level: string;           // GENTLE | MODERATE | URGENT
  screen_id: string;       // "/recommendations"
  session_id: string;      // Current session
  user_id: string;         // User identifier
  timestamp: number;       // Unix timestamp
  dismissal_count: number; // How many times user dismissed
  
  // Rule-specific context
  context: {
    cards_viewed?: number;
    scroll_cycles?: number;
    filter_changes?: string[];
    clicked_venue_id?: string;
  }
}
```

**Backend deduplication:** Reject duplicate `event_id` within 60-second window.


### 3.5 State Machine

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
                          ├──[user re-engages 5+ seconds]──► WATCHING (reset)
                          │
                          └──[user dismisses intervention]──► SUPPRESSED (escalated cooldown)
```



### 3.6 Edge Cases

| Scenario | Behavior |
|----------|----------|
| User re-engages briefly (<5s) during suppression | Continue suppression, don't reset |
| Two rules fire simultaneously (within 5s window) | Show intervention for highest severity level only (URGENT > MODERATE > GENTLE). If same level, prioritize most recent trigger. Both rules enter separate cooldowns. |
| Session ends during SUPPRESSED | Cooldown does NOT carry to new session |
| Network failure during emit | Retry with same event_id, backend dedup prevents duplicate |
| App backgrounds mid-detection | Pause timers, resume on foreground (don't reset) |
| Intervention modal shown but timeout/dismissed | Enter SUPPRESSED with dismissal escalation |
| User clicks save button repeatedly | Excluded from card re-clicking detection |



## 4. Conclusion
This specification provides a comprehensive framework for detecting user freeze events in Novi's recommendation experience. By implementing these rules and throttling logic, we can identify when users are struggling to make decisions and intervene with appropriate support, while respecting user autonomy and minimizing false positives.
