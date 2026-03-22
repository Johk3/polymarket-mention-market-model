from corpus.models import Speech, Utterance


def save_speech(db, video_id: str, title: str, utterances: list[dict], upload_date: str = "") -> Speech:
    """Save a speech and its utterances. Idempotent: returns existing if video_id already in DB."""
    existing = get_speech_by_video_id(db, video_id)
    if existing:
        return existing

    speech = Speech(
        video_id=video_id,
        title=title,
        upload_date=upload_date,
        utterance_count=len(utterances),
    )
    db.add(speech)
    db.flush()

    for u in utterances:
        utterance = Utterance(
            speech_id=speech.id,
            text=u.get("text", ""),
            start_seconds=u.get("start_seconds", 0.0),
            duration=u.get("duration", 0.0),
        )
        db.add(utterance)

    db.commit()
    db.refresh(speech)
    return speech


def get_speech_by_video_id(db, video_id: str) -> Speech | None:
    """Return speech or None."""
    return db.query(Speech).filter(Speech.video_id == video_id).first()


def list_speeches(db, limit: int = 100) -> list[Speech]:
    """Return speeches ordered by upload_date desc."""
    return db.query(Speech).order_by(Speech.upload_date.desc()).limit(limit).all()
