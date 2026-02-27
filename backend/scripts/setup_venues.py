"""
Collect venues from Google Places API.
Compares current venues (in Firestore) with uploaded ones (from Places API) to prevent duplication.
DATA-004: Collect 500 Tokyo venues across multiple categories using pagination and geographic shifting.

Usage: python scripts/setup_venues.py
"""
import requests
import json
import time
from pathlib import Path
from config import settings
from app.utils.firebase_client import initialize_firebase, get_db

def get_existing_place_ids() -> set:
    """
    Fetch all existing place_ids directly from Firestore to prevent duplicate AI processing.
    Uses .select([]) to strictly download IDs, saving bandwidth and memory.
    """
    initialize_firebase()
    db = get_db()
    
    print("Fetching existing venue IDs from Firestore...")
    docs = db.collection("venues").select([]).stream()
    existing_ids = {snap.id for snap in docs}

    return existing_ids

def get_price_level(category: str) -> int:
    """
    Safely estimate price level if Google API did not include it.
    """
    if category in ("park", "shinto shrine", "buddhist temple", "shopping mall"):
        return 0 # Free
    else:
        return 2 # Moderate

def collect_tokyo_venues():
    """Fetch venues from Google Places API using pagination and neighborhood shifts."""
    initialize_firebase()
    existing_ids = get_existing_place_ids()
    print(f"🛡️ Shield Active: Found {len(existing_ids)} existing venues in database.\n")
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.location,"
            "places.formattedAddress,places.rating,places.priceLevel,"
            "places.reviewSummary,nextPageToken" # <-- nextPageToken added here
        )
    }
    
    # Target 500 venues across 10 categories
    categories = {
        "restaurant": 120,
        "shopping mall": 50,
        "park": 50,
        "cafe": 100,
        "bar": 70,
        "museum": 50,
        "observation deck": 10,
        "amusement park": 10,
        "shinto shrine": 20,
        "buddhist temple": 20,
    }

    # Expanded neighborhoods to ensure we hit the 500 target without running out of map
    neighborhoods = [
        "Shibuya", "Shinjuku", "Ginza", "Roppongi", "Asakusa", 
        "Shimokitazawa", "Akihabara", "Ueno", "Ikebukuro", "Meguro",
        "Harajuku", "Ebisu", "Nakameguro"
    ]
    
    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }
    
    all_venues = []
    
    print("🚀 Starting Tokyo venue collection engine...\n")
    
    for category, target_count in categories.items():
        collected_for_category = 0
        print(f"--- Fetching {target_count} target venues for: {category.upper()} ---")
        
        for neighborhood in neighborhoods:
            if collected_for_category >= target_count:
                break # Move to the next category if we hit our target!
                
            page_token = ""
            
            while collected_for_category < target_count:
                payload = {
                    "textQuery": f"{category} in {neighborhood}, Tokyo",
                    "pageSize": 20 # Google's strict maximum
                }
                if page_token:
                    payload["pageToken"] = page_token
                
                try:
                    response = requests.post(url, json=payload, headers=headers, timeout=20)
                    
                    if response.status_code == 200:
                        data = response.json()
                        places = data.get("places", [])
                        
                        for place in places:
                            if collected_for_category >= target_count:
                                break # Stop processing if we hit the exact target mid-page
                                
                            place_id = place.get("id")
            
                            # THE SHIELD: Skip if it's already in Firestore
                            if place_id in existing_ids:
                                print(f"⏭️ Skipping duplicate: {place.get('displayName', {}).get('text')}")
                                continue

                            # Extract review summary
                            review_summary = place.get("reviewSummary", {})
                            description = review_summary.get("text", {}).get("text", "No reviews available")
                            description = description.removeprefix("People say this").strip().capitalize()
                            
                            # Map price level
                            raw_price = place.get("priceLevel", "UNKNOWN")
                            price_level = price_map.get(raw_price, get_price_level(category))
                            
                            # Structure venue data
                            venue = {
                                "place_id": place_id,
                                "name": place.get("displayName", {}).get("text", "Unknown"),
                                "category": category,
                                "location": place.get("location", {}),
                                "address": place.get("formattedAddress", "Unknown"),
                                "rating": place.get("rating", 0.0),
                                "price_level": price_level,
                                "description": description
                            }
                            
                            all_venues.append(venue)
                            existing_ids.add(place_id) # Add to shield so we don't process it twice!
                            collected_for_category += 1
                            
                            print(f"✨ Added: {venue['name']} ({collected_for_category}/{target_count})")
                        
                        # Pagination Check
                        page_token = data.get("nextPageToken")
                        if not page_token:
                            break # No more pages for this neighborhood, break the while loop
                            
                        # Required delay before using the next page token
                        time.sleep(2)
                        
                    else:
                        print(f"❌ API Error {response.status_code}: {response.text}")
                        break # Break the while loop on error to avoid infinite loops
                        
                except Exception as e:
                    print(f"❌ Exception occurred: {e}")
                    break
        
        print(f"✅ Finished collecting {category}s.\n")
    
    # Save to file
    data_dir = Path("data/venues")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = data_dir / "venues_raw.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_venues, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved {len(all_venues)} brand new venues to {output_file}")
    print("Next step: Run generate_embeddings.py to add AI features")

if __name__ == "__main__":
    if not settings.GOOGLE_PLACES_API_KEY:
        print("❌ GOOGLE_PLACES_API_KEY not set in .env")
        exit(1)
    
    collect_tokyo_venues()