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
            "saved_venues": firestore.ArrayUnion([request.venue_id])
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
            "saved_venues": firestore.ArrayRemove([request.venue_id])
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
        
        if not saved_ids:
            return {"venues": [], "count": 0}
        
        db = get_db()
        venues = []
        
        for venue_id in saved_ids:
            venue_doc = db.collection("venues").document(venue_id).get()
            if venue_doc.exists:
                venue_data = venue_doc.to_dict()
                venue_data["venue_id"] = venue_id
                venues.append(venue_data)
        
        return {"venues": venues, "count": len(venues)}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get saved venues: {str(e)}"
        )
    