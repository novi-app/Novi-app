from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.cloud import firestore
from app.utils.firebase_client import get_db, get_user

router = APIRouter(prefix="/api/venues", tags=["venues"])


class SaveVenueRequest(BaseModel):
    user_id: str
    venue_id: str


@router.post("/save")
async def save_venue(request: SaveVenueRequest):
    try:
        db = get_db()
        
        user = get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.collection("users").document(request.user_id).update({
            "saved_venues": firestore.ArrayUnion([request.venue_id]),
            f"saved_venues_at.{request.venue_id}": datetime.utcnow().isoformat(),
        })
        
        return {"status": "success", "message": "Venue saved"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save venue: {str(e)}"
        )


@router.delete("/save")
async def unsave_venue(request: SaveVenueRequest):
    try:
        db = get_db()
        
        user = get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.collection("users").document(request.user_id).update({
            "saved_venues": firestore.ArrayRemove([request.venue_id]),
            f"saved_venues_at.{request.venue_id}": firestore.DELETE_FIELD,
        })
        
        return {"status": "success", "message": "Venue unsaved"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to unsave venue: {str(e)}"
        )


@router.get("/saved/{user_id}")
async def get_saved_venues(user_id: str):
    try:
        user = get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        saved_ids = user.get("saved_venues", [])
        saved_at_map = user.get("saved_venues_at", {})

        if not saved_ids:
            return {"venues": [], "count": 0}

        db = get_db()
        venues = []

        refs = [db.collection("venues").document(venue_id) for venue_id in saved_ids]
        for doc in db.get_all(refs):
            if doc.exists:
                venue_data = doc.to_dict()
                venue_data["venue_id"] = doc.id
                venue_data["saved_at"] = saved_at_map.get(doc.id)
                venues.append(venue_data)
        
        return {"venues": venues, "count": len(venues)}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get saved venues: {str(e)}"
        )
    