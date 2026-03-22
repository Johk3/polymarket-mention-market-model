"""Tests for Bayesian probability updater."""
from probability.bayesian_updater import BayesianUpdater


def test_stays_near_prior_with_no_collocates():
    updater = BayesianUpdater(prior=0.3, collocates=[], avg_mention_time_seconds=600.0)
    prob = updater.update("some unrelated text", elapsed_seconds=100.0)
    assert 0.01 <= prob <= 0.99


def test_increases_with_collocates():
    updater = BayesianUpdater(prior=0.3, collocates=["economy", "trade"], avg_mention_time_seconds=600.0)
    prob_without = updater.update("unrelated text", elapsed_seconds=100.0)
    prob_with = updater.update("economy and trade discussion", elapsed_seconds=100.0)
    assert prob_with >= prob_without


def test_time_decay_reduces_probability():
    updater = BayesianUpdater(prior=0.5, collocates=[], avg_mention_time_seconds=300.0)
    prob_early = updater.update("", elapsed_seconds=100.0)
    prob_late = updater.update("", elapsed_seconds=900.0)  # 3x avg_mention_time
    assert prob_late <= prob_early


def test_result_in_valid_range():
    updater = BayesianUpdater(prior=0.5, collocates=["x", "y"], avg_mention_time_seconds=100.0)
    prob = updater.update("x y z present here", elapsed_seconds=500.0)
    assert 0.01 <= prob <= 0.99


def test_zero_prior():
    updater = BayesianUpdater(prior=0.0, collocates=[], avg_mention_time_seconds=600.0)
    prob = updater.update("text", elapsed_seconds=0.0)
    assert 0.01 <= prob <= 0.99
