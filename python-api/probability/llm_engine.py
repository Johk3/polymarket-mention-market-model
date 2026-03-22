"""LLM probability engine using Claude API."""
import os
from dataclasses import dataclass

import anthropic


@dataclass
class LLMEstimate:
    probability: float
    reasoning: str
    model: str


class LLMProbabilityEngine:
    def __init__(self, api_key: str | None = None, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = model

    def estimate(
        self,
        market_question: str,
        target_phrase: str,
        base_rate: float,
        current_transcript: str,
        elapsed_seconds: float,
    ) -> LLMEstimate:
        """Call Claude to estimate probability. Raises RuntimeError if no API key."""
        if not self.api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")

        transcript_text = current_transcript[-3000:] if len(current_transcript) > 3000 else current_transcript
        if not transcript_text.strip():
            transcript_text = "(Speech has just begun)"

        client = anthropic.Anthropic(api_key=self.api_key)
        response = client.messages.create(
            model=self.model,
            max_tokens=512,
            tools=[
                {
                    "name": "submit_probability_estimate",
                    "description": "Submit a structured probability estimate",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "probability": {"type": "number", "description": "Probability between 0 and 1"},
                            "reasoning": {"type": "string", "description": "Brief reasoning for the estimate"},
                        },
                        "required": ["probability", "reasoning"],
                    },
                }
            ],
            tool_choice={"type": "tool", "name": "submit_probability_estimate"},
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Market question: {market_question}\n"
                        f"Target phrase: '{target_phrase}'\n"
                        f"Historical base rate: {base_rate:.3f} (fraction of past speeches mentioning this phrase)\n"
                        f"Elapsed time: {int(elapsed_seconds)}s\n"
                        f"Current transcript:\n{transcript_text}\n\n"
                        "Estimate the probability that the speaker will mention the target phrase."
                    ),
                }
            ],
        )

        tool_use = next((b for b in response.content if b.type == "tool_use"), None)
        if tool_use is None:
            raise RuntimeError("LLM did not return a tool_use block")

        raw_prob = float(tool_use.input["probability"])
        probability = max(0.01, min(0.99, raw_prob))
        reasoning = tool_use.input.get("reasoning", "")

        return LLMEstimate(probability=probability, reasoning=reasoning, model=self.model)
