"""CLI ingest script: python -m ingestion.ingest [--limit N]"""
import argparse
import sys
from corpus.models import SessionLocal, init_db
from corpus.storage import get_speech_by_video_id, save_speech
from ingestion.channel_lister import list_channel_videos
from ingestion.transcript_fetcher import fetch_transcript


def run_ingest(limit: int = 50) -> None:
    init_db()
    db = SessionLocal()
    try:
        videos = list_channel_videos(limit=limit)
        total = len(videos)
        for idx, video in enumerate(videos, 1):
            vid = video["video_id"]
            title = video["title"]
            print(f"[{idx}/{total}] Ingesting \"{title}\"...")
            existing = get_speech_by_video_id(db, vid)
            if existing:
                print(f"  Skipped (already ingested)")
                continue
            utterances = fetch_transcript(vid)
            if not utterances:
                print(f"  Warning: no transcript found, skipping")
                continue
            save_speech(db, video_id=vid, title=title, utterances=utterances, upload_date=video.get("upload_date", ""))
            print(f"  Saved {len(utterances)} utterances")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()
    run_ingest(limit=args.limit)
