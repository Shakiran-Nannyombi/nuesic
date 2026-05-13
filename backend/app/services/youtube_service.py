import os

import httpx

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


async def search_track(query: str) -> dict[str, str] | None:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError("YOUTUBE_API_KEY is not set")

    params = {
        "key": api_key,
        "q": query,
        "part": "snippet",
        "type": "video",
        "videoEmbeddable": "true",
        "videoCategoryId": "10",
        "maxResults": 1,
        "safeSearch": "strict",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(SEARCH_URL, params=params)
        r.raise_for_status()
        items = r.json().get("items", [])

    if not items:
        return None

    top = items[0]
    return {
        "video_id": top["id"]["videoId"],
        "title": top["snippet"]["title"],
        "channel": top["snippet"]["channelTitle"],
        "embed_url": f"https://www.youtube.com/embed/{top['id']['videoId']}",
    }
