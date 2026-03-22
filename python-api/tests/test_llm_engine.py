"""Tests for LLM probability engine."""
import pytest
from unittest.mock import MagicMock, patch
from probability.llm_engine import LLMProbabilityEngine, LLMEstimate


def test_raises_without_api_key():
    engine = LLMProbabilityEngine(api_key="")
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        engine.estimate("question", "tariffs", 0.3, "transcript", 100.0)


def test_estimate_with_mocked_client():
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.input = {"probability": 0.7, "reasoning": "High likelihood"}
    mock_response = MagicMock()
    mock_response.content = [mock_tool_use]

    with patch("probability.llm_engine.anthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value = mock_response

        engine = LLMProbabilityEngine(api_key="test-key")
        result = engine.estimate("Will Trump mention tariffs?", "tariffs", 0.3, "transcript text", 100.0)

        assert isinstance(result, LLMEstimate)
        assert result.probability == 0.7
        assert result.reasoning == "High likelihood"


def test_probability_clamped_high():
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.input = {"probability": 1.5, "reasoning": "very high"}
    mock_response = MagicMock()
    mock_response.content = [mock_tool_use]

    with patch("probability.llm_engine.anthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value = mock_response

        engine = LLMProbabilityEngine(api_key="test-key")
        result = engine.estimate("question", "phrase", 0.3, "text", 100.0)
        assert result.probability <= 0.99


def test_probability_clamped_low():
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.input = {"probability": -0.5, "reasoning": "very low"}
    mock_response = MagicMock()
    mock_response.content = [mock_tool_use]

    with patch("probability.llm_engine.anthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value = mock_response

        engine = LLMProbabilityEngine(api_key="test-key")
        result = engine.estimate("question", "phrase", 0.3, "text", 100.0)
        assert result.probability >= 0.01


def test_empty_transcript_becomes_placeholder():
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.input = {"probability": 0.3, "reasoning": "just started"}
    mock_response = MagicMock()
    mock_response.content = [mock_tool_use]

    with patch("probability.llm_engine.anthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value = mock_response

        engine = LLMProbabilityEngine(api_key="test-key")
        engine.estimate("question", "phrase", 0.3, "", 0.0)

        call_args = mock_client.messages.create.call_args
        messages = call_args.kwargs["messages"]
        # Check that the placeholder text is in the prompt
        content = messages[0]["content"]
        assert "(Speech has just begun)" in content


def test_long_transcript_truncated():
    long_transcript = "x " * 2000  # > 3000 chars
    mock_tool_use = MagicMock()
    mock_tool_use.type = "tool_use"
    mock_tool_use.input = {"probability": 0.5, "reasoning": "mid"}
    mock_response = MagicMock()
    mock_response.content = [mock_tool_use]

    with patch("probability.llm_engine.anthropic") as mock_anthropic:
        mock_client = MagicMock()
        mock_anthropic.Anthropic.return_value = mock_client
        mock_client.messages.create.return_value = mock_response

        engine = LLMProbabilityEngine(api_key="test-key")
        engine.estimate("question", "phrase", 0.3, long_transcript, 100.0)

        call_args = mock_client.messages.create.call_args
        messages = call_args.kwargs["messages"]
        content = messages[0]["content"]
        # The transcript section should be at most 3000 chars of the original
        assert len(content) < len(long_transcript)
