"""Bayesian real-time probability updater."""
import re


class BayesianUpdater:
    def __init__(self, prior: float, collocates: list[str], avg_mention_time_seconds: float = 600.0):
        self.prior = prior
        self.collocates = [c.lower() for c in collocates]
        self.avg_mention_time_seconds = max(avg_mention_time_seconds, 1.0)

    def update(self, current_transcript: str, elapsed_seconds: float) -> float:
        """Return updated probability in [0.01, 0.99]."""
        text_lower = current_transcript.lower()

        # Co-occurrence signal: fraction of collocates present
        if self.collocates:
            present = sum(
                1 for c in self.collocates
                if re.search(r'\b' + re.escape(c) + r'\b', text_lower)
            )
            collocate_score = present / len(self.collocates)
        else:
            collocate_score = 0.0

        # Time decay: if elapsed >> avg_mention_time, probability decreases
        time_ratio = elapsed_seconds / self.avg_mention_time_seconds
        time_decay = max(0.0, 1.0 - (time_ratio / 3.0))

        # Blend: start from prior, boost for collocates, decay for time
        probability = self.prior * (1.0 + collocate_score) * time_decay
        probability = self.prior + (probability - self.prior) * 0.5

        return max(0.01, min(0.99, probability))
