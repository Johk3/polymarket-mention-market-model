import subprocess, json


def list_channel_videos(channel: str = "@whitehouse", limit: int = 50) -> list[dict]:
    """
    List videos from a YouTube channel using yt-dlp.
    Returns list of {"video_id": str, "title": str, "upload_date": str, "duration_seconds": int}
    Returns [] on failure.
    """
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "--dump-json",
                "--flat-playlist",
                f"--playlist-end={limit}",
                f"https://www.youtube.com/{channel}/videos",
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        videos = []
        for line in result.stdout.strip().splitlines():
            if not line:
                continue
            data = json.loads(line)
            videos.append({
                "video_id": data.get("id", ""),
                "title": data.get("title", ""),
                "upload_date": data.get("upload_date", ""),
                "duration_seconds": data.get("duration", 0) or 0,
            })
        return videos
    except Exception:
        return []
