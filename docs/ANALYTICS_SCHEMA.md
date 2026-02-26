# Analytics Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Firebase Analytics Events](#firebase-analytics-events)
3. [Mixpanel Integration](#mixpanel-integration)
4. [Firestore Behavioral Events](#firestore-behavioral-events)
5. [Event Batching](#event-batching)
6. [Querying Behavioral Events](#querying-behavioral-events)
7. [Event Usage Patterns](#event-usage-patterns)
8. [Analytics System Comparison](#analytics-system-comparison)
9. [Data Retention](#data-retention)
10. [Implementation](#implementation)
11. [Privacy & Compliance](#privacy-compliance)

## 1. Overview

Novi uses a three-tier analytics strategy:

1. **Firebase Analytics**: Standard product metrics (onboarding, clicks, navigation) - auto-synced dashboards
2. **Mixpanel**: Advanced user-level analysis (funnels, cohorts, A/B testing)
3. **Firestore Behavioral Events**: Detailed behavioral data for ML model training

All events are tracked once via `trackEvent()` and automatically sent to both Firebase Analytics and Mixpanel.

## 2. Firebase Analytics Events

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


## 3. Mixpanel Integration

### Dual-Tracking Strategy
All Firebase Analytics events are automatically sent to Mixpanel for advanced analysis. No duplicate tracking code required.

### User Identification
When users complete onboarding, we identify them in Mixpanel with their profile data:
```typescript
identifyUser(userId, {
  dietary: ["vegetarian", "gluten-free"],
  budget: 2,
  activities: ["food", "explore"],
  signup_date: "2026-02-26T10:30:00Z",
  device_type: "mobile"
});
```

### Mixpanel-Specific Features

**User Profiles:**
- Track preferences across sessions
- Analyze behavior by dietary restrictions, budget, or activities
- Identify high-value user segments

**Advanced Queries:**
```
"Show me all vegan users who saw 5+ recommendations but didn't click any"
"What's the conversion rate from freeze_detected → intervention_accepted?"
"Which budget level has the highest completion rate?"
```

**Funnels:**
- Onboarding completion funnel
- Recommendation → Details → Directions conversion
- Intervention effectiveness

**Cohorts:**
- Users by signup date
- Users by dietary preference
- Users who experienced freeze detection


## 4. Firestore Behavioral Events

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


## 5. Event Batching

Behavioral events are batched to reduce Firestore write costs:
- Flush every 5 seconds
- Flush immediately if batch reaches 10 events
- Flush on page unload


## 6. Querying Behavioral Events

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


## 7. Event Usage Patterns

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

### Mixpanel Analysis Examples

**Funnel: Onboarding to First Recommendation Click**
```
onboarding_started (100%)
→ onboarding_step_completed (step_name: dietary) (85%)
→ onboarding_step_completed (step_name: budget) (78%)
→ onboarding_step_completed (step_name: activity) (72%)
→ onboarding_completed (68%)
→ recommendations_viewed (68%)
→ recommendation_card_clicked (45%)
```

**Cohort: Users Who Experienced Interventions**
```sql
-- Mixpanel query
SELECT user_id, COUNT(*) as intervention_count
FROM events
WHERE event_name = 'intervention_shown'
GROUP BY user_id
HAVING intervention_count >= 1
```

**Retention Analysis:**
Track users who return after first visit and generate recommendations again.

## 8. Analytics System Comparison

| Feature | Firebase Analytics | Mixpanel | Firestore Events |
|---------|-------------------|----------|------------------|
| **Purpose** | Standard metrics | User analysis | ML training data |
| **Events** | All product events | Same (auto-synced) | Behavioral only |
| **Dashboards** | Auto-generated | Custom | Build your own |
| **User Profiles** | Limited | Rich profiles | None |
| **Funnels** | Basic | Advanced | Manual queries |
| **Retention** | 14 months | Unlimited | Manual cleanup |
| **Real-time** | Yes | Yes | Yes |
| **Export** | BigQuery | CSV/API | Firestore queries |

### When to Use Which System

- **Firebase Analytics:** Quick overview, standard product metrics, automatic dashboards  
- **Mixpanel:** Deep user analysis, complex funnels, cohort behavior, A/B testing  
- **Firestore:** ML model training, custom behavioral analysis, raw data access


## 9. Data Retention

**Firebase Analytics:**
- 14 months automatic retention
- Export to BigQuery for longer retention
- No user-level data deletion (anonymous by default)

**Mixpanel:**
- Unlimited retention on paid plans
- Free tier: 1 year retention
- User deletion available (GDPR compliance)
- Export via API or CSV

**Firestore Behavioral Events:**
- No automatic deletion (manual cleanup required)
- Recommended: Archive events older than 90 days to Cloud Storage
- Keep recent data (30 days) for real-time freeze detection

## 10. Implementation

### Tracking Events
All events use a single unified function:
```typescript
import { trackEvent } from "@/lib/analytics";

// Automatically tracks to BOTH Firebase Analytics and Mixpanel
trackEvent("recommendation_card_clicked", {
  venue_id: "venue_123",
  venue_name: "Tsuta Ramen",
  venue_category: "restaurant",
  card_position: 1,
  combined_score: 0.87,
  distance_km: 2.3,
});
```

### User Identification
Identify users after onboarding to enable Mixpanel user profiles:
```typescript
import { identifyUser } from "@/lib/analytics";

identifyUser(userId, {
  dietary: ["vegetarian"],
  budget: 2,
  activities: ["food", "explore"],
  signup_date: new Date().toISOString(),
});
```

### Configuration
Add Mixpanel token to environment variables:
```bash
# .env.local
NEXT_PUBLIC_MIXPANEL_TOKEN=token_here
```

If token is missing, Mixpanel tracking is silently skipped (Firebase continues working).


## 11. Privacy & Compliance

### User Data Collection
- **Session ID:** Anonymous identifier, no PII
- **User ID:** Generated UUID, not linked to email/name
- **Event Properties:** No collection of email, phone, or other PII
- **Location:** Only coordinates for recommendation matching (not stored long-term)

### GDPR Compliance
Users can request data deletion:
- **Firebase Analytics:** Anonymous by default, no user-level deletion needed
- **Mixpanel:** Use `mixpanel.people.delete_user()` API
- **Firestore:** Delete all documents where `user_id` matches

### Do Not Track
Both systems respect browser DNT settings:
```typescript
mixpanel.init(token, {
  ignore_dnt: false, // Respects Do Not Track
});
```
