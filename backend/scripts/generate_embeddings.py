import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from openai import OpenAI
from config import settings
from app.utils.firebase_client import initialize_firebase, get_db

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_embedding(venue_text: str) -> List[float]:
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=venue_text
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Embedding API error: {e}")


def create_venue_text(venue: Dict[str, Any]) -> str:
    parts = [
        venue.get("category", ""),
        venue.get("description", ""),
    ]
    return " ".join(filter(None, parts)).strip()


def get_price_text(price_level: int) -> str:
    price_map = {
        0: "Free",
        1: "Budget (Under ¥1,500)",
        2: "Moderate (¥1,500 - ¥3,000)",
        3: "Upscale (¥3,000 - ¥6,000)",
        4: "Luxury (Over ¥6,000)"
    }
    return price_map.get(price_level, "Price unknown")


def get_hours_summary(opening_hours: dict) -> str:
    if not opening_hours:
        return "Hours not available"
    
    weekday_text = opening_hours.get("weekdayDescriptions", [])
    if weekday_text and len(weekday_text) > 0:
        return weekday_text[0]
    
    if opening_hours.get("openNow"):
        return "Currently open"
    
    return "Check venue for hours"


def generate_venue_insights(venue: Dict[str, Any]) -> Dict[str, Any]:
    context = f"""
      Venue: {venue.get('name', 'Unknown')}
      Category: {venue.get('category', 'Unknown')}
      Description: {venue.get('description', 'No description available')}
      Rating: {venue.get('rating', 'N/A')}/5.0
      Reviews: {venue.get('reviews_count', 0):,} reviews
      Price: {get_price_text(venue.get('price_level', 0))}
      Hours: {get_hours_summary(venue.get('opening_hours', {}))}
      Phone: {venue.get('phone', 'Not available')}
      Website: {venue.get('website', 'Not available')}
      Address: {venue.get('address', 'Unknown')}
      Google Categories: {', '.join(venue.get('google_types', [])[:3])}
      """.strip()
    
    system_prompt = """
You are a Tokyo travel expert specializing in solo travelers. Analyze the venue and respond in JSON with exactly four keys:

1. "solo_score": integer 0-100 rating how solo-friendly this venue is
   - 90-100: Exceptional for solo (counter seating, explicitly solo-friendly culture, very welcoming)
   - 70-89: Good for solo (flexible seating, quiet atmosphere, solo travelers common)
   - 50-69: Neutral (works for solo but not optimized, typical restaurant/attraction)
   - 30-49: Challenging for solo (group-oriented, might feel awkward alone)
   - 0-29: Poor for solo (large group tables only, couples-focused, uncomfortable alone)
   - BE STRICT: Use the full range. Most venues should be 50-80, not 85-95.

2. "solo_reason": short explanation (max 30 words)
   - Explain WHY this score based on seating, atmosphere, service style
   - Be specific: "Counter seating available" not "good for solo"

3. "pro_tip": one specific, actionable tip for solo travelers (max 25 words)
   - Use the actual data: rating, hours, price, reviews to make it practical
   - Examples: "Reserve via phone - popular spot fills by 7pm (4.8★, 2.3k reviews)"
             "Visit 2-4pm for quieter atmosphere and shorter wait"
             "Counter seating available - request it when you arrive"
   - Make it ACTIONABLE and SPECIFIC to THIS venue

4. "tags": array of 3-5 solo-traveler-relevant tags
   - Choose from: "Solo Friendly", "Counter Seating", "Quick Service", 
                  "Reservation Recommended", "Budget-Friendly", "Local Favorite",
                  "Quiet Atmosphere", "English Menu", "Late Night", "Michelin Rated",
                  "Vegetarian Options", "Open Late", "Walk-ins Welcome", "Cozy", "Lively"
   - Base tags on actual venue data (rating, price, category, description, hours)
   - Don't guess - if data doesn't support a tag, don't include it
""".strip()
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            temperature=0.7
        )
        
        result = json.loads(response.choices[0].message.content)
        
        return {
            "solo_score": int(result.get("solo_score", 50)),
            "solo_reason": str(result.get("solo_reason", "")),
            "pro_tip": str(result.get("pro_tip", "")),
            "tags": result.get("tags", []),
        }
        
    except Exception as e:
        raise Exception(f"GPT-4 API error: {e}")


def load_venues(filepath: str) -> List[Dict[str, Any]]:
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"{filepath} not found! Run setup_venues.py first.")
    
    with open(path, "r", encoding="utf-8") as f:
        venues = json.load(f)
    
    if not venues:
        raise ValueError(f"{filepath} is empty!")
    
    return venues


def upload_to_firebase(venue: Dict[str, Any]) -> None:
    db = get_db()
    doc_id = venue.get("place_id")
    if not doc_id:
        raise ValueError(f"Venue missing place_id: {venue.get('name')}")
    
    db.collection("venues").document(doc_id).set(venue)


def main():
    print("=" * 60)
    print("NOVI VENUE PIPELINE")
    print("Embeddings + Solo Scores + Pro Tips + Tags")
    print("Using full venue context for higher quality insights")
    print("=" * 60)
    print()
    
    print("Initializing Firebase...")
    try:
        initialize_firebase()
        print("Firebase connected\n")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        sys.exit(1)
    
    print("Loading venues...")
    venue_file = Path("data/venues/venues_raw.json")
    
    try:
        venues = load_venues(venue_file)
        print(f"Loaded {len(venues)} venues\n")
    except Exception as e:
        print(f"✗ {e}")
        sys.exit(1)
    
    print("Checking OpenAI API key...")
    if not settings.OPENAI_API_KEY:
        print("OPENAI_API_KEY not set in .env")
        sys.exit(1)
    print(f"Found (starts with: {settings.OPENAI_API_KEY[:10]}...)\n")
    
    estimated_cost = len(venues) * 0.0003
    print(f"Estimated cost: ${estimated_cost:.2f}")
    print(f"Expected runtime: {len(venues) * 3 // 60} minutes\n")
    
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print("Cancelled by user")
        sys.exit(0)
    print()
    
    print("Processing venues...")
    print("-" * 60)
    
    success = 0
    errors = 0
    
    for i, venue in enumerate(venues, 1):
        venue_name = venue.get("name", "Unknown")
        
        try:
            embedding_text = create_venue_text(venue)
            
            print(f"[{i}/{len(venues)}] {venue_name[:40]}")
            print(f"  Text: {embedding_text[:55]}...")
            
            embedding = generate_embedding(embedding_text)
            print(f"  Embedding: {len(embedding)} dims")
            
            insights = generate_venue_insights(venue)
            print(f"  Solo score: {insights['solo_score']}/100")
            print(f"  Tags: {', '.join(insights['tags'][:3])}")
            print(f"  Tip: {insights['pro_tip'][:45]}...")
            
            venue["embedding"] = embedding
            venue["solo_score"] = insights["solo_score"]
            venue["solo_reason"] = insights["solo_reason"]
            venue["pro_tip"] = insights["pro_tip"]
            venue["tags"] = insights["tags"]
            
            upload_to_firebase(venue)
            print(f"  Uploaded to Firebase")
            print()
            
            success += 1
            
        except Exception as e:
            print(f"  Error: {e}")
            print()
            errors += 1
            
            if errors >= 5:
                cont = input("Multiple errors detected. Continue? (y/n): ")
                if cont.lower() != "y":
                    break
                errors = 0
    
    print("-" * 60)
    print("\nSUMMARY")
    print("=" * 60)
    print(f"Successful: {success}/{len(venues)}")
    print(f"Failed:     {errors}/{len(venues)}")
    
    if success == len(venues):
        print("\nAll venues processed successfully!")
        print("Data is now in Firebase with:")
        print("  - Embeddings (for semantic search)")
        print("  - Solo scores (for quality signals)")
        print("  - Pro tips (actionable advice)")
        print("  - Tags (UI display)")
    elif success > 0:
        print(f"\n{errors} venues failed. Re-run script to retry failed venues.")
    else:
        print("\nNo venues processed. Check API keys and Firebase connection.")
    
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
