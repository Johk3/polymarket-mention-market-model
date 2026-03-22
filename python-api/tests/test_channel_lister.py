"""Tests for channel lister."""
import json
from unittest.mock import patch, MagicMock
from ingestion.channel_lister import list_channel_videos


def test_returns_empty_on_failure():
    with patch("ingestion.channel_lister.subprocess.run") as mock_run:
        mock_run.side_effect = Exception("yt-dlp not found")
        result = list_channel_videos()
        assert result == []


def test_parses_yt_dlp_output():
    video_data = {"id": "abc123", "title": "Test Video", "upload_date": "20250115", "duration": 300}
    mock_result = MagicMock()
    mock_result.stdout = json.dumps(video_data) + "\n"
    with patch("ingestion.channel_lister.subprocess.run", return_value=mock_result):
        result = list_channel_videos(channel="@whitehouse", limit=1)
        assert len(result) == 1
        assert result[0]["video_id"] == "abc123"
        assert result[0]["title"] == "Test Video"
        assert result[0]["upload_date"] == "20250115"
        assert result[0]["duration_seconds"] == 300


def test_empty_output():
    mock_result = MagicMock()
    mock_result.stdout = ""
    with patch("ingestion.channel_lister.subprocess.run", return_value=mock_result):
        result = list_channel_videos()
        assert result == []
