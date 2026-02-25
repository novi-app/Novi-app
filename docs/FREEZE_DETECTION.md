# Freeze Detection v1

**Status:** FINAL — Single Source of Truth  
**Replaces:** All prior drafts, including any 2.5-minute threshold references

> ⚠️ **Canonical Replacement Notice**  
> This document supersedes all prior drafts and conflicting definitions. The 2.5-minute threshold previously referenced in earlier documentation is **explicitly deprecated**. All engineering implementation must follow this specification.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Global Freeze Time Threshold](#2-global-freeze-time-threshold)
3. [Detection Rules](#3-detection-rules)
   - [3.1 Scroll Velocity](#31-scroll-velocity)
   - [3.2 Screen Revisit (3+)](#32-screen-revisit-3)
   - [3.3 Repeated Tap (5+)](#33-repeated-tap-5)
   - [3.4 Full Inactivity](#34-full-inactivity)
4. [Throttling Logic](#4-throttling-logic)
   - [4.1 Recommended Cooldown](#41-recommended-cooldown)
   - [4.2 Per-Rule Cooldown Table](#42-per-rule-cooldown-table)
   - [4.3 Throttling Behaviors](#43-throttling-behaviors)
   - [4.4 Backend Deduplication](#44-backend-deduplication)
   - [4.5 Throttle State Machine](#45-throttle-state-machine)
   - [4.6 Edge Cases](#46-edge-cases)
5. [Canonical Replacement Statement](#5-canonical-replacement-statement)

---

## 1. Purpose

This document defines the official and authoritative logic for Freeze Detection v1. A "freeze event" represents a signal that a user is experiencing decision paralysis — the core problem Novi is designed to solve. This specification covers all detection rules and the throttling layer that governs how those events are emitted.

---

## 2. Global Freeze Time Threshold

> ✅ **Final Decision:** A freeze event is triggered when any defined freeze condition is sustained for **120 seconds (2 minutes).**

This threshold is final and canonical for v1. It explicitly replaces any prior 2.5-minute threshold referenced in earlier documentation.

---

## 3. Detection Rules

The following four rules define discrete conditions that can independently trigger a freeze event when their criteria are met and sustained to the 120-second global threshold (where applicable).

---

### 3.1 Scroll Velocity

| Parameter | Definition |
|---|---|
| Velocity threshold | < 50 pixels per second |
| Sustained duration | ≥ 30 seconds continuous |
| Exclusions | No meaningful navigation or interaction during period |
| Calculation | Total pixels scrolled ÷ time elapsed |
| Freeze trigger | Condition contributes to reaching 120-second threshold |

---

### 3.2 Screen Revisit (3+)

A **"revisit"** is defined as the user navigating away from a screen or section, then returning to the same screen within the same session.

| Parameter | Definition |
|---|---|
| Threshold | 3 or more revisits to the same screen |
| Window | Rolling 5-minute window |
| Condition | No successful task completion |
| Not a revisit | Page reload without navigation, unless it results in a full route re-entry |

---

### 3.3 Repeated Tap (5+)

| Parameter | Definition |
|---|---|
| Threshold | 5 or more taps |
| Target | Same interactive element |
| Window | 15-second window |
| Condition | No resulting state change or successful progression |
| Counter reset | On successful action completion or navigation |

---

### 3.4 Full Inactivity

A freeze event is triggered when **all** of the following are absent for ≥ 120 seconds:

- No taps
- No scrolling
- No keyboard input
- No navigation events

When inactivity reaches exactly 120 seconds, a freeze event fires immediately.

---

## 4. Throttling Logic

Throttling governs how frequently freeze events can be emitted. Without throttling, noisy signals could cause duplicate events, over-trigger backend calls, or fire multiple alerts in rapid succession for the same underlying freeze state.

### Problems throttling solves

| Problem | Description |
|---|---|
| Duplicate events | Same freeze condition fires multiple events within seconds of each other |
| Flaky/noisy signals | Borderline signal values oscillating just above/below threshold cause rapid on-off firing |
| Backend/API spam | Rapid-fire events overwhelm the backend event pipeline or create noisy analytics |

---

### 4.1 Recommended Cooldown

> 📋 **Engineering Recommendation: 60-second per-rule cooldown**  
> After a freeze event fires, suppress the same rule from firing again for 60 seconds — unless the user re-engages (any tap, scroll, or navigation), which resets the timer.

**Rationale:**

- **30 seconds** — Too short. Fast-oscillating signals can still re-trigger before the user meaningfully re-engages.
- **60 seconds** — Balanced. Absorbs signal noise, but re-detection is still possible within a typical 3–5 minute use session.
- **Until session reset** — Too aggressive. A user can genuinely be paralyzed twice in one session.

---

### 4.2 Per-Rule Cooldown Table

| Detection Rule | Cooldown | Scope |
|---|---|---|
| Scroll Velocity | 60 seconds | Per rule, per screen |
| Screen Revisit (3+) | 60 seconds | Per rule, per screen |
| Repeated Tap (5+) | 60 seconds | Per rule, per interactive element |
| Full Inactivity | 60 seconds | Per rule, per session |

> **Note:** Rules are throttled independently. A scroll freeze and an inactivity freeze may fire in the same 60-second window.

---

### 4.3 Throttling Behaviors

- When a freeze event fires, the emitter for that rule is suppressed for 60 seconds.
- Suppression is reset early if the user re-engages via any tap, scroll, or navigation.
- If the same freeze condition persists after cooldown expires without re-engagement, a new event fires.
- A single user action must not trigger more than one event of the same rule type within a 60-second window.
- Multiple different rules may fire independently within the same window.

---

### 4.4 Backend Deduplication

Client-side throttling is the primary mechanism. Implement backend deduplication as a safety net.

**Required event payload fields:**

| Field | Description |
|---|---|
| `event_id` | Unique UUID generated at emission time |
| `rule_type` | Which detection rule fired |
| `screen_id` | Screen where freeze was detected |
| `session_id` | Current session identifier |
| `timestamp` | Unix timestamp of event |

The backend must reject duplicate `event_id` values received within a 60-second window.

---

### 4.5 Throttle State Machine

```
WATCHING ──[condition met]──► DETECTING ──[threshold reached]──► FIRED
                                                                     │
                                                              enter SUPPRESSED
                                                                     │
                          ┌──────────────────────────────────────────┘
                          │
                          ├──[60s elapses, no re-engagement, condition persists]──► FIRED again
                          │
                          ├──[60s elapses, no re-engagement, condition gone]──► WATCHING
                          │
                          └──[user re-engages: tap / scroll / nav]──► WATCHING (timer reset)
```

| Current State | Trigger | Next State |
|---|---|---|
| `WATCHING` | Freeze condition met | `DETECTING` |
| `DETECTING` | Condition sustained to threshold | `FIRED` → enter `SUPPRESSED` |
| `SUPPRESSED` | 60s elapses, condition persists, no re-engagement | `FIRED` again |
| `SUPPRESSED` | 60s elapses, condition gone | `WATCHING` |
| `SUPPRESSED` | User re-engages (any tap/scroll/nav) | `WATCHING` (timer reset) |

---

### 4.6 Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User re-engages mid-suppression | Reset suppression; return to `WATCHING` |
| Two rules fire simultaneously | Both events emit independently; both enter separate 60s cooldowns |
| Session ends during `SUPPRESSED` | Suppress state does not carry over to new session |
| Network failure during emit | Retry with same `event_id`; backend dedup prevents duplicate recording |
| App backgrounds mid-detection | Pause all timers on background; resume on foreground |

---

## 5. Canonical Replacement Statement

This document is the single source of truth for Freeze Detection v1. It explicitly replaces:

- Any previously documented 2.5-minute freeze threshold
- Any conflicting timing or interaction definitions in earlier drafts
- Any throttling definitions not described in Section 4

**All engineering implementation must follow this specification.**
