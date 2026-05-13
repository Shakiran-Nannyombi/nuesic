"""
Session Router

Handles session generation, adaptation, and completion endpoints.
"""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas.session import (
    AdaptSessionRequest,
    EndSessionRequest,
    GenerateSessionRequest,
)
from app.services import claude_service, youtube_service

router = APIRouter(prefix="/api", tags=["session"])


@router.post("/generate-session")
async def generate_session(req: GenerateSessionRequest) -> dict[str, Any]:
    """Generate a new study session profile with music recommendation."""
    try:
        profile = claude_service.generate_session(
            stress_level=req.stress_level,
            subject=req.subject,
            duration_minutes=req.duration_minutes,
            mood=req.mood,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude error: {e}") from e

    try:
        track = await youtube_service.search_track(profile["youtube_query"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube error: {e}") from e

    return {**profile, "track": track}


@router.post("/adapt-session")
def adapt_session(req: AdaptSessionRequest) -> dict[str, Any]:
    """Adapt an ongoing session based on user feedback."""
    try:
        return claude_service.adapt_session(
            current_feedback=req.current_feedback,
            minutes_elapsed=req.minutes_elapsed,
            original_profile=req.original_profile,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude error: {e}") from e


@router.post("/end-session")
def end_session(req: EndSessionRequest) -> dict[str, Any]:
    """Calculate focus score and insights for completed session."""
    try:
        return claude_service.end_session(
            duration_studied=req.duration_studied,
            breaks_taken=req.breaks_taken,
            feedback_history=req.feedback_history,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude error: {e}") from e
