from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore
from google.auth.exceptions import DefaultCredentialsError


# Cached Firestore client (created on first use)
_db: Optional[firestore.Client] = None


def _initialize_firebase_admin() -> None:
    """
    Initialize Firebase Admin exactly once.

    Local dev:
      - expects a service account JSON file (provided by the team)
      - path comes from FIREBASE_CREDENTIALS_PATH (default: ./firebase-service-account.json)

    Deployed environments:
      - may rely on default credentials (no JSON file on disk)
    """
    if firebase_admin._apps:
        return  # already initialized elsewhere

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
    path = Path(cred_path).expanduser()

    # In local dev we typically run from the backend/ folder, so relative paths work.
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()

    if path.exists():
        cred = credentials.Certificate(str(path))
        firebase_admin.initialize_app(cred)
        return

    # If the JSON isn't present, try default credentials.
    try:
        firebase_admin.initialize_app()
    except DefaultCredentialsError as e:
        raise RuntimeError(
            "Firebase Admin initialization failed.\n"
            f"- Looked for service account JSON at: {path}\n"
            "- If running locally, set FIREBASE_CREDENTIALS_PATH to the correct file path.\n"
            "- If running in production, ensure default credentials are available."
        ) from e


def get_db() -> firestore.Client:
    """
    Return a Firestore client (initialized lazily and cached).

    This avoids import-time side effects and ensures we only initialize Firebase
    when Firestore is actually needed.
    """
    global _db
    if _db is None:
        _initialize_firebase_admin()
        _db = firestore.client()
    return _db


def get_user(user_id: str) -> Optional[dict[str, Any]]:
    """Return the user document dict if it exists, otherwise None."""
    db = get_db()
    snap = db.collection("users").document(user_id).get()
    return snap.to_dict() if snap.exists else None


def save_user(user_id: str, data: dict[str, Any]) -> None:
    """
    Upsert user fields into Firestore.

    merge=True prevents accidentally overwriting other fields.
    """
    if not isinstance(data, dict):
        raise ValueError("save_user: 'data' must be a dict")

    db = get_db()
    db.collection("users").document(user_id).set(data, merge=True)


def get_venues(limit: int = 50, category: Optional[str] = None) -> list[dict[str, Any]]:
    """
    Fetch up to `limit` venues. Optionally filter by category.

    Returns plain dicts and includes the Firestore doc id as 'doc_id'
    to make debugging easier.
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