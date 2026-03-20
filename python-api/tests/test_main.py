"""Tests for the Polymarket Mention Market Model API (python-api/main.py)."""

from __future__ import annotations

import math

import pytest
from fastapi.testclient import TestClient

from main import app, logistic, predict_probability, API_VERSION

client = TestClient(app)

# ---------------------------------------------------------------------------
# Unit tests – logistic helper
# ---------------------------------------------------------------------------


class TestLogistic:
    def test_midpoint_returns_half(self) -> None:
        assert logistic(0.5) == pytest.approx(0.5, abs=1e-6)

    def test_above_midpoint_returns_above_half(self) -> None:
        assert logistic(0.75) > 0.5

    def test_below_midpoint_returns_below_half(self) -> None:
        assert logistic(0.25) < 0.5

    def test_output_is_bounded_between_zero_and_one(self) -> None:
        for x in (-1.0, 0.0, 0.25, 0.5, 0.75, 1.0, 2.0):
            result = logistic(x)
            assert 0.0 <= result <= 1.0

    def test_higher_steepness_creates_sharper_curve(self) -> None:
        low_k = logistic(0.9, k=2)
        high_k = logistic(0.9, k=20)
        # Higher steepness pushes extreme inputs closer to 0/1.
        assert high_k > low_k

    def test_custom_midpoint_shifts_inflection(self) -> None:
        assert logistic(0.3, midpoint=0.3) == pytest.approx(0.5, abs=1e-6)

    def test_symmetric_around_midpoint(self) -> None:
        above = logistic(0.7)
        below = logistic(0.3)
        assert above + below == pytest.approx(1.0, abs=1e-6)


# ---------------------------------------------------------------------------
# Unit tests – predict_probability helper
# ---------------------------------------------------------------------------


class TestPredictProbability:
    def test_neutral_inputs_return_half(self) -> None:
        result = predict_probability(mention_score=0.5, baseline=0.5)
        assert result == pytest.approx(0.5, abs=1e-6)

    def test_high_mention_increases_probability(self) -> None:
        assert predict_probability(mention_score=1.0, baseline=0.5) > 0.5

    def test_low_mention_decreases_probability(self) -> None:
        assert predict_probability(mention_score=0.0, baseline=0.5) < 0.5

    def test_result_is_bounded(self) -> None:
        for score in (0.0, 0.25, 0.5, 0.75, 1.0):
            result = predict_probability(score)
            assert 0.0 < result < 1.0

    def test_high_baseline_raises_probability(self) -> None:
        low = predict_probability(0.5, baseline=0.1)
        high = predict_probability(0.5, baseline=0.9)
        assert high > low

    def test_higher_steepness_amplifies_extremes(self) -> None:
        gentle = predict_probability(1.0, steepness=1.0)
        steep = predict_probability(1.0, steepness=20.0)
        assert steep > gentle

    def test_zero_mention_with_low_baseline_is_very_low(self) -> None:
        result = predict_probability(0.0, baseline=0.0)
        assert result < 0.1

    def test_full_mention_with_high_baseline_is_very_high(self) -> None:
        result = predict_probability(1.0, baseline=1.0)
        assert result > 0.9


# ---------------------------------------------------------------------------
# Integration tests – GET /health
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    def test_returns_200(self) -> None:
        response = client.get("/health")
        assert response.status_code == 200

    def test_status_is_ok(self) -> None:
        data = client.get("/health").json()
        assert data["status"] == "ok"

    def test_version_matches_constant(self) -> None:
        data = client.get("/health").json()
        assert data["version"] == API_VERSION

    def test_response_contains_expected_keys(self) -> None:
        data = client.get("/health").json()
        assert "status" in data
        assert "version" in data


# ---------------------------------------------------------------------------
# Integration tests – POST /predict
# ---------------------------------------------------------------------------


class TestPredictEndpoint:
    def test_returns_200_for_valid_payload(self) -> None:
        response = client.post("/predict", json={"mention_score": 0.5})
        assert response.status_code == 200

    def test_neutral_inputs_return_half_probability(self) -> None:
        response = client.post(
            "/predict",
            json={"mention_score": 0.5, "baseline": 0.5},
        )
        data = response.json()
        assert data["probability"] == pytest.approx(0.5, abs=1e-4)

    def test_response_echoes_input_fields(self) -> None:
        payload = {"mention_score": 0.7, "baseline": 0.4, "steepness": 8.0}
        data = client.post("/predict", json=payload).json()
        assert data["mention_score"] == payload["mention_score"]
        assert data["baseline"] == payload["baseline"]
        assert data["steepness"] == payload["steepness"]

    def test_probability_is_between_zero_and_one(self) -> None:
        for score in (0.0, 0.25, 0.5, 0.75, 1.0):
            data = client.post("/predict", json={"mention_score": score}).json()
            assert 0.0 < data["probability"] < 1.0

    def test_high_mention_score_yields_high_probability(self) -> None:
        data = client.post("/predict", json={"mention_score": 1.0}).json()
        assert data["probability"] > 0.5

    def test_low_mention_score_yields_low_probability(self) -> None:
        data = client.post("/predict", json={"mention_score": 0.0}).json()
        assert data["probability"] < 0.5

    def test_returns_422_for_score_above_one(self) -> None:
        response = client.post("/predict", json={"mention_score": 1.1})
        assert response.status_code == 422

    def test_returns_422_for_score_below_zero(self) -> None:
        response = client.post("/predict", json={"mention_score": -0.1})
        assert response.status_code == 422

    def test_returns_422_for_missing_mention_score(self) -> None:
        response = client.post("/predict", json={})
        assert response.status_code == 422

    def test_returns_422_for_non_numeric_mention_score(self) -> None:
        response = client.post("/predict", json={"mention_score": "high"})
        assert response.status_code == 422

    def test_returns_422_for_invalid_baseline(self) -> None:
        response = client.post(
            "/predict",
            json={"mention_score": 0.5, "baseline": 1.5},
        )
        assert response.status_code == 422

    def test_returns_422_for_non_positive_steepness(self) -> None:
        response = client.post(
            "/predict",
            json={"mention_score": 0.5, "steepness": 0.0},
        )
        assert response.status_code == 422

    def test_probability_is_rounded_to_six_decimal_places(self) -> None:
        data = client.post("/predict", json={"mention_score": 0.333}).json()
        decimals = len(str(data["probability"]).split(".")[-1])
        assert decimals <= 6

    def test_default_baseline_is_half(self) -> None:
        data = client.post("/predict", json={"mention_score": 0.5}).json()
        assert data["baseline"] == 0.5

    def test_custom_steepness_affects_probability(self) -> None:
        gentle = client.post(
            "/predict",
            json={"mention_score": 0.9, "steepness": 1.0},
        ).json()["probability"]
        steep = client.post(
            "/predict",
            json={"mention_score": 0.9, "steepness": 20.0},
        ).json()["probability"]
        assert steep > gentle
