from __future__ import annotations
from typing import Any, Optional
from config import settings

import json
import base64
import tempfile

import firebase_admin
from firebase_admin import credentials, firestore

_db: Optional[firestore.Client] = None

def initialize_firebase() -> firestore.Client:
    global _db
    
    if _db is not None:
        return _db
    
    if firebase_admin._apps:
        _db = firestore.client()
        return _db
    
    cred_base64 = settings.FIREBASE_CREDENTIALS_BASE64
    if cred_base64:
        try:
            cred_json = base64.b64decode(cred_base64).decode('utf-8')
            cred_dict = json.loads(cred_json)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(cred_dict, f)
                temp_path = f.name
            
            cred = credentials.Certificate(temp_path)
            
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'novi-prod.firebasestorage.app'
            })
            _db = firestore.client()
            return _db
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Firebase from base64: {e}") from e
    
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    
    if cred_path:
        try:
            cred = credentials.Certificate(cred_path)
            
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'novi-prod.firebasestorage.app'
            })
            _db = firestore.client()
            return _db
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Firebase with credentials at {cred_path}: {e}") from e
    
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
    if _db is None:
        raise RuntimeError(
            "Firebase not initialized. "
            "Ensure initialize_firebase() is called at application startup."
        )
    return _db

def get_user(user_id: str) -> Optional[dict[str, Any]]:
    db = get_db()
    snap = db.collection("users").document(user_id).get()
    return snap.to_dict() if snap.exists else None

def save_user(user_id: str, data: dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError("save_user: 'data' must be a dict")
    db = get_db()
    db.collection("users").document(user_id).set(data, merge=True)
