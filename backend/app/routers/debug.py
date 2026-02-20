from __future__ import annotations

import os
from fastapi import APIRouter, HTTPException

from app.utils.firebase_client import get_db

router = APIRouter(prefix="/api/dev", tags=["debug"])


@router.post("/firestore-smoke")
async def firestore_smoke_test():
    """
    Development-only Firestore smoke test.

    Purpose:
      - Verify Firebase Admin initialization works
      - Verify Firestore write + read works

    Safety:
      - Writes only to a dev-only collection/doc (does not touch user/venue data)
      - Returns 404 unless ENVIRONMENT=development
    """
    if os.getenv("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=404, detail="Not found")

    try:
        db = get_db()
        ref = db.collection("dev_smoke_tests").document("firebase_client")
        ref.set({"ok": True, "source": "api_smoke_test"}, merge=True)

        snap = ref.get()
        if not snap.exists:
            raise HTTPException(
                status_code=500,
                detail="Smoke test failed: document not found after write",
            )

        return {"status": "ok", "data": snap.to_dict()}
    except HTTPException:
        raise
    except Exception as e:
        # Keep error readable for debugging; don't leak secrets.
        raise HTTPException(status_code=500, detail=f"Firestore smoke test failed: {e}")