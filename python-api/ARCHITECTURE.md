# Python API – Architecture Reference

This document provides an in-depth description of the `python-api/` service: its modules, data models, and the flow of data between them.

---

## Table of Contents

1. [Module Map](#module-map)
2. [Entry Point – `main.py`](#entry-point--mainpy)
3. [Corpus Layer](#corpus-layer)
4. [Ingestion Pipeline](#ingestion-pipeline)
5. [Analysis Module](#analysis-module)
6. [Probability Engine](#probability-engine)
7. [REST API Routes](#rest-api-routes)
8. [Database Schema](#database-schema)
9. [Error Handling Conventions](#error-handling-conventions)
10. [Extending the Service](#extending-the-service)

---

## Module Map

```
python-api/
├── main.py                     # FastAPI application factory + core /predict endpoint
├── requirements.txt
├── pytest.ini
│
├── api/                        # HTTP layer
│   └── routes/
│       ├── corpus.py           # /speeches and /frequencies endpoints
│       └── probability.py      # /probability/base-rate and /probability/estimate
│
├── analysis/                   # Text analytics (stateless, pure functions)
│   └── word_frequency.py       # Frequency counting and co-occurrence
│
├── corpus/                     # Persistence layer
│   ├── models.py               # SQLAlchemy ORM + DB engine
│   └── storage.py              # CRUD helpers
│
├── ingestion/                  # Data acquisition pipeline
│   ├── channel_lister.py       # List YouTube channel videos via yt-dlp
│   ├── transcript_fetcher.py   # Download transcripts via youtube-transcript-api
│   ├── transcript_parser.py    # Normalise raw transcript segments
│   └── ingest.py               # Orchestrating CLI script
│
└── probability/                # Probability estimation engine
    ├── base_rate.py             # Historical mention-rate from corpus
    ├── bayesian_updater.py      # Real-time Bayesian probability update
    ├── llm_engine.py            # Claude LLM probability estimate
    └── aggregator.py            # Weighted ensemble of statistical + LLM signals
```

---

## Entry Point – `main.py`

`main.py` serves two roles:

1. **Core logistic model**: exposes `POST /predict` and `GET /health` directly, without touching the database.
2. **Application factory**: creates the `FastAPI` instance, calls `init_db()` to ensure the SQLite schema exists, and registers the three sub-routers.

### Key functions

#### `logistic(x, k=10.0, midpoint=0.5) → float`

Pure sigmoid implementation with overflow guards:

```python
# Overflow guard: exp(>700) or exp(<-700) saturates IEEE 754 floats
if exponent > 700:
    return 0.0
if exponent < -700:
    return 1.0
return 1.0 / (1.0 + math.exp(exponent))
```

#### `predict_probability(mention_score, baseline=0.5, steepness=10.0) → float`

Blends the raw mention score with a baseline prior before passing through the logistic function, so weak signals are pulled toward the prior:

```python
blended = (mention_score + baseline) / 2.0
return logistic(blended, k=steepness)
```

### Pydantic models

| Model | Purpose |
|---|---|
| `PredictionRequest` | Validated input for `POST /predict` |
| `PredictionResponse` | Output of `POST /predict` |
| `HealthResponse` | Output of `GET /health` |

---

## Corpus Layer

### `corpus/models.py`

Defines the SQLAlchemy ORM models and the database engine.

**`Speech`** – represents one YouTube video / speech:

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `video_id` | String | Unique, indexed |
| `title` | String | Video title |
| `upload_date` | String | `YYYYMMDD` format from yt-dlp |
| `utterance_count` | Integer | Denormalised count |
| `created_at` | DateTime | UTC timestamp |

**`Utterance`** – one transcript segment within a speech:

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `speech_id` | Integer FK | References `speeches.id`, cascade delete |
| `text` | String | Cleaned segment text |
| `start_seconds` | Float | Segment start time |
| `duration` | Float | Segment duration in seconds |

`init_db()` is called once at startup to run `CREATE TABLE IF NOT EXISTS` for all models.

`get_db()` is a FastAPI dependency that yields a database session and ensures it is closed after the request.

### `corpus/storage.py`

Thin CRUD helpers used by both the ingestion pipeline and the API routes.

| Function | Behaviour |
|---|---|
| `save_speech(db, video_id, title, utterances, upload_date)` | Idempotent: returns the existing record if `video_id` is already present |
| `get_speech_by_video_id(db, video_id)` | Returns `Speech` or `None` |
| `list_speeches(db, limit=100)` | Returns speeches ordered by `upload_date DESC` |

---

## Ingestion Pipeline

The pipeline is designed to run as a one-off CLI command and is safe to re-run.

```
channel_lister.py → transcript_fetcher.py → transcript_parser.py → storage.py
```

### `ingestion/channel_lister.py`

Uses the `yt-dlp` subprocess to query a YouTube channel playlist. Returns a list of video metadata dicts:

```python
{
    "video_id": str,
    "title": str,
    "upload_date": str,   # YYYYMMDD
    "duration_seconds": int
}
```

Returns `[]` on any failure (network error, yt-dlp not installed, etc.).

### `ingestion/transcript_fetcher.py`

Calls `YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])` and delegates parsing to `transcript_parser.py`. Returns `[]` when no English transcript is available.

### `ingestion/transcript_parser.py`

Transforms raw API segments into cleaned utterance dicts:

**Input format** (from youtube-transcript-api):
```python
{"text": str, "start": float, "duration": float}
```

**Output format**:
```python
{"text": str, "start_seconds": float, "duration": float}
```

**Cleaning steps**:
1. Decode HTML entities (`&amp;` → `&`, `&#39;` → `'`)
2. Collapse multiple spaces
3. Strip leading/trailing whitespace
4. Discard empty segments
5. Discard noise tokens matching `^\\[.*\\]$` (e.g. `[Music]`, `[Applause]`)

### `ingestion/ingest.py`

Orchestrating CLI script. Run with:

```bash
python -m ingestion.ingest --limit 50
```

Logic:
1. Calls `list_channel_videos(limit=N)`.
2. For each video, checks whether it is already in the DB (skips if so).
3. Fetches and parses the transcript.
4. Saves the speech and utterances via `save_speech()`.

---

## Analysis Module

### `analysis/word_frequency.py`

Stateless, pure-function text analytics.

#### Stop words

A built-in set of common English function words is excluded from all counts.

#### `compute_frequencies(texts: list[str]) → dict[str, int]`

Tokenises each text with `\b[a-z]+\b`, filters stop words, and returns a flat frequency map.

#### `compute_cooccurrence(texts, window=5) → dict[str, dict[str, int]]`

Builds a word co-occurrence matrix using a sliding window of ±`window` tokens around each word.

#### `get_collocates(phrase, cooccurrence, top_n=10) → list[tuple[str, int]]`

Returns the top N words that co-occur most often with `phrase`.

---

## Probability Engine

### `probability/base_rate.py`

#### `compute_base_rate(phrase, speeches) → BaseRateResult`

Computes the historical mention rate for `phrase` across a list of speech dicts. Each dict should have either a `"text"` key (full text) or a `"utterances"` key (list of utterance dicts).

**`BaseRateResult` dataclass**:

| Field | Type | Description |
|---|---|---|
| `phrase` | str | The queried phrase |
| `mention_rate` | float | `speeches_with / total` |
| `total_speeches` | int | Total speeches analysed |
| `speeches_with_mention` | int | Speeches containing at least one match |
| `avg_mentions_per_speech` | float | `total_occurrences / total_speeches` |
| `total_occurrences` | int | Total phrase occurrences across all speeches |

Matching uses word-boundary regex (`\b...\b`) and is case-insensitive.

#### `compute_base_rate_from_db(phrase, db) → BaseRateResult`

Convenience wrapper: loads all speeches from the database and delegates to `compute_base_rate`.

---

### `probability/bayesian_updater.py`

#### `BayesianUpdater(prior, collocates, avg_mention_time_seconds=600.0)`

Parameters:

| Parameter | Description |
|---|---|
| `prior` | Starting probability (typically the base rate) |
| `collocates` | List of contextually related words to look for |
| `avg_mention_time_seconds` | Expected average time between mentions (used for time decay) |

#### `.update(current_transcript, elapsed_seconds) → float`

Real-time update algorithm:

```
collocate_score = (collocates present in transcript) / len(collocates)
time_ratio      = elapsed_seconds / avg_mention_time_seconds
time_decay      = max(0.0, 1.0 - time_ratio / 3.0)

raw_prob = prior × (1.0 + collocate_score) × time_decay
probability = prior + (raw_prob - prior) × 0.5   # dampen extremes
probability = clamp(probability, 0.01, 0.99)
```

---

### `probability/llm_engine.py`

#### `LLMProbabilityEngine(api_key=None, model="claude-sonnet-4-6")`

Wraps the Anthropic Python SDK. The API key is read from `ANTHROPIC_API_KEY` when not passed directly.

#### `.estimate(market_question, target_phrase, base_rate, current_transcript, elapsed_seconds) → LLMEstimate`

Constructs a structured prompt and calls Claude with **tool use** (`submit_probability_estimate`) to extract a typed `{"probability": float, "reasoning": str}` response, avoiding free-form parsing.

The last 3000 characters of the transcript are sent to stay within token limits.

**`LLMEstimate` dataclass**:

| Field | Type | Description |
|---|---|---|
| `probability` | float | Estimated probability, clamped to [0.01, 0.99] |
| `reasoning` | str | Claude's written reasoning |
| `model` | str | Model ID used |

Raises `RuntimeError` if `ANTHROPIC_API_KEY` is not set.

---

### `probability/aggregator.py`

#### `ProbabilityAggregator(statistical_weight=0.35, llm_weight=0.65)`

Weights default to a 35 % statistical / 65 % LLM split, reflecting that LLM estimates tend to be better-calibrated on novel contexts.

#### `.aggregate(statistical_probability, llm_probability=None, llm_reasoning=None) → AggregatedEstimate`

When `llm_probability` is `None`:
- `probability = statistical_probability`
- Uncertainty band defaults to ±7 % around the estimate.

When both signals are available:
- `probability = 0.35 × statistical + 0.65 × llm`
- Confidence band half-width = `0.5 × |statistical - llm| + 0.02`

Final probability is clamped to `[0.01, 0.99]`.

**`AggregatedEstimate` dataclass**:

| Field | Type | Description |
|---|---|---|
| `probability` | float | Final blended probability |
| `lower_bound` | float | Lower confidence bound |
| `upper_bound` | float | Upper confidence bound |
| `statistical_probability` | float | Input statistical estimate |
| `llm_probability` | `float \| None` | Input LLM estimate |
| `llm_available` | bool | Whether LLM was used |
| `reasoning` | str | LLM reasoning or fallback message |

---

## REST API Routes

Routes are defined in `api/routes/` and registered in `main.py`.

### `api/routes/corpus.py`

| Method | Path | Description |
|---|---|---|
| `GET` | `/speeches` | List all speeches (paginated by `limit`) |
| `GET` | `/speeches/{video_id}` | Get full transcript for one speech |
| `GET` | `/frequencies` | Word frequencies across corpus (optional phrase filter) |

### `api/routes/probability.py`

| Method | Path | Description |
|---|---|---|
| `GET` | `/probability/base-rate/{phrase}` | Historical base rate for a phrase |
| `POST` | `/probability/estimate` | Full probability estimate (Bayesian + LLM) |

### `main.py` (core routes)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/predict` | Logistic model prediction from mention score |

---

## Database Schema

```sql
CREATE TABLE speeches (
    id             INTEGER PRIMARY KEY,
    video_id       TEXT UNIQUE NOT NULL,
    title          TEXT,
    upload_date    TEXT,           -- YYYYMMDD
    utterance_count INTEGER DEFAULT 0,
    created_at     DATETIME
);

CREATE TABLE utterances (
    id             INTEGER PRIMARY KEY,
    speech_id      INTEGER REFERENCES speeches(id) ON DELETE CASCADE,
    text           TEXT,
    start_seconds  REAL,
    duration       REAL
);
```

---

## Error Handling Conventions

- **Ingestion functions** (`list_channel_videos`, `fetch_transcript`) return empty lists on any failure; they do not raise exceptions. This keeps the CLI ingest script fault-tolerant.
- **Storage functions** use SQLAlchemy sessions with `commit()` / `flush()`. The `get_db()` dependency ensures sessions are always closed.
- **API routes** raise `HTTPException(status_code=404)` for missing resources and rely on FastAPI's default 422 handling for validation errors.
- **LLM engine** raises `RuntimeError` if the API key is missing. The `/probability/estimate` endpoint catches all LLM exceptions and falls back to the statistical-only estimate.

---

## Extending the Service

### Adding a new probability signal

1. Create a new module in `probability/`, e.g. `probability/sentiment.py`.
2. Implement a function that returns a `float` in `[0, 1]`.
3. Incorporate the new signal in `ProbabilityAggregator.aggregate()` by adding a new weighted term.
4. Update `api/routes/probability.py` to accept any new input fields.

### Ingesting from a different YouTube channel

Pass a different channel handle to `list_channel_videos`:

```python
from ingestion.channel_lister import list_channel_videos
videos = list_channel_videos(channel="@POTUS", limit=100)
```

Or expose this as an environment variable in `ingest.py` for CLI use.

### Switching the LLM model

Pass a different `model` string to `LLMProbabilityEngine`:

```python
engine = LLMProbabilityEngine(model="claude-opus-4-5")
```

Any Anthropic model that supports tool use is compatible.
