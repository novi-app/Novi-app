"""
Collect 500+ diverse Tokyo venues optimized for solo travelers.
Ensures balanced distribution across price levels and solo-friendliness.
"""
import requests
import json
import time
from pathlib import Path
from firebase_admin import storage
from config import settings
from app.utils.firebase_client import initialize_firebase, get_db


def upload_photo_to_storage(photo_url: str, venue_id: str, photo_index: int = 0) -> str:
    """Download photo from Google and upload to Firebase Storage."""
    try:
        response = requests.get(photo_url, timeout=15)
        if response.status_code != 200:
            return None
        
        bucket = storage.bucket()
        blob = bucket.blob(f"venue_photos/{venue_id}_{photo_index}.jpg")
        blob.upload_from_string(response.content, content_type="image/jpeg")
        blob.make_public()
        
        return blob.public_url
        
    except Exception as e:
        print(f"Photo upload failed: {e}")
        return None


def get_existing_place_ids() -> set:
    """Fetch existing place_ids from Firestore to prevent duplicates."""
    initialize_firebase()
    db = get_db()
    
    print("Fetching existing venue IDs from Firestore...")
    docs = db.collection("venues").select([]).stream()
    existing_ids = {snap.id for snap in docs}
    return existing_ids


def get_price_level(category: str) -> int:
    """Estimate price level if Google API doesn't provide it."""
    free_categories = ["park", "shinto shrine", "buddhist temple", "observation deck"]
    if category in free_categories or "shrine" in category or "temple" in category:
        return 0
    elif "budget" in category:
        return 1
    else:
        return 2


def get_search_query(category: str, neighborhood: str) -> str:
    """Generate optimized search query for better targeting."""
    
    # Budget-specific queries
    budget_queries = {
        "budget restaurant": "cheap affordable budget restaurant",
        "budget cafe": "affordable budget coffee shop",
    }
    
    # Solo-friendly modifiers
    solo_queries = {
        "izakaya": "counter seating izakaya solo-friendly",
        "onsen": "solo traveler onsen hot spring",
    }
    
    # Use specific query if available
    if category in budget_queries:
        query = budget_queries[category]
    elif category in solo_queries:
        query = solo_queries[category]
    else:
        query = category
    
    return f"{query} in {neighborhood}, Tokyo"


def get_neighborhoods_for_category(category: str) -> list:
    """Return appropriate neighborhoods based on category."""
    
    neighborhoods = {
        "premium": ["Ginza", "Roppongi", "Shibuya", "Shinjuku"],
        "moderate": ["Harajuku", "Ebisu", "Nakameguro", "Ikebukuro", "Meguro"],
        "budget": ["Shimokitazawa", "Koenji", "Asagaya", "Kichijoji", "Sangenjaya"],
        "general": ["Asakusa", "Ueno", "Akihabara", "Yanaka"],
    }
    
    # Budget categories use budget + moderate neighborhoods
    if "budget" in category:
        return neighborhoods["budget"] + neighborhoods["moderate"]
    
    # Premium categories use premium + moderate
    elif category in ["observation deck", "museum"]:
        return neighborhoods["premium"] + neighborhoods["moderate"]
    
    # Everything else uses moderate + general
    else:
        return neighborhoods["moderate"] + neighborhoods["general"]


def collect_tokyo_venues():
    """Fetch 500+ diverse venues optimized for solo travelers."""
    initialize_firebase()
    existing_ids = get_existing_place_ids()
    print(f"Found {len(existing_ids)} existing venues in database.\n")
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.location,"
            "places.formattedAddress,places.rating,places.priceLevel,"
            "places.reviewSummary,places.photos,nextPageToken"
        )
    }
    
    # Optimized distribution for solo travelers
    categories = {
        # FOOD - Budget Distribution (40% budget-focused)
        "budget restaurant": 40,
        "restaurant": 80,
        "budget cafe": 30,
        "cafe": 70,
        
        # SOCIAL (Solo-friendly drinking/dining)
        "bar": 40,
        "izakaya": 30,
        
        # EXPLORE
        "museum": 40,
        "shinto shrine": 20,
        "buddhist temple": 20,
        "bookstore": 15,
        
        # UNWIND
        "park": 30,
        "onsen": 15,
        "spa": 10,
        
        # SHOPPING
        "shopping mall": 25,
        "shopping street": 20,
        
        # SIGHTSEEING
        "observation deck": 10,
        "amusement park": 5,
    }
    
    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }
    
    all_venues = []
    price_distribution = {0: 0, 1: 0, 2: 0, 3: 0}
    
    print("Starting optimized Tokyo venue collection...\n")
    
    for category, target_count in categories.items():
        collected_for_category = 0
        neighborhoods = get_neighborhoods_for_category(category)
        
        print(f"--- {category.upper()}: Target {target_count} venues ---")
        
        for neighborhood in neighborhoods:
            if collected_for_category >= target_count:
                break
                
            page_token = ""
            
            while collected_for_category < target_count:
                # Get optimized search query
                search_query = get_search_query(category, neighborhood)
                
                payload = {
                    "textQuery": search_query,
                    "pageSize": 20
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
                                break
                                
                            place_id = place.get("id")
            
                            # Skip duplicates
                            if place_id in existing_ids:
                                continue

                            # Extract review summary
                            review_summary = place.get("reviewSummary", {})
                            description = review_summary.get("text", {}).get("text", "")
                            if description:
                                description = description.removeprefix("People say this").strip().capitalize()
                            else:
                                description = "Popular spot in Tokyo"
                            
                            # Map price level
                            raw_price = place.get("priceLevel", "UNKNOWN")
                            price_level = price_map.get(raw_price, get_price_level(category))
                            
                            # Track distribution
                            price_distribution[price_level] += 1
                            
                            # Fetch photos (up to 4)
                            photos = place.get("photos", [])
                            photo_urls = []
                            
                            if photos:
                                for i, photo in enumerate(photos[:4]):
                                    photo_name = photo.get("name")
                                    if photo_name:
                                        photo_url = (
                                            f"https://places.googleapis.com/v1/{photo_name}/media"
                                            f"?key={settings.GOOGLE_PLACES_API_KEY}"
                                            f"&maxHeightPx=800&maxWidthPx=800"
                                        )
                                        
                                        uploaded_url = upload_photo_to_storage(photo_url, place_id, i)
                                        
                                        if uploaded_url:
                                            photo_urls.append(uploaded_url)
                                        
                                        time.sleep(0.5)  # Rate limit protection
                            
                            # Structure venue data
                            venue = {
                                "place_id": place_id,
                                "name": place.get("displayName", {}).get("text", "Unknown"),
                                "category": category.replace("budget ", ""),  # Normalize category
                                "location": place.get("location", {}),
                                "address": place.get("formattedAddress", "Unknown"),
                                "rating": place.get("rating", 0.0),
                                "price_level": price_level,
                                "description": description,
                                "photos": photo_urls,
                            }
                            
                            all_venues.append(venue)
                            existing_ids.add(place_id)
                            collected_for_category += 1
                            
                            photos_msg = f"{len(photo_urls)} photos" if photo_urls else "no photos"
                            price_symbol = "$" * price_level if price_level > 0 else "FREE"
                            print(f"   {venue['name'][:40]} ({price_symbol}) - {photos_msg} ({collected_for_category}/{target_count})")
                        
                        # Pagination
                        page_token = data.get("nextPageToken")
                        if not page_token:
                            break
                        time.sleep(2)
                        
                    else:
                        print(f"API Error {response.status_code}")
                        break
                        
                except Exception as e:
                    print(f"Exception: {e}")
                    break
        
        print(f"Collected {collected_for_category} {category}s\n")
    
    # Save to file
    data_dir = Path("data/venues")
    data_dir.mkdir(parents=True, exist_ok=True)
    output_file = data_dir / "venues_raw.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_venues, f, indent=2, ensure_ascii=False)
    
    # Statistics
    total_photos = sum(len(v.get("photos", [])) for v in all_venues)
    avg_photos = total_photos / len(all_venues) if all_venues else 0
    
    print("\n" + "="*60)
    print("COLLECTION SUMMARY")
    print("="*60)
    print(f"Total venues: {len(all_venues)}")
    print(f"Total photos: {total_photos} (avg {avg_photos:.1f} per venue)")
    print(f"\nPrice Distribution:")
    print(f"  FREE:              {price_distribution[0]:3d} ({price_distribution[0]/len(all_venues)*100:5.1f}%)")
    print(f"  Budget (¥<1,500):  {price_distribution[1]:3d} ({price_distribution[1]/len(all_venues)*100:5.1f}%)")
    print(f"  Moderate (¥1.5-3k): {price_distribution[2]:3d} ({price_distribution[2]/len(all_venues)*100:5.1f}%)")
    print(f"  Upscale (¥3k+):    {price_distribution[3]:3d} ({price_distribution[3]/len(all_venues)*100:5.1f}%)")
    
    # Warnings
    budget_total = price_distribution[0] + price_distribution[1]
    if budget_total < len(all_venues) * 0.3:
        print(f"\nWARNING: Budget venues ({budget_total}) < 30% of total")
        print("   Consider running script again with more budget neighborhoods")
    
    if avg_photos < 2:
        print(f"\nWARNING: Average photos ({avg_photos:.1f}) is low")
        print("   Many venues may not have good photos")
    
    print(f"\nSaved to: {output_file}")
    print("\nNext: Run generate_embeddings.py")


if __name__ == "__main__":
    if not settings.GOOGLE_PLACES_API_KEY:
        print("GOOGLE_PLACES_API_KEY not set in .env")
        exit(1)
    
    collect_tokyo_venues()
