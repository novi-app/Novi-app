# Novi System Architecture

This document provides a detailed overview of the system architecture for Novi, an AI-powered travel companion app designed to eliminate decision paralysis for solo travelers. It covers the overall structure, data flow, technology stack, and security considerations.

## System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│                    (Progressive Web App)                        │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────┐            │
│  │   Mobile   │   │   Desktop   │   │   Tablet     │            │
│  │   Browser  │   │   Browser   │   │   Browser    │            │
│  └─────┬──────┘   └──────┬──────┘   └──────┬───────┘            │
└────────┼─────────────────┼─────────────────┼────────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │ HTTPS
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│                   Next.js 14 PWA                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Pages & Components                            │  │
│  │  ┌────────────┐  ┌────────────────┐  ┌───────────────┐     │  │
│  │  │ Onboarding │  │ Recommendation │  │ Interventions │     │  │
│  │  │   Flow     │  │    Screen      │  │    System     │     │  │
│  │  └────────────┘  └────────────────┘  └───────────────┘     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Client-Side Logic                             │  │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌─────────────┐  │  │
│  │  │ Freeze Detector │  │ SessionTracker │  │ API Client  │  │  │
│  │  │ (Rules Engine)  │  │   (Analytics)  │  │             │  │  │
│  │  └─────────────────┘  └────────────────┘  └─────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────────┘
                           │ REST API
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Railway)                         │
│                   FastAPI (Python 3.11)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  API Endpoints                              │ │
│  │  POST /api/user/onboard                                     │ │
│  │  POST /api/recommendations                                  │ │
│  │  POST /api/intervention                                     │ │
│  │  POST /api/analytics/event                                  │ │
│  │  GET  /api/venue/:id                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Business Logic Services                       │  │
│  │  ┌─────────────────────┐  ┌───────────────────┐            │  │
│  │  │ Recommendation      │  │ Intervention      │            │  │
│  │  │ Engine              │  │ Generator         │            │  │
│  │  │                     │  │                   │            │  │
│  │  │ • Load embeddings   │  │ • Template select │            │  │
│  │  │ • Cosine similarity │  │ • Personalization │            │  │
│  │  │ • Score ranking     │  │ • Action mapping  │            │  │
│  │  └─────────────────────┘  └───────────────────┘            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────┬────────────────┬────────────────┬─────────────────────┘
           │                │                │
           ↓                ↓                ↓
┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   FIREBASE   │  │   OPENAI API    │  │ GOOGLE PLACES    │
│              │  │                 │  │      API         │
│ ┌──────────┐ │  │ ┌─────────────┐ │  │                  │
│ │Firestore │ │  │ │ Embeddings  │ │  │ • Venue search   │
│ │(Database)│ │  │ │   API       │ │  │ • Place details  │
│ │          │ │  │ │             │ │  │ • Photos         │
│ │• venues  │ │  │ │text-        │ │  │                  │
│ │• users   │ │  │ │embedding-   │ │  └──────────────────┘
│ │• sessions│ │  │ │ada-002      │ │
│ │• events  │ │  │ └─────────────┘ │
│ └──────────┘ │  │                 │
│ ┌──────────┐ │  │ ┌─────────────┐ │
│ │   Auth   │ │  │ │   GPT-4     │ │
│ │          │ │  │ │             │ │
│ └──────────┘ │  │ │• Solo score │ │
│ ┌──────────┐ │  │ │• Pro tips   │ │
│ │Analytics │ │  │ │• Interventns│ │
│ └──────────┘ │  │ └─────────────┘ │
└──────────────┘  └─────────────────┘
```

## Data Flow: Recommendation Request
```
1. User completes onboarding
   └─> Frontend: POST /api/user/onboard
       └─> Backend: Generate user embedding (OpenAI)
           └─> Firebase: Save user + embedding

2. User requests recommendations
   └─> Frontend: POST /api/recommendations
       └─> Backend:
           ├─> Firebase: Load user embedding (cached)
           ├─> Firebase: Load venue embeddings (cached)
           ├─> Compute: Cosine similarity (local math)
           ├─> Rank: Combine similarity + solo_score
           └─> Return: Top 3 venues
       └─> Frontend: Display VenueCards

Cost: ~$0 (all cached data, no API calls)
Time: <1 second
```

## Data Flow: Freeze Detection & Intervention
```
1. User browses venues
   └─> Frontend: Track events (view, scroll, back_button)
       └─> SessionTracker: Monitor patterns
           └─> FreezeDetector: Check rules
               └─> Rule matched (e.g., 5+ venues, no action)
                   └─> Trigger intervention

2. Generate intervention
   └─> Frontend: POST /api/intervention
       └─> Backend: Select template + personalize
           └─> Return: Message + suggested action
       └─> Frontend: Show InterventionModal

3. User takes action
   └─> Frontend: Execute action (show top pick, directions, etc.)
       └─> POST /api/analytics/event (log outcome)
           └─> Firebase: Save for ML training

Cost: $0 (using templates)
Time: <500ms
```

## Technology Stack

**Frontend:**
- Framework: Next.js 14 (React 18)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- PWA: Custom service worker
- State: React Context API
- Deploy: Vercel

**Backend:**
- Framework: FastAPI
- Language: Python 3.11
- ASGI Server: Uvicorn
- Deploy: Railway

**Database:**
- Primary: Firebase Firestore (NoSQL)
- Auth: Firebase Authentication
- Analytics: Firebase Analytics

**External APIs:**
- OpenAI: text-embedding-ada-002 (embeddings)
- OpenAI: GPT-4 (scoring, tips)
- Google Places: Venue data

**Infrastructure:**
- Version Control: GitHub
- CI/CD: Vercel (auto-deploy frontend), Railway (auto-deploy backend)
- Monitoring: Firebase Analytics, Railway logs

## Security Architecture

**Authentication Flow:**
```
User → Firebase Auth → JWT Token → Backend validates → Allow request
```

**API Key Management:**
- Frontend: Environment variables (NEXT_PUBLIC_*)
- Backend: Environment variables (server-side only)
- Secrets: Not committed to repo (.env in .gitignore)

**Data Privacy:**
- User data: Pseudonymous IDs only
- Location: Coarse-grained (city-level)
- Behavioral events: Aggregated, no PII
- Firestore rules: User can only access own data
