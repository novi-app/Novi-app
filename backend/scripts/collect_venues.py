import requests
import json
from config import settings
from pathlib import Path

def collect_tokyo_venues():
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.rating,places.priceLevel,places.reviews"
    }

    categories = {
        "restaurant": 20,
        "cafe": 15,
        "bar": 15
    }

    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4
    }

    all_venues = []

    for category, count in categories.items():
        print(f"Fetching {count} {category}s...")
        
        payload = {
            "textQuery": f"popular {category} in Tokyo",
            "pageSize": count
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            places = response.json().get("places", [])
            
            for place in places:
                reviews = place.get("reviews", [])
                description = reviews[0].get("text", "No description available.") if reviews else "No description available."
                
                # Convert Google's price enum to an integer (defaulting to 0 if missing)
                raw_price = place.get("priceLevel", "UNKNOWN")
                price_int = price_map.get(raw_price, 0)
                
                # Structured JSON Venue
                venue_data = {
                    "place_id": place.get("id"),
                    "name": place.get("displayName", {}).get("text", "Unknown"),
                    "category": category,
                    "location": place.get("location", {}),
                    "address": place.get("formattedAddress", "Unknown"),
                    "rating": place.get("rating", 0.0),
                    "price_level": price_int,
                    "description": description
                }
                all_venues.append(venue_data)
        else:
            print(f"Error fetching {category}: {response.text}")

    # Save everything to a JSON file + Create a data/seeds folder for clean structure
    data_dir = Path(r"data\seeds")
    data_dir.mkdir(parents=True, exist_ok=True)

    output_file = data_dir / "tokyo_venues.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_venues, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Successfully saved {len(all_venues)} venues to {output_file}!")

if __name__ == "__main__":
    collect_tokyo_venues()