# Novi Database Schema

Firebase Firestore collections and document structures.

---

## Collection: `venues`

Stores all venue data with pre-computed AI features.

**Document ID:** `venue_<place_id>` (e.g., `venue_ChIJN1t_tDeuEmsRUsoyG83frY4`)

**Structure:**
```javascript
{
  // Core venue data
  venue_id: string,              // Google Places ID
  name: string,                  // "Trattoria Mario"
  category: string,              // "restaurant", "cafe", "bar", "attraction"
  cuisine: string | null,        // "Italian", "Japanese", null for non-restaurants
  
  // Location
  location: {
    lat: number,                 // 35.6762
    lng: number,                 // 139.6503
    address: string,             // "1-2-3 Shibuya, Tokyo, Japan"
    city: string                 // "Tokyo"
  },
  
  // Details
  description: string,           // Generated from Google reviews
  tags: string[],                // ["authentic", "casual", "local_favorite"]
  price_range: string,           // "$", "$$", "$$$", "$$$$"
  rating: number,                // 4.5 (from Google)
  
  // Hours (optional)
  hours: {
    monday: string,              // "11:00-22:00" or "closed"
    tuesday: string,
    // ... other days
  } | null,
  
  // Images
  images: string[],              // URLs from Google Places
  
  // AI-generated features (PRE-COMPUTED, CACHED)
  embedding: number[],           // 1536-dimensional vector from OpenAI
  solo_score: number,            // 0-100, from GPT-4
  solo_reason: string,           // Explanation for solo score
  pro_tip: string,               // One insider tip from GPT-4
  
  // Metadata
  created_at: timestamp,
  updated_at: timestamp
}
```

**Indexes:**
- `category` (for filtering by type)
- `location` (geohash for proximity queries)
- `city` (for city filtering)

**Total documents:** ~100-150 venues

---

## Collection: `users`

Stores user profiles and preference embeddings.

**Document ID:** Auto-generated Firebase ID

**Structure:**
```javascript
{
  user_id: string,               // Firebase Auth UID
  
  // User preferences
  preferences: {
    dietary: string[],           // ["vegetarian", "gluten-free"]
    budget: string,              // "budget", "moderate", "splurge"
    vibes: string[],             // ["authentic", "quiet", "trendy"]
    travel_style: string         // "fast_paced", "slow_explorer"
  },
  
  // AI-generated features (COMPUTED ONCE AT ONBOARDING)
  embedding: number[],           // 1536-dimensional vector from preferences
  
  // Metadata
  created_at: timestamp,
  last_active: timestamp
}
```

**Indexes:**
- `user_id` (unique)

**Total documents:** ~20-30 users for MVP

---

## Collection: `sessions`

Stores user sessions for tracking and labeling.

**Document ID:** Auto-generated Firebase ID

**Structure:**
```javascript
{
  session_id: string,            // Unique session identifier
  user_id: string,               // Link to users collection
  
  // Session data
  started_at: timestamp,
  ended_at: timestamp | null,
  
  // User activity summary
  venues_viewed: string[],       // List of venue IDs viewed
  venues_viewed_count: number,
  back_button_count: number,
  route_checks_count: number,
  
  // Interventions during session
  interventions_triggered: [
    {
      trigger_type: string,      // "too_many_options", etc.
      timestamp: timestamp,
      engaged: boolean,          // Did user interact with it?
      action_taken: string | null // "show_top_pick", "dismissed", null
    }
  ],
  
  // Ground truth label (FROM POST-DECISION SURVEY)
  user_felt_stuck: boolean | null,  // Did user report feeling stuck?
  label_timestamp: timestamp | null,
  
  // Context
  location: {
    lat: number,
    lng: number
  },
  intent: string                 // "dinner", "lunch", etc.
}
```

**Indexes:**
- `user_id` (for querying user's sessions)
- `started_at` (for time-based queries)

**Total documents:** ~100-200 sessions for MVP

---

## Collection: `behavioral_events`

Stores detailed behavioral signals for ML training.

**Document ID:** Auto-generated Firebase ID

**Structure:**
```javascript
{
  event_id: string,              // Unique event identifier
  session_id: string,            // Link to sessions collection
  user_id: string,               // Link to users collection
  
  // Event details
  timestamp: number,             // Unix timestamp (milliseconds)
  event_type: string,            // Event category (see below)
  
  // Context
  screen: string,                // "recommendations", "venue_detail", etc.
  venue_id: string | null,       // Relevant venue (if applicable)
  
  // Behavioral signals (varies by event_type)
  scroll_velocity: number | null,     // pixels/second
  dwell_time: number | null,          // seconds on current screen
  venues_viewed_count: number | null,
  back_button_count: number | null,
  revisit_count: number | null,       // times returned to same venue
  time_on_screen: number | null       // total seconds
}
```

**Event Types:**
- `"venue_view"` - User viewed a venue card
- `"venue_detail"` - User clicked into venue detail page
- `"back_button"` - User pressed back
- `"route_check"` - User checked directions
- `"scroll"` - User scrolled (tracked periodically)
- `"save_venue"` - User saved a venue
- `"intervention_shown"` - Intervention displayed
- `"intervention_engaged"` - User clicked on intervention
- `"intervention_dismissed"` - User dismissed intervention

**Indexes:**
- `session_id` (for querying session events)
- `event_type` (for filtering by type)
- `timestamp` (for time-based queries)

**Total documents:** ~2,000-5,000 events for MVP (20 users × 10 sessions × 10-25 events)

---

## Collection: `interventions`

Logs all interventions for analysis.

**Document ID:** Auto-generated Firebase ID

**Structure:**
```javascript
{
  intervention_id: string,
  session_id: string,            // Link to sessions
  user_id: string,
  
  // Intervention details
  trigger_type: string,          // What caused intervention
  message: string,               // Message shown to user
  suggested_action: string,      // "show_top_pick", "compare_top_2", etc.
  
  // User response
  user_action: string | null,    // "engaged", "dismissed", "ignored"
  action_timestamp: timestamp | null,
  
  // Metadata
  created_at: timestamp
}
```

**Indexes:**
- `session_id` (for session-level analysis)
- `trigger_type` (for analyzing which triggers work best)

**Total documents:** ~50-100 interventions for MVP

---

## Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Venues: Public read, no write
    match /venues/{venueId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Users: Own data only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions: Own data only
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == resource.data.user_id;
    }
    
    // Behavioral events: Write only (backend aggregates for reading)
    match /behavioral_events/{eventId} {
      allow read: if false;  // Only backend can read
      allow write: if request.auth != null;
    }
    
    // Interventions: Backend only
    match /interventions/{interventionId} {
      allow read, write: if false;  // Backend handles all access
    }
  }
}
```

---

## Data Retention Policy

**Development:**
- Keep all data indefinitely for learning

**Production (Post-MVP):**
- User data: Delete after 90 days of inactivity or on user request
- Behavioral events: Aggregate and anonymize after 30 days
- Venues: Keep indefinitely (public data)

---

## Backup Strategy

- **Firebase automatic backups:** Daily
- **Manual exports:** Weekly during beta testing

---

## Future Considerations (Post-MVP)

1. **Add indexes** for complex queries as usage grows
2. **Partition collections** if they exceed 1M documents
3. **Implement caching layer** (Redis) for frequently accessed venues
4. **Archive old sessions** to reduce read costs
