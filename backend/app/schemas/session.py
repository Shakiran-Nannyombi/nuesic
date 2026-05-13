"""
Session Request Schemas

Pydantic models for session-related API endpoints.
"""

from typing import Any

from pydantic import BaseModel, Field


class GenerateSessionRequest(BaseModel):
    stress_level: int = Field(ge=1, le=10)
    subject: str
    duration_minutes: int = Field(ge=15, le=180)
    mood: str | None = None


class AdaptSessionRequest(BaseModel):
    current_feedback: str
    minutes_elapsed: int = Field(ge=0)
    original_profile: dict[str, Any]


class EndSessionRequest(BaseModel):
    duration_studied: int = Field(ge=0)
    breaks_taken: int = Field(ge=0)
    feedback_history: list[str]
