import requests
import json
import time
from pathlib import Path
from firebase_admin import storage
from config import settings
from app.utils.firebase_client import initialize_firebase, get_db


def upload_photo_to_storage(photo_url: str, venue_id: str, photo_index: int = 0) -> str:
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            response = requests.get(photo_url, timeout=15)
            
            if response.status_code == 429:
                wait_time = (2 ** attempt) * 2
                print(f"  Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            if response.status_code != 200:
                return None
            
            bucket = storage.bucket()
            blob = bucket.blob(f"venue_photos/{venue_id}_{photo_index}.jpg")
            blob.upload_from_string(response.content, content_type="image/jpeg")
            blob.make_public()
            
            return blob.public_url
            
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Photo upload failed after {max_retries} attempts: {e}")
                return None
            time.sleep(2 ** attempt)
    
    return None


def get_existing_place_ids() -> set:
    initialize_firebase()
    db = get_db()
    
    print("Fetching existing venue IDs from Firestore...")
    docs = db.collection("venues").select([]).stream()
    existing_ids = {snap.id for snap in docs}
    return existing_ids


def load_checkpoint(category: str) -> list:
    checkpoint_file = Path(f"data/venues/checkpoint_{category}.json")
    if checkpoint_file.exists():
        with open(checkpoint_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_checkpoint(venues: list, category: str):
    data_dir = Path("data/venues")
    data_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_file = data_dir / f"checkpoint_{category}.json"
    
    with open(checkpoint_file, "w", encoding="utf-8") as f:
        json.dump(venues, f, indent=2, ensure_ascii=False)
    print(f"  Checkpoint saved: {len(venues)} total venues")


def get_activity_for_category(category: str) -> str:
    activity_map = {
        "budget restaurant": "food",
        "restaurant": "food",
        "budget cafe": "food",
        "cafe": "food",
        "bar": "social",
        "izakaya": "social",
        "karaoke": "social",
        "museum": "explore",
        "shinto shrine": "explore",
        "buddhist temple": "explore",
        "bookstore": "explore",
        "observation deck": "explore",
        "park": "explore",
        "onsen": "explore",
        "spa": "explore",
        "shopping mall": "explore",
        "shopping street": "explore",
        "amusement park": "explore",
    }
    return activity_map.get(category, "explore")


def get_price_level(category: str) -> int:
    free_categories = ["park", "shinto shrine", "buddhist temple", "observation deck"]
    if category in free_categories or "shrine" in category or "temple" in category:
        return 0
    elif "budget" in category:
        return 1
    else:
        return 2


def get_search_query(category: str, neighborhood: str) -> str:
    budget_queries = {
        "budget restaurant": "cheap affordable budget restaurant",
        "budget cafe": "affordable budget coffee shop",
    }
    
    solo_queries = {
        "izakaya": "counter seating izakaya solo-friendly",
        "onsen": "solo traveler onsen hot spring",
        "karaoke": "solo karaoke private room",
    }
    
    if category in budget_queries:
        query = budget_queries[category]
    elif category in solo_queries:
        query = solo_queries[category]
    else:
        query = category
    
    return f"{query} in {neighborhood}, Tokyo"


def get_neighborhoods_for_category(category: str) -> list:
    neighborhoods = {
        "premium": ["Ginza", "Roppongi", "Shibuya", "Shinjuku"],
        "moderate": ["Harajuku", "Ebisu", "Nakameguro", "Ikebukuro", "Meguro"],
        "budget": ["Shimokitazawa", "Koenji", "Asagaya", "Kichijoji", "Sangenjaya"],
        "general": ["Asakusa", "Ueno", "Akihabara", "Yanaka"],
    }
    
    if "budget" in category:
        return neighborhoods["budget"] + neighborhoods["moderate"]
    elif category in ["observation deck", "museum"]:
        return neighborhoods["premium"] + neighborhoods["moderate"]
    else:
        return neighborhoods["moderate"] + neighborhoods["general"]


def get_place_details(place_id: str) -> dict:
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "id,displayName,formattedAddress,location,rating,userRatingCount,"
            "priceLevel,websiteUri,nationalPhoneNumber,internationalPhoneNumber,"
            "regularOpeningHours,editorialSummary,types,photos"
        )
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=20)
            
            if response.status_code == 429:
                wait_time = (2 ** attempt) * 2
                print(f"  Rate limited on Place Details, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"  Place Details API error {response.status_code}")
                return None
                
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"  Place Details failed: {e}")
                return None
            time.sleep(2 ** attempt)
    
    return None


def collect_tokyo_venues():
    initialize_firebase()
    existing_ids = get_existing_place_ids()
    print(f"Found {len(existing_ids)} existing venues in database.\n")
    
    all_venues = []
    checkpoint_exists = any(Path(f"data/venues/checkpoint_{cat}.json").exists() 
                        for cat in ["budget restaurant", "restaurant"])
    
    if checkpoint_exists:
        resume = input("Found checkpoint files. Resume from checkpoint? (y/n): ")
        if resume.lower() == 'y':
            for cat_file in Path("data/venues").glob("checkpoint_*.json"):
                with open(cat_file, "r") as f:
                    checkpointed = json.load(f)
                    all_venues.extend(checkpointed)
                    existing_ids.update(v["place_id"] for v in checkpointed)
            print(f"Resumed with {len(all_venues)} venues from checkpoints\n")
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,nextPageToken"
    }
    
    categories = {
        "budget restaurant": 95,
        "restaurant": 50,
        "budget cafe": 60,
        "cafe": 35,
        "bar": 30,
        "izakaya": 12,
        "karaoke": 6,
        "museum": 48,
        "shinto shrine": 30,
        "buddhist temple": 30,
        "bookstore": 24,
        "observation deck": 18,
        "park": 48,
        "onsen": 24,
        "spa": 18,
        "shopping mall": 30,
        "shopping street": 30,
        "amusement park": 6,
    }
    
    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }
    
    price_distribution = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    
    print("Starting Tokyo venue collection (600 venues)...")
    print("Centered on: Shibuya (35.6595, 139.7004)")
    print("Search radius: 30km\n")
    
    for category, target_count in categories.items():
        collected_for_category = 0
        neighborhoods = get_neighborhoods_for_category(category)
        
        print(f"--- {category.upper()}: Target {target_count} venues ---")
        
        for neighborhood in neighborhoods:
            if collected_for_category >= target_count:
                break
                
            page_token = ""
            
            while collected_for_category < target_count:
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
            
                            if place_id in existing_ids:
                                continue
                            
                            details = get_place_details(place_id)
                            if not details:
                                continue
                            
                            display_name = details.get("displayName", {})
                            name = display_name.get("text") if isinstance(display_name, dict) else str(display_name)
                            
                            location = details.get("location", {})
                            
                            editorial = details.get("editorialSummary", {})
                            if isinstance(editorial, dict):
                                description = editorial.get("text", "")
                            else:
                                description = ""
                            
                            if not description:
                                types = details.get("types", [])
                                description = f"Popular {category} in Tokyo"
                            
                            raw_price = details.get("priceLevel", "UNKNOWN")
                            price_level = price_map.get(raw_price, get_price_level(category))
                            
                            price_distribution[price_level] += 1
                            
                            photos = details.get("photos", [])
                            photo_url = None
                            
                            if photos:
                                photo = photos[0]
                                photo_name = photo.get("name")
                                if photo_name:
                                    google_photo_url = (
                                        f"https://places.googleapis.com/v1/{photo_name}/media"
                                        f"?key={settings.GOOGLE_PLACES_API_KEY}"
                                        f"&maxHeightPx=800&maxWidthPx=800"
                                    )
                                    
                                    photo_url = upload_photo_to_storage(google_photo_url, place_id, 0)
                                    time.sleep(0.5)
                            
                            phone = details.get("internationalPhoneNumber") or \
                                    details.get("nationalPhoneNumber") or \
                                    "Not available"
                            
                            venue = {
                                "place_id": place_id,
                                "name": name or "Unknown",
                                "activity": get_activity_for_category(category),
                                "category": category.replace("budget ", ""),
                                "location": location,
                                "address": details.get("formattedAddress", "Unknown"),
                                "rating": details.get("rating", 0.0),
                                "reviews_count": details.get("userRatingCount", 0),
                                "price_level": price_level,
                                "website": details.get("websiteUri") or "Not available",
                                "phone": phone,
                                "opening_hours": details.get("regularOpeningHours", {}),
                                "description": description,
                                "google_types": details.get("types", []),
                                "photo": photo_url or "",
                            }
                            
                            all_venues.append(venue)
                            existing_ids.add(place_id)
                            collected_for_category += 1
                            
                            photo_msg = "✓ photo" if photo_url else "✗ no photo"
                            price_symbol = "$" * price_level if price_level > 0 else "FREE"
                            reviews_msg = f"{venue['reviews_count']} reviews" if venue['reviews_count'] > 0 else "no reviews"
                            print(f"   {name[:35]:35} ({price_symbol:4}) {photo_msg} | {reviews_msg:12} ({collected_for_category}/{target_count})")
                        
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
        
        print(f"Collected {collected_for_category} {category}s")
        save_checkpoint(all_venues, category)
        print()
    
    data_dir = Path("data/venues")
    data_dir.mkdir(parents=True, exist_ok=True)
    output_file = data_dir / "venues_raw.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_venues, f, indent=2, ensure_ascii=False)
    
    total_photos = sum(1 for v in all_venues if v.get("photo"))
    total_with_website = sum(1 for v in all_venues if v.get("website") != "Not available")
    total_with_phone = sum(1 for v in all_venues if v.get("phone") != "Not available")
    total_with_reviews = sum(1 for v in all_venues if v.get("reviews_count", 0) > 0)
    
    print("\n" + "="*60)
    print("COLLECTION SUMMARY")
    print("="*60)
    print(f"Total venues: {len(all_venues)}")
    print(f"\nData Completeness:")
    print(f"  Photos:        {total_photos:3d} ({total_photos/len(all_venues)*100:5.1f}%)")
    print(f"  Websites:      {total_with_website:3d} ({total_with_website/len(all_venues)*100:5.1f}%)")
    print(f"  Phone numbers: {total_with_phone:3d} ({total_with_phone/len(all_venues)*100:5.1f}%)")
    print(f"  Reviews:       {total_with_reviews:3d} ({total_with_reviews/len(all_venues)*100:5.1f}%)")
    
    print(f"\nPrice Distribution:")
    print(f"  FREE:              {price_distribution[0]:3d} ({price_distribution[0]/len(all_venues)*100:5.1f}%)")
    print(f"  Budget (¥<1,500):  {price_distribution[1]:3d} ({price_distribution[1]/len(all_venues)*100:5.1f}%)")
    print(f"  Moderate (¥1.5-3k): {price_distribution[2]:3d} ({price_distribution[2]/len(all_venues)*100:5.1f}%)")
    print(f"  Upscale (¥3k-6k):  {price_distribution[3]:3d} ({price_distribution[3]/len(all_venues)*100:5.1f}%)")
    print(f"  Luxury (¥6k+):     {price_distribution[4]:3d} ({price_distribution[4]/len(all_venues)*100:5.1f}%)")
    
    budget_total = price_distribution[0] + price_distribution[1]
    if budget_total < len(all_venues) * 0.25:
        print(f"\nWARNING: Budget venues ({budget_total}) < 25% of total")
    
    if total_photos < len(all_venues) * 0.7:
        print(f"\nWARNING: Only {total_photos/len(all_venues)*100:.1f}% of venues have photos")
    
    print(f"\nSaved to: {output_file}")
    print("\nNext: Run generate_embeddings.py")


if __name__ == "__main__":
    if not settings.GOOGLE_PLACES_API_KEY:
        print("GOOGLE_PLACES_API_KEY not set in .env")
        exit(1)
    
    collect_tokyo_venues()
