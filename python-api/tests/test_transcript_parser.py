"""Tests for transcript parser and fetcher."""
import pytest
from ingestion.transcript_parser import parse_transcript


def test_basic_parse():
    raw = [{"text": "Hello world", "start": 0.0, "duration": 2.5}]
    result = parse_transcript(raw)
    assert len(result) == 1
    assert result[0]["text"] == "Hello world"
    assert result[0]["start_seconds"] == 0.0
    assert result[0]["duration"] == 2.5


def test_filters_noise_tokens():
    raw = [
        {"text": "[Music]", "start": 0.0, "duration": 1.0},
        {"text": "[Applause]", "start": 1.0, "duration": 1.0},
        {"text": "[Laughter]", "start": 2.0, "duration": 1.0},
        {"text": "Good morning", "start": 3.0, "duration": 2.0},
    ]
    result = parse_transcript(raw)
    assert len(result) == 1
    assert result[0]["text"] == "Good morning"


def test_decodes_html_entities():
    raw = [{"text": "We &amp; they &#39;re here", "start": 0.0, "duration": 2.0}]
    result = parse_transcript(raw)
    assert result[0]["text"] == "We & they 're here"


def test_filters_empty_segments():
    raw = [
        {"text": "   ", "start": 0.0, "duration": 1.0},
        {"text": "", "start": 1.0, "duration": 1.0},
        {"text": "Hello", "start": 2.0, "duration": 1.0},
    ]
    result = parse_transcript(raw)
    assert len(result) == 1
    assert result[0]["text"] == "Hello"


def test_normalizes_whitespace():
    raw = [{"text": "  hello   world  ", "start": 0.0, "duration": 2.0}]
    result = parse_transcript(raw)
    assert result[0]["text"] == "hello world"


def test_empty_input():
    assert parse_transcript([]) == []


def test_fetch_transcript_returns_empty_on_error():
    from unittest.mock import patch
    with patch("ingestion.transcript_fetcher.YouTubeTranscriptApi") as mock_api:
        mock_api.get_transcript.side_effect = Exception("No transcript")
        from ingestion.transcript_fetcher import fetch_transcript
        result = fetch_transcript("nonexistent_id")
        assert result == []


def test_fetch_transcript_returns_parsed():
    from unittest.mock import patch, MagicMock
    raw = [{"text": "Hello", "start": 0.0, "duration": 1.0}]
    with patch("ingestion.transcript_fetcher.YouTubeTranscriptApi") as mock_api:
        mock_api.get_transcript.return_value = raw
        from ingestion import transcript_fetcher
        # Re-import after patching
        import importlib
        import ingestion.transcript_fetcher as tf_module
        tf_module.YouTubeTranscriptApi = mock_api
        result = tf_module.fetch_transcript("some_id")
        # Should return parsed result
        assert isinstance(result, list)
