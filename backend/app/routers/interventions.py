"""
Intervention router.
Exposes an endpoint for trigger-based intervention generation.
"""
from fastapi import APIRouter, HTTPException
from app.models.intervention import InterventionRequest, InterventionResponse
from app.services.intervention_generator import generate_intervention

router = APIRouter(prefix="/api/intervention", tags=["intervention"])


@router.post("", response_model=InterventionResponse)
async def create_intervention(request: InterventionRequest):
    """Generate a personalized intervention message from trigger context."""
    try:
        return generate_intervention(
            user_id=request.user_id,
            trigger_type=request.trigger_type,
            context=request.context,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate intervention: {str(e)}",
        )
