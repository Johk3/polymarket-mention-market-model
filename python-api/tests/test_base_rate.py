"""Tests for base rate calculator."""
from probability.base_rate import compute_base_rate, BaseRateResult


def test_mention_rate_full():
    speeches = [
        {"text": "Trump mentioned tariffs today"},
        {"text": "Tariffs were discussed by Trump"},
    ]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 1.0
    assert result.total_speeches == 2
    assert result.speeches_with_mention == 2


def test_mention_rate_zero():
    speeches = [{"text": "Nothing relevant here"}]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 0.0
    assert result.speeches_with_mention == 0


def test_mention_rate_partial():
    speeches = [
        {"text": "tariffs are high"},
        {"text": "no relevant content"},
    ]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 0.5
    assert result.speeches_with_mention == 1


def test_empty_corpus():
    result = compute_base_rate("tariffs", [])
    assert result.mention_rate == 0.0
    assert result.total_speeches == 0


def test_case_insensitive():
    speeches = [{"text": "TARIFFS are important"}, {"text": "Tariffs policy"}]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 1.0


def test_word_boundary():
    speeches = [{"text": "tariffsextra not a match"}]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 0.0


def test_utterances_format():
    speeches = [
        {"utterances": [{"text": "tariffs are important"}, {"text": "economy"}]},
    ]
    result = compute_base_rate("tariffs", speeches)
    assert result.mention_rate == 1.0
