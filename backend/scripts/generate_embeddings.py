"""
One-time script to generate embeddings and AI insights for all venues.
Combines DATA-005 (embeddings), DATA-007 (solo scores), DATA-008 (pro tips).

Usage: python scripts/generate_embeddings.py
"""
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
from openai import OpenAI
from config import settings
from app.utils.firebase_client import initialize_firebase, get_db

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_embedding(venue_text: str) -> List[float]:
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=venue_text
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Embedding API error: {e}")

def create_venue_text(venue: Dict[str, Any]) -> str:
    parts = [
        venue.get("name", ""),
        venue.get("category", ""),
        venue.get("description", ""),
    ]
    return " ".join(filter(None, parts)).strip()


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
def generate_venue_insights(venue_text: str) -> Tuple[int, str, str]:
    """
    Generate solo score, reason, and pro tip using GPT-4.
    Returns: (solo_score, solo_reason, pro_tip)
    """
    system_prompt = (
        "You are a Tokyo travel expert for solo travelers. Analyze the venue. "
        "Respond in JSON with exactly three keys:\n"
        "1. 'solo_score': integer 0-100 rating solo-friendliness\n"
        "2. 'solo_reason': short explanation (max 30 words)\n"
        "3. 'pro_tip': one specific insider tip for solo travelers (max 20 words)"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": venue_text}
            ],
            temperature=1.0
        )
        
        result = json.loads(response.choices[0].message.content)
        
        solo_score = int(result.get("solo_score", 50))
        solo_reason = str(result.get("solo_reason", "No reason provided"))
        pro_tip = str(result.get("pro_tip", "No tip available"))
        
        return solo_score, solo_reason, pro_tip
        
    except Exception as e:
        raise Exception(f"GPT-4 API error: {e}")



def main():
    print("=" * 60)
    print("NOVI VENUE PIPELINE")
    print("Embeddings + Solo Scores + Pro Tips")
    print("=" * 60)
    print()
    
    # Initialize Firebase
    print("Initializing Firebase...")
    try:
        initialize_firebase()
        print("Firebase connected\n")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        sys.exit(1)
    
    # Load venues
    print("Loading venues...")
    venue_file = Path("data/venues/venues_raw.json")
    
    try:
        venues = load_venues(venue_file)
        print(f"Loaded {len(venues)} venues\n")
    except Exception as e:
        print(f"{e}")
        sys.exit(1)
    
    print("Checking OpenAI API key...")
    if not settings.OPENAI_API_KEY:
        print("OPENAI_API_KEY not set in .env")
        sys.exit(1)
    print(f"Found (starts with: {settings.OPENAI_API_KEY[:10]}...)\n")

    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print("Cancelled by user")
        sys.exit(0)
    print()
    
    # Process venues
    print("Processing venues...")
    print("-" * 60)
    
    success = 0
    errors = 0
    
    for i, venue in enumerate(venues, 1):
        venue_name = venue.get("name", "Unknown")
        
        try:
            # Create text
            text = create_venue_text(venue)
            
            print(f"[{i}/{len(venues)}] {venue_name}")
            print(f"Text: {text[:60]}...")
            
            # Generate embedding
            embedding = generate_embedding(text)
            print(f"Embedding: {len(embedding)} dims")
            
            # Generate AI insights
            solo_score, solo_reason, pro_tip = generate_venue_insights(text)
            print(f"Solo score: {solo_score}/100")
            print(f"Tip: {pro_tip[:40]}...")
            
            # Add to venue
            venue["embedding"] = embedding
            venue["solo_score"] = solo_score
            venue["solo_reason"] = solo_reason
            venue["pro_tip"] = pro_tip
            
            # Upload
            upload_to_firebase(venue)
            print(f"Uploaded to Firebase")
            print()
            
            success += 1
            
        except Exception as e:
            print(f"Error: {e}")
            print()
            errors += 1
            
            if errors >= 3:
                cont = input("Multiple errors. Continue? (y/n): ")
                if cont.lower() != "y":
                    break
    
    # Summary
    print("-" * 60)
    print("\nSUMMARY")
    print("=" * 60)
    print(f"Successful: {success}/{len(venues)}")
    print(f"Failed:     {errors}/{len(venues)}")
    
    if success == len(venues):
        print("All venues processed!")
        print("Data is now in Firebase with embeddings, scores, and tips.")
    elif success > 0:
        print("Some failed. Re-run to retry.")
    else:
        print("No venues processed. Check API keys and Firebase.")
    
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
