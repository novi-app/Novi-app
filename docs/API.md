# Novi API Documentation

Base URL: `https://novi-backend.railway.app` (production)  
Local: `http://localhost:8000`

## Authentication

All endpoints require Firebase Authentication token in header:
```
Authorization: Bearer <firebase-jwt-token>
```

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "novi-api",
  "version": "1.0.0"
}
```

---

### 2. User Onboarding

**POST** `/api/user/onboard`

Create user profile and generate preference embedding.

**Request Body:**
```json
{
  "preferences": {
    "dietary": ["vegetarian", "gluten-free"],
    "budget": "moderate",
    "vibes": ["authentic", "quiet"],
    "travelStyle": "slow_explorer"
  }
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "status": "success",
  "message": "User onboarded successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request body
- `500` - Server error

---

### 3. Get Recommendations

**POST** `/api/recommendations`

Get personalized venue recommendations.

**Request Body:**
```json
{
  "user_id": "user_abc123",
  "location": {
    "lat": 35.6762,
    "lng": 139.6503
  },
  "intent": "dinner"
}
```

**Parameters:**
- `user_id` (string, required) - User ID from onboarding
- `location.lat` (float, required) - Latitude
- `location.lng` (float, required) - Longitude
- `intent` (string, required) - Category: "dinner", "lunch", "cafe", "bar", "attraction"

**Response:**
```json
{
  "recommendations": [
    {
      "venue_id": "venue_001",
      "name": "Trattoria Mario",
      "category": "restaurant",
      "location": {
        "lat": 35.6764,
        "lng": 139.6505,
        "address": "1-2-3 Shibuya, Tokyo"
      },
      "solo_score": 85,
      "solo_reason": "Bar seating and communal tables make it easy for solo diners",
      "pro_tip": "Try the ramen, arrive before 7pm to avoid wait",
      "match_score": 0.89,
      "distance_km": 0.3,
      "walk_time_min": 4
    }
    // ... 2 more venues
  ],
  "timestamp": "2026-02-19T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameters
- `404` - User not found
- `500` - Server error

---

### 4. Generate Intervention

**POST** `/api/intervention`

Generate personalized intervention message.

**Request Body:**
```json
{
  "user_id": "user_abc123",
  "trigger_type": "too_many_options",
  "context": {
    "venues_viewed": ["venue_001", "venue_002", "venue_003"],
    "session_duration": 180000
  }
}
```

**Parameters:**
- `trigger_type` (string, required) - One of:
  - `"too_many_options"` - User viewed 5+ venues
  - `"indecisive_browsing"` - User went back multiple times
  - `"stationary_indecision"` - User stationary with route checks
  - `"timeout"` - User inactive for 3+ minutes

**Response:**
```json
{
  "message": "Looking at a lot of options! Want me to narrow it down to my top pick based on your vibe?",
  "trigger_type": "too_many_options",
  "suggested_action": "show_top_pick",
  "timestamp": "2026-02-19T10:32:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid trigger type
- `500` - Server error

---

### 5. Log Analytics Events

**POST** `/api/analytics/event`

Log behavioral events for ML training.

**Request Body:**
```json
{
  "events": [
    {
      "session_id": "session_456",
      "timestamp": 1708340400000,
      "event_type": "venue_view",
      "venue_id": "venue_001",
      "scroll_velocity": 0.4,
      "dwell_time": 45
    },
    {
      "session_id": "session_456",
      "timestamp": 1708340460000,
      "event_type": "back_button"
    }
  ]
}
```

**Response:**
```json
{
  "status": "logged",
  "count": 2
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid event format
- `500` - Server error

---

### 6. Get Venue Details

**GET** `/api/venue/:id`

Get full details for a specific venue.

**Response:**
```json
{
  "venue_id": "venue_001",
  "name": "Trattoria Mario",
  "category": "restaurant",
  "description": "Traditional Italian trattoria...",
  "location": {
    "lat": 35.6764,
    "lng": 139.6505,
    "address": "1-2-3 Shibuya, Tokyo"
  },
  "solo_score": 85,
  "solo_reason": "Bar seating and communal tables...",
  "pro_tip": "Try the ramen...",
  "rating": 4.5,
  "price_range": "$$",
  "hours": {
    "monday": "11:00-22:00",
    "tuesday": "11:00-22:00"
    // ...
  },
  "images": [
    "https://maps.googleapis.com/...",
    "https://maps.googleapis.com/..."
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Venue not found
- `500` - Server error

---

## Error Response Format

All errors return:
```json
{
  "detail": "Error message explaining what went wrong"
}
```

---

## Rate Limits

- **Development:** No limits
- **Production:** 100 requests/minute per IP

---

## Testing

Interactive API docs available at:
- Local: http://localhost:8000/docs
- Production: https://novi-backend.railway.app/docs

Use the "Try it out" feature to test endpoints.
