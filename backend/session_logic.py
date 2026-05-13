FREQUENCY_BANDS = {
    "beta":  {"hz": 16.0, "label": "deep focus"},
    "alpha": {"hz": 10.0, "label": "calm attention"},
    "theta":  {"hz": 6.0, "label": "anxiety relief"},
    "delta":  {"hz": 2.0, "label": "deep recovery"},
}

CARRIER_HZ = 200.0


def build_youtube_query(genre: str, mood: str, band: str) -> str:
    return f"{band} waves {genre} {mood} study music binaural"
