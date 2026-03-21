from app.models.intervention import InterventionResponse


def generate_intervention(
    user_id: str,
    trigger_type: str,
    context: dict = None
) -> InterventionResponse:
    return InterventionResponse(
        user_id=user_id,
        trigger_type=trigger_type,
        message="Still deciding? We think you'll love this one"
    )
