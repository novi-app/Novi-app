# Novi · Your AI travel companion in Tokyo

Novi is a mobile-first AI travel companion for solo travelers in Tokyo. It eliminates decision paralysis by learning your preferences and surfacing the right venue at the right moment. No endless scrolling, no overwhelm.

## What it does

- **Personalized recommendations:** users select their preferred activity, vibe, and mood, and Novi returns a ranked shortlist of venues matched to their preferences using OpenAI embeddings and cosine similarity
- **Let Novi decide:** one-tap surprise recommendation from a pre-scored pool, for when the user doesn't want to think at all
- **Freeze detection:** a behavioral engine that monitors scroll patterns, tab switching, and repeated interactions to detect decision paralysis, then surfaces a timely nudge with a suggested venue
- **Save & revisit:** users can bookmark venues and come back to them later

## Tech stack

- **Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Deployed on Vercel

- **Backend:** FastAPI · Python · Deployed on Railway

- **Data & AI:** Firestore (venue + user data) · OpenAI `text-embedding-3-small` (preference and venue embeddings) · Google Places API (venue enrichment)

- **Analytics:** Firebase Analytics · Mixpanel · Firestore behavioral event log

## Where it's going

The current freeze detection system is rule-based, a deliberate starting point to ship fast and collect real behavioral data. The behavioral event log (Firestore) is being built in parallel as a training dataset. V2 will replace the rules with an ML-based model trained on how real users actually browse and decide. Beyond Tokyo, the longer-term vision is to expand Novi to other destinations and make it the go-to companion for solo travelers anywhere.
