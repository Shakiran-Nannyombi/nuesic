"""
End-to-end verification tests for the restructured Neusic backend.

These tests verify:
1. All modules import without errors (static analysis)
2. The FastAPI app starts and all endpoints are registered
3. The /health endpoint returns 200 {"status": "ok"}
4. All three session endpoints are reachable and validate input (422 on bad data)
5. All three session endpoints reach the service layer (502 with dummy API keys,
   not 404/500 from routing or import failures)
6. Core domain constants and helpers are accessible

Live API calls to Claude and YouTube require real keys in .env and are not
exercised here. The 502 responses confirm the full request path is wired up
correctly up to the external API boundary.

Requirements covered: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
"""

import os

import pytest
from fastapi.testclient import TestClient

# Provide dummy keys so the app can be imported without crashing at startup.
# Real API calls will fail with 502, which is the expected result for these tests.
os.environ.setdefault("ANTHROPIC_API_KEY", "dummy-key-for-testing")
os.environ.setdefault("YOUTUBE_API_KEY", "dummy-key-for-testing")

from main import app  # noqa: E402 — must come after env setup

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# 1. Static import verification
# ---------------------------------------------------------------------------

class TestImports:
    """Verify all restructured modules can be imported without errors."""

    def test_import_main(self):
        import main  # noqa: F401
        assert hasattr(main, "app")

    def test_import_health_router(self):
        from app.routers import health
        assert hasattr(health, "router")

    def test_import_session_router(self):
        from app.routers import session
        assert hasattr(session, "router")

    def test_import_claude_service(self):
        from app.services import claude_service
        assert callable(claude_service.generate_session)
        assert callable(claude_service.adapt_session)
        assert callable(claude_service.end_session)

    def test_import_youtube_service(self):
        from app.services import youtube_service
        assert callable(youtube_service.search_track)

    def test_import_constants(self):
        from app.core.constants import CARRIER_HZ, FREQUENCY_BANDS
        assert "beta" in FREQUENCY_BANDS
        assert "alpha" in FREQUENCY_BANDS
        assert "theta" in FREQUENCY_BANDS
        assert "delta" in FREQUENCY_BANDS
        assert CARRIER_HZ == 200.0

    def test_import_session_logic(self):
        from app.core.session_logic import build_youtube_query
        result = build_youtube_query("lo-fi", "calm", "beta")
        assert "beta" in result
        assert "lo-fi" in result

    def test_import_schemas(self):
        from app.schemas.session import (
            AdaptSessionRequest,
            EndSessionRequest,
            GenerateSessionRequest,
        )
        assert GenerateSessionRequest
        assert AdaptSessionRequest
        assert EndSessionRequest


# ---------------------------------------------------------------------------
# 2. Endpoint registration
# ---------------------------------------------------------------------------

class TestEndpointRegistration:
    """Verify all four endpoints are registered on the app."""

    def _route_paths(self):
        return {r.path for r in app.routes if hasattr(r, "path")}

    def test_health_endpoint_registered(self):
        assert "/health" in self._route_paths()

    def test_generate_session_endpoint_registered(self):
        assert "/api/generate-session" in self._route_paths()

    def test_adapt_session_endpoint_registered(self):
        assert "/api/adapt-session" in self._route_paths()

    def test_end_session_endpoint_registered(self):
        assert "/api/end-session" in self._route_paths()


# ---------------------------------------------------------------------------
# 3. Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    """Verify the /health endpoint returns 200 {"status": "ok"}."""

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_ok_body(self):
        response = client.get("/health")
        assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# 4. Request validation (Pydantic schemas wired up correctly)
# ---------------------------------------------------------------------------

class TestRequestValidation:
    """Verify Pydantic validation rejects invalid payloads with 422."""

    def test_generate_session_rejects_stress_out_of_range(self):
        response = client.post(
            "/api/generate-session",
            json={"stress_level": 99, "subject": "math", "duration_minutes": 60},
        )
        assert response.status_code == 422

    def test_generate_session_rejects_duration_too_short(self):
        response = client.post(
            "/api/generate-session",
            json={"stress_level": 5, "subject": "math", "duration_minutes": 5},
        )
        assert response.status_code == 422

    def test_generate_session_rejects_missing_required_fields(self):
        response = client.post("/api/generate-session", json={})
        assert response.status_code == 422

    def test_adapt_session_rejects_negative_minutes(self):
        response = client.post(
            "/api/adapt-session",
            json={
                "current_feedback": "focused",
                "minutes_elapsed": -1,
                "original_profile": {},
            },
        )
        assert response.status_code == 422

    def test_end_session_rejects_negative_duration(self):
        response = client.post(
            "/api/end-session",
            json={
                "duration_studied": -5,
                "breaks_taken": 0,
                "feedback_history": [],
            },
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# 5. Session endpoints reach the service layer
#    (502 with dummy keys = routing + imports are correct, only API auth fails)
# ---------------------------------------------------------------------------

class TestSessionEndpointsReachable:
    """
    Verify session endpoints are fully wired up to the service layer.

    With dummy API keys the external calls fail with authentication errors,
    which the router converts to 502. A 404 would mean the route is missing;
    a 500 would mean an import or wiring error. 502 confirms the full path
    from HTTP → router → service is intact.
    """

    def test_generate_session_reaches_service_layer(self):
        response = client.post(
            "/api/generate-session",
            json={"stress_level": 5, "subject": "mathematics", "duration_minutes": 60},
        )
        # 502 = reached Claude service, auth failed (expected with dummy key)
        # Anything other than 404/500 means routing and imports are correct
        assert response.status_code in (502, 200), (
            f"Expected 502 (service reached, auth failed) or 200 (live keys), "
            f"got {response.status_code}: {response.text}"
        )

    def test_adapt_session_reaches_service_layer(self):
        response = client.post(
            "/api/adapt-session",
            json={
                "current_feedback": "focused",
                "minutes_elapsed": 15,
                "original_profile": {
                    "entrainment_target": "beta",
                    "frequency_hz": 16.0,
                    "genre": "lo-fi",
                },
            },
        )
        assert response.status_code in (502, 200), (
            f"Expected 502 or 200, got {response.status_code}: {response.text}"
        )

    def test_end_session_reaches_service_layer(self):
        response = client.post(
            "/api/end-session",
            json={
                "duration_studied": 45,
                "breaks_taken": 1,
                "feedback_history": ["focused", "losing_focus", "focused"],
            },
        )
        assert response.status_code in (502, 200), (
            f"Expected 502 or 200, got {response.status_code}: {response.text}"
        )


# ---------------------------------------------------------------------------
# 6. CORS middleware is configured
# ---------------------------------------------------------------------------

class TestCORSMiddleware:
    """Verify CORS headers are present on responses."""

    def test_cors_headers_on_health(self):
        response = client.get("/health", headers={"Origin": "http://localhost:5173"})
        assert response.status_code == 200
        # FastAPI/Starlette adds the header when an Origin is provided
        assert "access-control-allow-origin" in response.headers
