"""Tests for corpus API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from corpus.models import Base, get_db
from corpus.storage import save_speech
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def make_test_app():
    from fastapi import FastAPI
    from api.routes.corpus import router, frequencies_router
    app = FastAPI()
    app.include_router(router)
    app.include_router(frequencies_router)
    return app


@pytest.fixture
def client(db_session):
    app = make_test_app()
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)


def test_get_speeches_empty(client):
    response = client.get("/speeches")
    assert response.status_code == 200
    assert response.json() == []


def test_get_speeches_with_data(client, db_session):
    save_speech(db_session, "vid1", "Speech 1", [{"text": "hello", "start_seconds": 0.0, "duration": 1.0}], "20250115")
    response = client.get("/speeches")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["video_id"] == "vid1"
    assert data[0]["utterance_count"] == 1


def test_get_speech_by_id(client, db_session):
    save_speech(db_session, "vid1", "Speech 1", [{"text": "hello", "start_seconds": 0.0, "duration": 1.0}])
    response = client.get("/speeches/vid1")
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "vid1"
    assert len(data["utterances"]) == 1


def test_get_speech_not_found(client):
    response = client.get("/speeches/nonexistent")
    assert response.status_code == 404


def test_get_frequencies(client, db_session):
    save_speech(db_session, "vid1", "Speech 1", [{"text": "tariffs economy trade", "start_seconds": 0.0, "duration": 1.0}])
    response = client.get("/frequencies?top=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    words = [item["word"] for item in data]
    assert "tariffs" in words or "economy" in words or "trade" in words
