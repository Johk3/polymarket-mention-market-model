"""Tests for corpus storage layer."""
import pytest
from corpus.storage import save_speech, get_speech_by_video_id, list_speeches


def test_save_and_retrieve_speech(db_session):
    utterances = [
        {"text": "Hello world", "start_seconds": 0.0, "duration": 2.5},
        {"text": "Good morning", "start_seconds": 2.5, "duration": 1.5},
    ]
    speech = save_speech(db_session, "vid1", "Test Speech", utterances, "20250115")
    assert speech.video_id == "vid1"
    assert speech.title == "Test Speech"
    assert speech.utterance_count == 2

    retrieved = get_speech_by_video_id(db_session, "vid1")
    assert retrieved is not None
    assert retrieved.video_id == "vid1"
    assert len(retrieved.utterances) == 2


def test_save_speech_idempotent(db_session):
    utterances = [{"text": "Hello", "start_seconds": 0.0, "duration": 1.0}]
    speech1 = save_speech(db_session, "vid1", "Title", utterances)
    speech2 = save_speech(db_session, "vid1", "Title", utterances)
    assert speech1.id == speech2.id


def test_get_nonexistent_speech(db_session):
    result = get_speech_by_video_id(db_session, "nonexistent")
    assert result is None


def test_list_speeches(db_session):
    for i in range(3):
        save_speech(db_session, f"vid{i}", f"Speech {i}", [], f"2025011{i}")
    speeches = list_speeches(db_session, limit=10)
    assert len(speeches) == 3


def test_list_speeches_limit(db_session):
    for i in range(5):
        save_speech(db_session, f"vid{i}", f"Speech {i}", [])
    speeches = list_speeches(db_session, limit=2)
    assert len(speeches) == 2
