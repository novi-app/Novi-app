# Analytics Schema Documentation

## Overview

Novi uses two analytics systems:

1. **Firebase Analytics**: Standard product metrics (onboarding, clicks, navigation)
2. **Firestore Behavioral Events**: Detailed user behavior for ML training


## Firebase Analytics Events

### Onboarding Events
- `onboarding_started`
- `onboarding_step_completed`
- `onboarding_completed`
- `onboarding_abandoned`

### Recommendation Events
- `recommendations_viewed`
- `recommendation_card_clicked`
- `recommendation_details_viewed`
- `filter_changed`
- `refresh_clicked`

### Freeze Detection Events
- `freeze_detected`
- `intervention_shown`
- `intervention_dismissed`
- `intervention_accepted`

### Navigation Events
- `directions_clicked`


## Firestore Behavioral Events

**Collection:** `behavioral_events`

**Document Structure:**
```json
{
  "event_type": "scroll_event",
  "timestamp": Timestamp,
  "session_id": "session_abc123",
  "user_id": "user_xyz789",
  "scroll_direction": "down",
  "scroll_distance_px": 250,
  "scroll_velocity_px_per_sec": 125,
  "current_scroll_position": 1200,
  "total_page_height": 3000
}
```

### Event Types

#### venue_view
Logged when a venue card is visible in viewport for >500ms

**Properties:**
- `venue_id`: string
- `venue_name`: string
- `venue_category`: string
- `card_position`: number
- `time_in_viewport_ms`: number
- `scroll_position`: number

#### scroll_event
Logged on significant scroll (>50px)

**Properties:**
- `scroll_direction`: "up" | "down"
- `scroll_distance_px`: number
- `scroll_velocity_px_per_sec`: number
- `current_scroll_position`: number
- `total_page_height`: number

#### dwell_time_recorded
Logged when user leaves a page (>5 seconds)

**Properties:**
- `page_path`: string
- `total_time_seconds`: number
- `active_time_seconds`: number
- `idle_time_seconds`: number

#### back_button_pressed
Logged when browser back button is used

**Properties:**
- `from_page`: string
- `to_page`: string
- `time_on_page_seconds`: number

#### route_check
Logged when user checks directions/route to a venue

**Properties:**
- `venue_id`: string
- `venue_name`: string
- `check_count`: number (how many times checked route this session)
- `time_since_last_check_seconds`: number (optional, time between checks)


## Event Batching

Behavioral events are batched to reduce Firestore write costs:
- Flush every 5 seconds
- Flush immediately if batch reaches 10 events
- Flush on page unload


## Querying Behavioral Events

### Get all scrolls in a session
```javascript
const scrolls = await getDocs(
  query(
    collection(db, "behavioral_events"),
    where("event_type", "==", "scroll_event"),
    where("session_id", "==", sessionId)
  )
);
```

### Calculate average dwell time
```javascript
const dwells = await getDocs(
  query(
    collection(db, "behavioral_events"),
    where("event_type", "==", "dwell_time_recorded")
  )
);

const avgDwell = dwells.docs.reduce((sum, doc) => 
  sum + doc.data().total_time_seconds, 0
) / dwells.docs.length;
```


## Event Usage Patterns

### High-Value Event Sequences

**Successful recommendation flow:**
```
recommendations_viewed
→ venue_view (multiple cards)
→ recommendation_card_clicked
→ recommendation_details_viewed
→ directions_clicked
```

**Paralysis pattern:**
```
recommendations_viewed
→ venue_view (many cards, long dwell times)
→ filter_changed (multiple times)
→ scroll_event (up/down cycling)
→ freeze_detected
→ intervention_shown
```

**Hesitation pattern:**
```
recommendation_card_clicked
→ recommendation_details_viewed
→ route_check (1st time)
→ back_button_pressed
→ route_check (2nd time)
→ route_check (3rd time)  ← Trigger intervention
```

## Data Retention

**Firebase Analytics:**
- 14 months automatic retention
- Export to BigQuery for longer retention

**Firestore Behavioral Events:**
- No automatic deletion (manual cleanup required)
- Recommended: Archive events older than 90 days to Cloud Storage
- Keep recent data for real-time freeze detection
