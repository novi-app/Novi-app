import requests
from openai import OpenAI
from config import settings

# OpenAI Client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Test Venues
TOKYO_VENUES = [
    "Senso-ji Temple, Asakusa, Tokyo",
    "Ichiran Ramen, Shibuya, Tokyo",
    "Shinjuku Gyoen National Garden, Tokyo",
    "Tokyo Metropolitan Government Building Observation Deck",
    "Golden Gai, Shinjuku, Tokyo"
]

def test_google_places():
    print("--- Testing Google Places API ---")
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.types" # what Google should return
    }

    for venue in TOKYO_VENUES:
        payload = {
            "textQuery": venue,
            "languageCode": "en"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "places" in data:
                place = data["places"][0]
                name = place.get("displayName", {}).get("text", "N/A")
                address = place.get("formattedAddress", "N/A")
                types = place.get("types", [])
                print(f"✅ Found: {name}")
                print(f"   Address: {address}")
                print(f"   Types: {types}\n")
            else:
                print(f"No results for: {venue}")
        else:
            print(f"Error {response.status_code} for {venue}: {response.text}")

def test_openai_embeddings():
    print("\n--- Testing OpenAI Embeddings API ---")
    # Sample venue description to embed
    sample_description = (
        "Ichiran Ramen in Shibuya offers a famous solo-dining experience. "
        "Guests eat in individual flavor concentration booths, making it perfect "
        "for solo travelers looking for high-quality, customizable tonkotsu ramen "
        "without needing to interact with staff."
    )
    
    try:
        response = client.embeddings.create(
            input=sample_description,
            model="text-embedding-3-small"
        )
        embedding_vector = response.data[0].embedding
        print(f"✅ Successfully generated embedding!")
        print(f"   Dimensions: {len(embedding_vector)}")
        print(f"   First 5 values: {embedding_vector[:5]}")
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")


if __name__ == "__main__":
    test_google_places()
    test_openai_embeddings()