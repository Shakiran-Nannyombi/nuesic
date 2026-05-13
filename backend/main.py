from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import claude_service
import youtube_service
from app.schemas.session import (
    AdaptSessionRequest,
    EndSessionRequest,
    GenerateSessionRequest,
)

app = FastAPI(title="Neusic Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/generate-session")
async def generate_session(req: GenerateSessionRequest) -> dict[str, Any]:
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


@app.post("/api/adapt-session")
def adapt_session(req: AdaptSessionRequest) -> dict[str, Any]:
    try:
        return claude_service.adapt_session(
            current_feedback=req.current_feedback,
            minutes_elapsed=req.minutes_elapsed,
            original_profile=req.original_profile,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude error: {e}") from e


@app.post("/api/end-session")
def end_session(req: EndSessionRequest) -> dict[str, Any]:
    try:
        return claude_service.end_session(
            duration_studied=req.duration_studied,
            breaks_taken=req.breaks_taken,
            feedback_history=req.feedback_history,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude error: {e}") from e
