# Neusic Backend

FastAPI server that orchestrates Claude AI and the YouTube Data API into three endpoints.

## Layout

```
backend/
├── main.py                 # Application entry point (FastAPI app + CORS)
├── app/
│   ├── routers/
│   │   ├── session.py      # Session endpoints (/api/generate-session, /api/adapt-session, /api/end-session)
│   │   └── health.py       # Health check endpoint (/health)
│   ├── services/
│   │   ├── claude_service.py    # Claude system prompt, JSON schemas, prompt caching
│   │   └── youtube_service.py   # YouTube Data API v3 search wrapper
│   ├── core/
│   │   ├── constants.py         # Frequency band constants (FREQUENCY_BANDS, CARRIER_HZ)
│   │   └── session_logic.py     # Domain helpers (build_youtube_query)
│   └── schemas/
│       └── session.py           # Pydantic request models (GenerateSessionRequest, AdaptSessionRequest, EndSessionRequest)
├── requirements.txt
├── pyproject.toml
└── .env.example         # Template for ANTHROPIC_API_KEY + YOUTUBE_API_KEY
```

### Directory Structure

- **`main.py`**: Application entry point that creates the FastAPI app, configures CORS middleware, and registers all routers
- **`app/routers/`**: Route handlers organized by resource (session operations, health checks)
- **`app/services/`**: External API integrations (Claude AI, YouTube Data API)
- **`app/core/`**: Domain logic, business rules, and constants
- **`app/schemas/`**: Pydantic models for request/response validation

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # then edit .env with your real keys
uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health` → `{"status": "ok"}`.

## Environment

| Variable             | Where to get it                                            |
| -------------------- | ---------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | <https://console.anthropic.com> · Settings → API Keys      |
| `YOUTUBE_API_KEY`    | <https://console.cloud.google.com> · enable YouTube Data API v3 · Credentials |

## Endpoints

### `POST /api/generate-session`

Builds a session profile from a student's inputs.

**Request**
```json
{
  "stress_level": 7,
  "subject": "Biochemistry",
  "duration_minutes": 90,
  "mood": null
}
```

**Response**
```json
{
  "entrainment_target": "alpha",
  "frequency_hz": 10,
  "carrier_hz": 200,
  "tempo_bpm_min": 60,
  "tempo_bpm_max": 80,
  "genre": "lo-fi instrumental",
  "mood_tags": ["calm", "focused", "warm"],
  "focus_blocks": [
    {"duration_minutes": 45, "type": "focus"},
    {"duration_minutes": 10, "type": "break"},
    {"duration_minutes": 35, "type": "focus"}
  ],
  "youtube_query": "alpha waves lo-fi calm focused study music binaural",
  "opening_message": "Your stress is high. We're starting with alpha to settle you before we drive focus.",
  "track": {
    "video_id": "...",
    "title": "...",
    "channel": "...",
    "embed_url": "https://www.youtube.com/embed/..."
  }
}
```

### `POST /api/adapt-session`

Adapts a running session based on mid-session feedback.

**Request**
```json
{
  "current_feedback": "losing_focus",
  "minutes_elapsed": 32,
  "original_profile": { "...": "the profile returned from generate-session" }
}
```

**Response**
```json
{
  "action": "adjust_frequency",
  "new_frequency_hz": 8,
  "new_youtube_query": null,
  "message": "Dropping you to a calmer band — you've been pushing hard."
}
```

`action` is one of `continue`, `trigger_break`, `adjust_frequency`, `slower_tempo`.

### `POST /api/end-session`

Generates a focus score and an insight from completed-session stats.

**Request**
```json
{
  "duration_studied": 78,
  "breaks_taken": 2,
  "feedback_history": ["focused", "losing_focus", "focused"]
}
```

**Response**
```json
{
  "focus_score": 82,
  "insight": "You studied best in your first 45 minutes — your check-ins stayed focused until the second block.",
  "recommendation": "Try starting with beta next time and dropping to alpha for the second block."
}
```

## Claude integration

`app/services/claude_service.py` holds:

- The **system prompt** — entrainment science (frequency bands, target Hz), valence-arousal mapping, cognitive break heuristics (block sizes per total duration), music selection rules (genre + tempo per band), and the African student tone guide. Sized to comfortably exceed Sonnet 4.6's 2048-token caching minimum.
- Three **JSON schemas** — one per task (`generate_session`, `adapt_session`, `end_session`), enforced via `output_config.format` so Claude returns strict JSON and we never have to regex-parse anything.
- A single `_call_claude()` helper that wires both pieces together.

**Prompt caching is on.** The system prompt is marked `cache_control: {"type": "ephemeral"}`. The first call writes the cache (~1.25× input cost); every call within 5 minutes reads it (~0.1× cost) — roughly 10× cheaper for the cached prefix.

**Cost estimate per call** (uncached / cached):
- `generate_session` ≈ $0.020 / $0.005
- `adapt_session`   ≈ $0.010 / $0.003
- `end_session`     ≈ $0.010 / $0.003

## YouTube integration

`app/services/youtube_service.py` issues one search query per `/api/generate-session` call against `https://www.googleapis.com/youtube/v3/search`. Uses `videoEmbeddable=true` so the returned video is guaranteed to play in the embedded iframe, and `videoCategoryId=10` (Music) plus `safeSearch=strict`.

Cost: 100 quota units per search · 10,000 free units per day · ≈100 sessions/day on the free tier.

## Notes

- **No persistence.** Sessions are stateless — each endpoint takes everything it needs in the request body. Add Supabase or Firebase if you want session history.
- **CORS is wide open** (`allow_origins=["*"]`) for hackathon dev. Lock down before production.
- **Errors:** Claude or YouTube failures bubble up as `502 Bad Gateway` with the underlying error in `detail`. The frontend surfaces this.
