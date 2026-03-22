from youtube_transcript_api import YouTubeTranscriptApi


def fetch_transcript(video_id: str) -> list[dict]:
    """
    Fetch and parse the English transcript for a YouTube video.
    Returns [] if no transcript is available.
    """
    try:
        raw = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        from ingestion.transcript_parser import parse_transcript
        return parse_transcript(raw)
    except Exception:
        return []
