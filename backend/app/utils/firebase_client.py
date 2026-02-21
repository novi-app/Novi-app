from __future__ import annotations
from typing import Any, Optional
from config import settings

import json
import base64
import tempfile

import firebase_admin
from firebase_admin import credentials, firestore
from google.auth.exceptions import DefaultCredentialsError

# Cached Firestore client (initialized at startup)
_db: Optional[firestore.Client] = None

def initialize_firebase() -> firestore.Client:
    """
    Initialize Firebase Admin SDK at application startup.
    """
    global _db
    
    if _db is not None:
        return _db
    
    if firebase_admin._apps:
        _db = firestore.client()
        return _db
    
    # Try base64 encoded credentials first (for Railway/cloud deployment)
    cred_base64 = settings.FIREBASE_CREDENTIALS_BASE64
    if cred_base64:
        try:
            # Decode base64 credentials
            cred_json = base64.b64decode(cred_base64).decode('utf-8')
            cred_dict = json.loads(cred_json)
            
            # Write to temporary file (Railway needs a file path)
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(cred_dict, f)
                temp_path = f.name
            
            cred = credentials.Certificate(temp_path)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            return _db
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Firebase from base64: {e}") from e
    
    # Fall back to file path (for local development)
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    
    if cred_path:
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            return _db
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Firebase with credentials at {cred_path}: {e}") from e
    
    # Try default credentials as last resort
    try:
        firebase_admin.initialize_app()
        _db = firestore.client()
        return _db
    except Exception as e:
        raise RuntimeError(
            "Firebase Admin initialization failed.\n"
            "- FIREBASE_CREDENTIALS_BASE64 not set\n"
            f"- Service account JSON not found at: {cred_path}\n"
            "- Default credentials not available."
        ) from e

def get_db() -> firestore.Client:
    """
    Get the initialized Firestore client.
    
    Raises:
        RuntimeError: If Firebase hasn't been initialized at startup
    """
    if _db is None:
        raise RuntimeError(
            "Firebase not initialized. "
            "Ensure initialize_firebase() is called at application startup."
        )
    return _db

# Utility functions (keep these - they're useful)

def get_user(user_id: str) -> Optional[dict[str, Any]]:
    """Return user document if it exists, otherwise None."""
    db = get_db()
    snap = db.collection("users").document(user_id).get()
    return snap.to_dict() if snap.exists else None

def save_user(user_id: str, data: dict[str, Any]) -> None:
    """
    Upsert user fields into Firestore.
    merge=True prevents overwriting other fields.
    """
    if not isinstance(data, dict):
        raise ValueError("save_user: 'data' must be a dict")
    db = get_db()
    db.collection("users").document(user_id).set(data, merge=True)

def get_venues(limit: int = 50, category: Optional[str] = None) -> list[dict[str, Any]]:
    """
    Fetch venues, optionally filtered by category.
    Returns list of dicts with 'doc_id' included.
    """
    if limit <= 0:
        raise ValueError("get_venues: limit must be > 0")
    
    db = get_db()
    query = db.collection("venues")
    
    if category:
        query = query.where("category", "==", category)
    
    venues: list[dict[str, Any]] = []
    for snap in query.limit(limit).stream():
        payload = snap.to_dict() or {}
        payload.setdefault("doc_id", snap.id)
        venues.append(payload)
    
    return venues
