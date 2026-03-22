"""Probability REST API endpoints."""
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from corpus.models import get_db
from probability.base_rate import compute_base_rate_from_db
from probability.bayesian_updater import BayesianUpdater
from probability.llm_engine import LLMProbabilityEngine
from probability.aggregator import ProbabilityAggregator

router = APIRouter(prefix="/probability", tags=["probability"])


class EstimateRequest(BaseModel):
    market_question: str
    target_phrase: str
    current_transcript: str = ""
    elapsed_seconds: float = 0.0


class BaseRateResponse(BaseModel):
    phrase: str
    mention_rate: float
    total_speeches: int
    speeches_with_mention: int
    avg_mentions_per_speech: float


class EstimateResponse(BaseModel):
    probability: float
    lower_bound: float
    upper_bound: float
    base_rate: float
    statistical_probability: float
    llm_probability: float | None
    llm_available: bool
    reasoning: str


@router.get("/base-rate/{phrase}", response_model=BaseRateResponse)
def get_base_rate(phrase: str, db=Depends(get_db)):
    result = compute_base_rate_from_db(phrase, db)
    return BaseRateResponse(
        phrase=result.phrase,
        mention_rate=result.mention_rate,
        total_speeches=result.total_speeches,
        speeches_with_mention=result.speeches_with_mention,
        avg_mentions_per_speech=result.avg_mentions_per_speech,
    )


@router.post("/estimate", response_model=EstimateResponse)
def estimate_probability(request: EstimateRequest, db=Depends(get_db)):
    # Step 1: base rate
    base_result = compute_base_rate_from_db(request.target_phrase, db)
    base_rate = base_result.mention_rate

    # Step 2: Bayesian update
    updater = BayesianUpdater(
        prior=base_rate if base_rate > 0 else 0.1,
        collocates=[],
        avg_mention_time_seconds=600.0,
    )
    statistical_prob = updater.update(request.current_transcript, request.elapsed_seconds)

    # Step 3: LLM estimate (optional)
    llm_prob = None
    llm_reasoning = None
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        try:
            engine = LLMProbabilityEngine(api_key=api_key)
            llm_est = engine.estimate(
                market_question=request.market_question,
                target_phrase=request.target_phrase,
                base_rate=base_rate,
                current_transcript=request.current_transcript,
                elapsed_seconds=request.elapsed_seconds,
            )
            llm_prob = llm_est.probability
            llm_reasoning = llm_est.reasoning
        except Exception:
            pass

    # Step 4: aggregate
    aggregator = ProbabilityAggregator()
    result = aggregator.aggregate(
        statistical_probability=statistical_prob,
        llm_probability=llm_prob,
        llm_reasoning=llm_reasoning,
    )

    return EstimateResponse(
        probability=result.probability,
        lower_bound=result.lower_bound,
        upper_bound=result.upper_bound,
        base_rate=base_rate,
        statistical_probability=result.statistical_probability,
        llm_probability=result.llm_probability,
        llm_available=result.llm_available,
        reasoning=result.reasoning,
    )
