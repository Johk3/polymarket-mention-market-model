"""Probability signal aggregator."""
from dataclasses import dataclass


@dataclass
class AggregatedEstimate:
    probability: float
    lower_bound: float
    upper_bound: float
    statistical_probability: float
    llm_probability: float | None
    llm_available: bool
    reasoning: str


class ProbabilityAggregator:
    def __init__(self, statistical_weight: float = 0.35, llm_weight: float = 0.65):
        self.statistical_weight = statistical_weight
        self.llm_weight = llm_weight

    def aggregate(
        self,
        statistical_probability: float,
        llm_probability: float | None = None,
        llm_reasoning: str | None = None,
    ) -> AggregatedEstimate:
        if llm_probability is None:
            probability = statistical_probability
            llm_available = False
            reasoning = "Statistical-only estimate (LLM unavailable)"
        else:
            probability = (
                self.statistical_weight * statistical_probability
                + self.llm_weight * llm_probability
            )
            llm_available = True
            reasoning = llm_reasoning or ""

        probability = max(0.01, min(0.99, probability))

        # Confidence band based on disagreement
        if llm_probability is not None:
            disagreement = abs(statistical_probability - llm_probability)
        else:
            disagreement = 0.1  # default uncertainty when LLM not available

        half_band = disagreement * 0.5 + 0.02
        lower_bound = max(0.01, probability - half_band)
        upper_bound = min(0.99, probability + half_band)

        return AggregatedEstimate(
            probability=round(probability, 4),
            lower_bound=round(lower_bound, 4),
            upper_bound=round(upper_bound, 4),
            statistical_probability=round(statistical_probability, 4),
            llm_probability=round(llm_probability, 4) if llm_probability is not None else None,
            llm_available=llm_available,
            reasoning=reasoning,
        )
