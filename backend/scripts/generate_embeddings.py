import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path so we can import from app/
sys.path.insert(0, str(Path(__file__).parent.parent))

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
        print(f"OpenAI API error: {e}")
        raise

def create_venue_text(venue: Dict[str, Any]) -> str:
    parts = [
        venue.get('name', ''),
        venue.get('category', ''),
        venue.get('description', ''),
    ]
    
    # Filter out empty values and join
    text = ' '.join(filter(None, parts))
    return text.strip()

def load_venues(filepath: str) -> List[Dict[str, Any]]:
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"{filepath} not found!\n"
            f"Please run collect_venues.py first to create this file."
        )
    
    with open(filepath, 'r', encoding='utf-8') as f:
        venues = json.load(f)
    
    if not venues:
        raise ValueError(f"{filepath} is empty!")
    
    return venues

def upload_to_firebase(venue: Dict[str, Any]) -> None:
    db = get_db()

    doc_id = venue.get('place_id')
    if not doc_id:
        raise ValueError(f"Venue missing place_id: {venue.get('name')}")
    
    # Upload to Firestore
    db.collection('venues').document(doc_id).set(venue)

def generate_venue_insights(venue_text: str) -> Dict[str, Any]:
    """
    Generate solo score, reason, and pro tip using GPT-4 JSON mode.
    """
    system_prompt = (
        "You are a Tokyo travel expert for solo travelers. Analyze the provided venue. "
        "You must respond in JSON format with exactly three keys:\n"
        "1. 'solo_score': an integer from 0 to 100 rating how solo-friendly it is.\n"
        "2. 'solo_reason': a short string explaining the score.\n"
        "3. 'pro_tip': one specific insider tip for a solo traveler (maximum 20 words)."
    )

    try:
        # Note: using gpt-4-turbo as it natively supports strict JSON mode
        response = client.chat.completions.create(
            model="gpt-4-turbo", 
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": venue_text}
            ],
            temperature=0.7
        )
        
        result = json.loads(response.choices[0].message.content)

        solo_score = int(result.get('solo_score', 0))
        solo_reason = str(result.get('solo_reason', 'No reason provided.'))
        pro_tip = str(result.get('pro_tip', 'No tip available.'))
        return solo_score, solo_reason, pro_tip
        
    except Exception as e:
        print(f"GPT-4 API error: {e}")
        raise


#-----------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------
def main():
    """
    Main execution function.
    """
    print("Initializing Firebase...")
    try:
        initialize_firebase()
        print("Firebase connected\n")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        print("Make sure firebase-service-account.json exists")
        sys.exit(1)
    
    print("Loading venues from venues_raw.json...")
    try:
        venues = load_venues(r'data\venues\venues_raw.json')
        print(f"Loaded {len(venues)} venues\n")
    except Exception as e:
        print(f"{e}")
        sys.exit(1)
    
    print("Checking OpenAI API key...")
    if not settings.OPENAI_API_KEY:
        print("OPENAI_API_KEY not set in .env")
        sys.exit(1)
    print(f"API key found (starts with: {settings.OPENAI_API_KEY[:10]}...)\n")
    
    # Estimate cost
    embedding_cost = 0.0001
    gpt4_cost = 0.015  # Approx $0.015 for prompt + completion tokens per venue
    cost_per_venue = embedding_cost + gpt4_cost
    
    estimated_cost = len(venues) * cost_per_venue
    print(f"Estimated cost: ~${estimated_cost:.4f}")
    print(f"   ({len(venues)} venues × ~${cost_per_venue} per venue for Embedding + GPT-4)\n")

    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print("Cancelled by user")
        sys.exit(0)
    print()
    
    print("Processing venues...")
    print("-" * 60)
    
    success_count = 0
    error_count = 0
    
    for i, venue in enumerate(venues, 1):
        try:
            text = create_venue_text(venue)
            embedding = generate_embedding(text)
            solo_score, solo_reason, pro_tip = generate_venue_insights(text)
            
            # Add embedding to venue object
            venue['embedding'] = embedding
            venue['solo_score'] = solo_score
            venue['solo_reason'] = solo_reason
            venue['pro_tip'] = pro_tip
            
            # Upload to Firebase
            upload_to_firebase(venue)
            
            success_count += 1
            
        except Exception as e:
            print(f"Error: {e}")
            print()
            error_count += 1
            
            # Ask if should continue on error
            if error_count >= 3:
                cont = input("Multiple errors detected. Continue? (y/n): ")
                if cont.lower() != 'y':
                    break
    
    # Step 7: Summary
    print("-" * 60)
    print("\nSUMMARY")
    print("=" * 60)
    print(f"Successful: {success_count}/{len(venues)}")
    print(f"Failed:     {error_count}/{len(venues)}")
    print(f"Actual cost: ~${success_count * cost_per_venue:.4f}")
    print()
    
    if success_count == len(venues):
        print("All venues processed successfully!")
        print("Embeddings are now cached in Firebase.")
        print("You can delete venues_raw.json if desired.")
    elif success_count > 0:
        print("Some venues failed. Check errors above.")
        print("You can re-run this script to retry failed venues.")
    else:
        print("No venues were processed successfully.")
        print("Check your OpenAI API key and Firebase connection.")
    
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
