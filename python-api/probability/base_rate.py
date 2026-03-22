"""Historical base rate calculator."""
import re
from dataclasses import dataclass


@dataclass
class BaseRateResult:
    phrase: str
    mention_rate: float
    total_speeches: int
    speeches_with_mention: int
    avg_mentions_per_speech: float
    total_occurrences: int


def _count_mentions(phrase: str, text: str) -> int:
    """Count case-insensitive word-boundary occurrences of phrase in text."""
    pattern = re.compile(r'\b' + re.escape(phrase.lower()) + r'\b')
    return len(pattern.findall(text.lower()))


def compute_base_rate(phrase: str, speeches: list[dict]) -> BaseRateResult:
    """
    Compute base rate for phrase across a list of speech dicts.
    Each speech dict must have a "text" key with the full speech text,
    OR a "utterances" key with list of utterance dicts with "text".
    """
    total = len(speeches)
    if total == 0:
        return BaseRateResult(phrase=phrase, mention_rate=0.0, total_speeches=0,
                              speeches_with_mention=0, avg_mentions_per_speech=0.0,
                              total_occurrences=0)
    speeches_with = 0
    total_occurrences = 0
    for speech in speeches:
        # Accept either a "text" field or aggregate utterances
        if "text" in speech:
            text = speech["text"]
        elif "utterances" in speech:
            text = " ".join(u.get("text", "") for u in speech["utterances"])
        else:
            text = ""
        count = _count_mentions(phrase, text)
        if count > 0:
            speeches_with += 1
        total_occurrences += count
    return BaseRateResult(
        phrase=phrase,
        mention_rate=speeches_with / total,
        total_speeches=total,
        speeches_with_mention=speeches_with,
        avg_mentions_per_speech=total_occurrences / total,
        total_occurrences=total_occurrences,
    )


def compute_base_rate_from_db(phrase: str, db) -> BaseRateResult:
    """Load speeches from DB and compute base rate."""
    from corpus.storage import list_speeches
    speeches_orm = list_speeches(db, limit=10000)
    speeches = []
    for s in speeches_orm:
        text = " ".join(u.text for u in s.utterances)
        speeches.append({"text": text})
    return compute_base_rate(phrase, speeches)
