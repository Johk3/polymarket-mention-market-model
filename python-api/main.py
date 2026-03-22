"""Polymarket Mention Market Model API.

A lightweight FastAPI service that estimates a binary market's implied
probability based on normalised social-mention frequency.

Model
-----
The model uses a simple logistic (sigmoid) function that maps a normalised
mention score (0–1) to a probability (0–1):

    probability = 1 / (1 + exp(-k * (x - 0.5)))

where *k* controls steepness (default = 10).  At x=0 the output is ~0.007,
at x=0.5 it is 0.5, and at x=1 it is ~0.993.  An optional *baseline*
parameter shifts the curve, allowing callers to incorporate a prior.
"""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import FastAPI, Query
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class PredictionRequest(BaseModel):
    """Input payload for the /predict endpoint."""

    mention_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalised mention score in [0, 1].",
    )
    baseline: float = Field(
        0.5,
        ge=0.0,
        le=1.0,
        description="Prior probability used to shift the logistic curve.",
    )
    steepness: float = Field(
        10.0,
        gt=0.0,
        description="Steepness parameter k of the logistic function.",
    )

    @field_validator("mention_score", "baseline")
    @classmethod
    def _clamp(cls, v: float) -> float:
        return max(0.0, min(1.0, v))


class PredictionResponse(BaseModel):
    """Output of the /predict endpoint."""

    mention_score: float
    baseline: float
    steepness: float
    probability: float = Field(..., description="Estimated market probability in [0, 1].")


class HealthResponse(BaseModel):
    """Health-check response body."""

    status: str
    version: str


# ---------------------------------------------------------------------------
# Business logic
# ---------------------------------------------------------------------------

API_VERSION = "1.0.0"


def logistic(x: float, k: float = 10.0, midpoint: float = 0.5) -> float:
    """Return the logistic (sigmoid) value for *x*.

    Args:
        x:        Input value.
        k:        Steepness of the curve.
        midpoint: Inflection point of the curve.

    Returns:
        A float in (0, 1).
    """
    exponent = -k * (x - midpoint)
    # Guard against overflow for very large positive/negative exponents.
    if exponent > 700:
        return 0.0
    if exponent < -700:
        return 1.0
    return 1.0 / (1.0 + math.exp(exponent))


def predict_probability(
    mention_score: float,
    baseline: float = 0.5,
    steepness: float = 10.0,
) -> float:
    """Estimate a binary market's probability from a mention score.

    The mention score is blended with the baseline before applying the
    logistic function so that the prior is respected when signal is weak.

    Args:
        mention_score: Normalised mention score in [0, 1].
        baseline:      Prior probability in [0, 1].
        steepness:     Steepness parameter of the logistic curve.

    Returns:
        Estimated probability in [0, 1].
    """
    blended = (mention_score + baseline) / 2.0
    return logistic(blended, k=steepness)


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Polymarket Mention Market Model",
    description=(
        "Estimates binary-market probabilities from normalised social-mention scores."
    ),
    version=API_VERSION,
)


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="ok", version=API_VERSION)


@app.post("/predict", response_model=PredictionResponse, tags=["model"])
def predict(request: PredictionRequest) -> PredictionResponse:
    """Predict a market probability from the given mention score."""
    probability = predict_probability(
        mention_score=request.mention_score,
        baseline=request.baseline,
        steepness=request.steepness,
    )
    return PredictionResponse(
        mention_score=request.mention_score,
        baseline=request.baseline,
        steepness=request.steepness,
        probability=round(probability, 6),
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from api.routes.corpus import router as corpus_router, frequencies_router
from api.routes.probability import router as probability_router
from corpus.models import init_db

init_db()
app.include_router(corpus_router)
app.include_router(frequencies_router)
app.include_router(probability_router)
