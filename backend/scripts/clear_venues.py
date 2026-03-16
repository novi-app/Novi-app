from app.utils.firebase_client import initialize_firebase, get_db


def clear_all_venues():
    initialize_firebase()
    db = get_db()
    
    print("Fetching all venues from Firestore...")
    venues = db.collection("venues").stream()
    
    count = 0
    batch_size = 50
    batch = db.batch()
    
    for venue in venues:
        batch.delete(venue.reference)
        count += 1
        
        if count % batch_size == 0:
            batch.commit()
            print(f"  Deleted {count} venues...")
            batch = db.batch()
    
    if count % batch_size != 0:
        batch.commit()
    
    print(f"\nTotal deleted: {count} venues")
    print("Firestore 'venues' collection is now empty")
    print("\nYou can now run: python scripts/setup_venues.py")


if __name__ == "__main__":
    print("=" * 60)
    print("CLEAR ALL VENUES FROM FIRESTORE")
    print("=" * 60)
    print("\nWARNING: This will permanently delete ALL venues!")
    print("You will need to run setup_venues.py and generate_embeddings.py again.\n")
    
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm == "DELETE":
        clear_all_venues()
    else:
        print("\nCancelled - venues were not deleted")
