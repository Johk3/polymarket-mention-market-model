"""Word frequency and co-occurrence analysis."""
import re
from collections import defaultdict

STOP_WORDS = {
    "the", "a", "an", "is", "it", "in", "on", "at", "to", "of", "and",
    "or", "but", "for", "with", "as", "by", "from", "that", "this", "be",
    "are", "was", "were", "has", "have", "had", "not", "we", "i", "you",
    "he", "she", "they", "do", "did", "will", "would", "can", "could",
    "its", "their", "our", "your", "his", "her", "been", "being", "so",
    "up", "if", "my", "all", "no", "about", "into", "then", "there",
    "s", "t", "re", "ve", "ll", "d", "m"
}


def _tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r'\b[a-z]+\b', text.lower()) if w not in STOP_WORDS]


def compute_frequencies(texts: list[str]) -> dict[str, int]:
    """Count word occurrences across all texts, excluding stop words."""
    counts: dict[str, int] = defaultdict(int)
    for text in texts:
        for word in _tokenize(text):
            counts[word] += 1
    return dict(counts)


def compute_cooccurrence(texts: list[str], window: int = 5) -> dict[str, dict[str, int]]:
    """Count word co-occurrences within a sliding window, excluding stop words."""
    cooc: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for text in texts:
        tokens = _tokenize(text)
        for i, word in enumerate(tokens):
            neighbors = tokens[max(0, i - window): i] + tokens[i + 1: i + window + 1]
            for neighbor in neighbors:
                cooc[word][neighbor] += 1
    return {k: dict(v) for k, v in cooc.items()}


def get_collocates(phrase: str, cooccurrence: dict[str, dict[str, int]], top_n: int = 10) -> list[tuple[str, int]]:
    """Return top N co-occurring words for a phrase."""
    key = phrase.lower()
    counts = cooccurrence.get(key, {})
    return sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
