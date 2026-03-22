import html
import re

NOISE_PATTERN = re.compile(r'^\[.*\]$')


def parse_transcript(raw_segments: list[dict]) -> list[dict]:
    """
    Parse raw youtube-transcript-api segments into clean utterance dicts.

    Each raw segment: {"text": str, "start": float, "duration": float}
    Returns: list of {"text": str, "start_seconds": float, "duration": float}

    Filters:
    - Remove noise tokens matching [Music], [Applause], [Laughter], etc. (bracket content)
    - Decode HTML entities (&amp; → &, &#39; → ')
    - Filter empty/whitespace-only segments
    - Normalize text: strip, collapse multiple spaces
    """
    result = []
    for segment in raw_segments:
        text = segment.get("text", "")
        text = html.unescape(text)
        text = re.sub(r' +', ' ', text).strip()
        if not text:
            continue
        if NOISE_PATTERN.match(text):
            continue
        result.append({
            "text": text,
            "start_seconds": segment.get("start", 0.0),
            "duration": segment.get("duration", 0.0),
        })
    return result
