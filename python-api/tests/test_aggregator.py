"""Tests for probability aggregator."""
from probability.aggregator import ProbabilityAggregator, AggregatedEstimate


def test_statistical_only():
    agg = ProbabilityAggregator()
    result = agg.aggregate(statistical_probability=0.4)
    assert result.probability == 0.4
    assert result.llm_available is False
    assert result.llm_probability is None
    assert result.lower_bound <= result.probability <= result.upper_bound


def test_with_llm():
    agg = ProbabilityAggregator(statistical_weight=0.35, llm_weight=0.65)
    result = agg.aggregate(statistical_probability=0.4, llm_probability=0.6, llm_reasoning="test")
    expected = 0.35 * 0.4 + 0.65 * 0.6
    assert abs(result.probability - expected) < 0.001
    assert result.llm_available is True
    assert result.lower_bound <= result.probability <= result.upper_bound


def test_bounds_always_valid():
    agg = ProbabilityAggregator()
    for stat, llm in [(0.1, 0.9), (0.5, 0.5), (0.0, 1.0)]:
        result = agg.aggregate(stat, llm)
        assert result.lower_bound <= result.probability <= result.upper_bound


def test_probability_clamped():
    agg = ProbabilityAggregator(statistical_weight=0.5, llm_weight=0.5)
    result = agg.aggregate(statistical_probability=0.99, llm_probability=0.99)
    assert result.probability <= 0.99


def test_default_weights():
    agg = ProbabilityAggregator()
    assert agg.statistical_weight == 0.35
    assert agg.llm_weight == 0.65
