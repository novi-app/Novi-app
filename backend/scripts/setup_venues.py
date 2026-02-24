"""
Collect venues from Google Places API.
DATA-004: Collect 100 Tokyo venues across multiple categories.

Usage: python scripts/setup_venues.py
"""
import requests
import json
from pathlib import Path
from config import settings


def collect_tokyo_venues():
    """Fetch venues from Google Places API and save to JSON."""
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.location,"
            "places.formattedAddress,places.rating,places.priceLevel,"
            "places.reviewSummary"
        )
    }
    
    # Target 130 venues across 10 categories
    categories = {
        "restaurant": 20,
        "shopping mall": 20,
        "park": 20,
        "cafe": 15,
        "bar": 15,
        "museum": 10,
        "observation deck": 10,
        "amusement park": 10,
        "shinto shrine": 5,
        "buddhist temple": 5,
    }
    
    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }
    
    all_venues = []
    
    print("Collecting Tokyo venues...")
    print()
    
    for category, count in categories.items():
        print(f"Fetching {count} {category}s...", end=" ")
        
        payload = {
            "textQuery": f"{category} in Tokyo",
            "pageSize": count
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                places = response.json().get("places", [])
                
                for place in places:
                    # Extract review summary
                    review_summary = place.get("reviewSummary", {})
                    description = review_summary.get("text", {}).get("text", "No reviews available")
                    description = description.removeprefix("People say this").strip().capitalize()
                    
                    # Map price level
                    raw_price = place.get("priceLevel", "UNKNOWN")
                    price_level = price_map.get(raw_price, 0)
                    
                    # Structure venue data
                    venue = {
                        "place_id": place.get("id"),
                        "name": place.get("displayName", {}).get("text", "Unknown"),
                        "category": category,
                        "location": place.get("location", {}),
                        "address": place.get("formattedAddress", "Unknown"),
                        "rating": place.get("rating", 0.0),
                        "price_level": price_level,
                        "description": description
                    }
                    all_venues.append(venue)
                
                print(f"Got {len(places)}")
            else:
                print(f"Error {response.status_code}")
                
        except Exception as e:
            print(f"Error: {e}")
    
    # Save to file
    data_dir = Path("data/venues")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = data_dir / "venues_raw.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_venues, f, indent=2, ensure_ascii=False)
    
    print()
    print(f"Saved {len(all_venues)} venues to {output_file}")
    print()
    print("Next step: Run generate_embeddings.py to add AI features")


if __name__ == "__main__":
    if not settings.GOOGLE_PLACES_API_KEY:
        print("GOOGLE_PLACES_API_KEY not set in .env")
        exit(1)
    
    collect_tokyo_venues()
    