"""Tests for probability API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from corpus.models import get_db
from corpus.storage import save_speech


def make_test_app():
    from fastapi import FastAPI
    from api.routes.probability import router
    app = FastAPI()
    app.include_router(router)
    return app


@pytest.fixture
def client(db_session):
    app = make_test_app()
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)


def test_base_rate_empty_corpus(client):
    response = client.get("/probability/base-rate/tariffs")
    assert response.status_code == 200
    data = response.json()
    assert data["phrase"] == "tariffs"
    assert data["mention_rate"] == 0.0


def test_base_rate_with_corpus(client, db_session):
    save_speech(db_session, "vid1", "Speech 1",
                [{"text": "tariffs are important today", "start_seconds": 0.0, "duration": 2.0}])
    response = client.get("/probability/base-rate/tariffs")
    assert response.status_code == 200
    data = response.json()
    assert data["mention_rate"] == 1.0
    assert data["total_speeches"] == 1


def test_estimate_no_llm(client, db_session):
    save_speech(db_session, "vid1", "Speech 1",
                [{"text": "tariffs are important", "start_seconds": 0.0, "duration": 2.0}])
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": ""}):
        response = client.post("/probability/estimate", json={
            "market_question": "Will Trump mention tariffs?",
            "target_phrase": "tariffs",
            "current_transcript": "some speech text",
            "elapsed_seconds": 100.0,
        })
    assert response.status_code == 200
    data = response.json()
    assert "probability" in data
    assert data["llm_available"] is False
    assert 0.0 <= data["probability"] <= 1.0


def test_estimate_clob_unavailable_handled(client):
    """When corpus is empty, estimate still returns valid response."""
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": ""}):
        response = client.post("/probability/estimate", json={
            "market_question": "Will Trump mention tariffs?",
            "target_phrase": "tariffs",
            "current_transcript": "",
            "elapsed_seconds": 0.0,
        })
    assert response.status_code == 200
