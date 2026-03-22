"""Tests for word frequency analysis."""
from analysis.word_frequency import compute_frequencies, compute_cooccurrence, get_collocates


def test_compute_frequencies_basic():
    texts = ["hello world", "hello python"]
    freq = compute_frequencies(texts)
    assert freq["hello"] == 2
    assert freq["world"] == 1
    assert freq["python"] == 1


def test_compute_frequencies_excludes_stop_words():
    texts = ["the quick brown fox"]
    freq = compute_frequencies(texts)
    assert "the" not in freq
    assert "quick" in freq
    assert "brown" in freq
    assert "fox" in freq


def test_compute_frequencies_empty():
    assert compute_frequencies([]) == {}


def test_compute_cooccurrence():
    texts = ["trump tariffs economy trade"]
    cooc = compute_cooccurrence(texts, window=2)
    assert "tariffs" in cooc
    assert "trump" in cooc["tariffs"]


def test_get_collocates():
    texts = ["trump tariffs trump economy tariffs trade tariffs"]
    cooc = compute_cooccurrence(texts, window=3)
    collocates = get_collocates("tariffs", cooc, top_n=2)
    assert len(collocates) <= 2
    assert all(isinstance(c, tuple) and len(c) == 2 for c in collocates)


def test_get_collocates_unknown_phrase():
    cooc = {"hello": {"world": 3}}
    result = get_collocates("unknown", cooc, top_n=5)
    assert result == []
