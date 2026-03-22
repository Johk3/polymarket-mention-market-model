"""Corpus REST API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from corpus.models import get_db
from corpus.storage import list_speeches, get_speech_by_video_id
from analysis.word_frequency import compute_frequencies

router = APIRouter(prefix="/speeches", tags=["corpus"])


class UtteranceOut(BaseModel):
    text: str
    start_seconds: float
    duration: float


class SpeechSummary(BaseModel):
    video_id: str
    title: str
    upload_date: str
    utterance_count: int


class SpeechDetail(BaseModel):
    video_id: str
    title: str
    upload_date: str
    utterances: list[UtteranceOut]


@router.get("", response_model=list[SpeechSummary])
def get_speeches(limit: int = Query(100, ge=1, le=1000), db=Depends(get_db)):
    speeches = list_speeches(db, limit=limit)
    return [
        SpeechSummary(
            video_id=s.video_id,
            title=s.title,
            upload_date=s.upload_date or "",
            utterance_count=s.utterance_count,
        )
        for s in speeches
    ]


@router.get("/{video_id}", response_model=SpeechDetail)
def get_speech(video_id: str, db=Depends(get_db)):
    speech = get_speech_by_video_id(db, video_id)
    if speech is None:
        raise HTTPException(status_code=404, detail="Speech not found")
    return SpeechDetail(
        video_id=speech.video_id,
        title=speech.title,
        upload_date=speech.upload_date or "",
        utterances=[
            UtteranceOut(text=u.text, start_seconds=u.start_seconds, duration=u.duration)
            for u in speech.utterances
        ],
    )


frequencies_router = APIRouter(prefix="/frequencies", tags=["corpus"])


class FrequencyItem(BaseModel):
    word: str
    count: int


@frequencies_router.get("", response_model=list[FrequencyItem])
def get_frequencies(
    phrase: str = Query("", description="Filter to speeches mentioning this phrase"),
    top: int = Query(20, ge=1, le=200),
    db=Depends(get_db),
):
    speeches = list_speeches(db, limit=10000)
    texts = []
    for s in speeches:
        if phrase:
            text = " ".join(u.text for u in s.utterances)
            if phrase.lower() in text.lower():
                texts.append(text)
        else:
            texts.append(" ".join(u.text for u in s.utterances))
    freq = compute_frequencies(texts)
    sorted_freq = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top]
    return [FrequencyItem(word=w, count=c) for w, c in sorted_freq]
