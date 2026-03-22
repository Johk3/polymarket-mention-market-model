# Polymarket Mention Market Model

A full-stack application that estimates binary prediction-market probabilities from social-mention frequency in political speeches. The system ingests YouTube transcripts (defaulting to the `@whitehouse` channel), builds a searchable corpus, and combines a statistical Bayesian model with an optional Claude LLM signal to produce calibrated probability estimates.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [Requirements](#requirements)
5. [Installation & Setup](#installation--setup)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Python API Reference](#python-api-reference)
9. [The Probability Model](#the-probability-model)
10. [Data Pipeline](#data-pipeline)
11. [Development](#development)
12. [Testing](#testing)
13. [License](#license)

---

## Overview

Polymarket Mention Market Model answers the question: *"How likely is a speaker to mention topic X in this speech?"*

Given a target phrase (e.g. `"executive order"`) and a live or completed speech transcript, the system:

1. Computes the **historical base rate** – the fraction of past speeches in the corpus that contain the phrase.
2. Applies a **Bayesian updater** that adjusts the prior in real time as transcript text arrives, boosted by co-occurring terms and decayed by elapsed time.
3. Optionally calls the **Claude LLM** (Anthropic) to produce an independent probability estimate with written reasoning.
4. **Aggregates** the two signals into a final probability with a confidence band.

The result maps directly to a Polymarket-style binary outcome probability.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Laravel / Inertia.js UI                      │
│           (PHP 8.3, React 19, TypeScript, Tailwind CSS)          │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP
┌───────────────────────────────▼──────────────────────────────────┐
│                      Python FastAPI Service                       │
│                                                                   │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐ │
│  │  Ingestion  │   │    Corpus    │   │  Probability Engine    │ │
│  │             │   │              │   │                        │ │
│  │ channel_    │──▶│  SQLite DB   │──▶│ base_rate.py           │ │
│  │ lister.py   │   │  speeches    │   │ bayesian_updater.py    │ │
│  │ transcript_ │   │  utterances  │   │ llm_engine.py          │ │
│  │ fetcher.py  │   │              │   │ aggregator.py          │ │
│  │ ingest.py   │   └──────────────┘   └────────────────────────┘ │
│  └─────────────┘                                                  │
│                      ┌──────────────────┐                         │
│                      │  Analysis        │                         │
│                      │  word_frequency  │                         │
│                      └──────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  External Services   │
                    │  • YouTube (yt-dlp)  │
                    │  • Anthropic Claude  │
                    └──────────────────────┘
```

### Component Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Laravel 13 + Inertia.js + React 19 | User interface and authentication |
| API | FastAPI (Python 3.12+) | REST API and business logic |
| Database (corpus) | SQLite via SQLAlchemy | Speech transcript storage |
| Database (app) | SQLite (Laravel) | User accounts and sessions |
| Ingestion | yt-dlp + youtube-transcript-api | YouTube transcript download |
| LLM | Anthropic Claude (`claude-sonnet-4-6`) | Enhanced probability reasoning |

---

## Repository Structure

```
polymarket-mention-market-model/
├── app/                          # Laravel application (PHP)
│   ├── Concerns/                 # Validation rule traits
│   ├── Models/User.php           # Eloquent User model
│   └── Providers/                # Service providers (Fortify auth)
├── bootstrap/                    # Laravel bootstrap files
├── config/                       # Laravel configuration
├── database/
│   ├── factories/                # Eloquent model factories
│   ├── migrations/               # Database schema migrations
│   └── seeders/                  # Database seeders
├── python-api/                   # Python FastAPI service
│   ├── analysis/
│   │   └── word_frequency.py     # Word frequency & co-occurrence
│   ├── api/
│   │   └── routes/
│   │       ├── corpus.py         # /speeches and /frequencies endpoints
│   │       └── probability.py    # /probability endpoints
│   ├── corpus/
│   │   ├── models.py             # SQLAlchemy ORM models + DB setup
│   │   └── storage.py            # CRUD helpers for the corpus
│   ├── ingestion/
│   │   ├── channel_lister.py     # List videos from a YouTube channel
│   │   ├── transcript_fetcher.py # Download transcripts via YouTube API
│   │   ├── transcript_parser.py  # Clean and normalise raw segments
│   │   └── ingest.py             # CLI ingest script
│   ├── probability/
│   │   ├── aggregator.py         # Weighted ensemble of signals
│   │   ├── base_rate.py          # Historical mention-rate calculator
│   │   ├── bayesian_updater.py   # Real-time Bayesian probability update
│   │   └── llm_engine.py         # Claude LLM probability estimate
│   ├── tests/                    # pytest test suite
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt          # Python dependencies
│   └── pytest.ini                # pytest configuration
├── public/                       # Laravel public web root
├── resources/
│   ├── css/app.css               # Tailwind CSS entry point
│   ├── js/                       # React + TypeScript frontend
│   └── views/app.blade.php       # Inertia.js root template
├── routes/
│   ├── web.php                   # Laravel web routes
│   └── settings.php              # Settings routes
├── tests/                        # Laravel/Pest PHP test suite
├── .env.example                  # Environment variable template
├── composer.json                 # PHP dependencies and scripts
├── package.json                  # Node.js dependencies and scripts
└── vite.config.ts                # Vite bundler configuration
```

---

## Requirements

### Python API
- Python 3.12+
- `yt-dlp` CLI tool (for ingestion): `pip install yt-dlp` or via your OS package manager
- All Python packages listed in `python-api/requirements.txt`

### Laravel Frontend
- PHP 8.3+
- Composer 2+
- Node.js 20+ and npm

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Johk3/polymarket-mention-market-model.git
cd polymarket-mention-market-model
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values (see [Configuration](#configuration)).

### 3. Install Laravel dependencies and initialise the database

```bash
composer setup
# This runs: composer install, key:generate, migrate, npm install, npm run build
```

### 4. Install Python dependencies

```bash
cd python-api
pip install -r requirements.txt
```

---

## Configuration

All environment variables are defined in `.env` (copied from `.env.example`).

### Required

| Variable | Description |
|---|---|
| `APP_KEY` | Laravel application encryption key (generated by `php artisan key:generate`) |

### Optional but recommended

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | _(empty)_ | Anthropic API key for Claude LLM integration. When absent, only the statistical model is used. |
| `APP_URL` | `http://localhost` | Public URL of the Laravel application |
| `APP_ENV` | `local` | Environment (`local`, `production`) |
| `APP_DEBUG` | `true` | Enable detailed error pages |

### Database

By default both the Laravel app and the Python corpus use **SQLite**, which requires no additional setup.

| Variable | Default | Description |
|---|---|---|
| `DB_CONNECTION` | `sqlite` | Laravel database driver |
| `DB_DATABASE` | _(auto)_ | Path to the SQLite file |

> The Python corpus database is always stored at `python-api/corpus.db` (configured in `python-api/corpus/models.py`).

### Email (optional)

| Variable | Default | Description |
|---|---|---|
| `MAIL_MAILER` | `log` | Mail driver (`log` writes to storage/logs) |
| `MAIL_FROM_ADDRESS` | `hello@example.com` | Sender address |

---

## Running the Application

### Python FastAPI service

```bash
cd python-api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Laravel + Vite (development)

```bash
composer dev
# Starts: PHP dev server, queue worker, and Vite HMR simultaneously
```

The Laravel application will be available at `http://localhost:8000` by default. Change the port with `APP_PORT` or by passing `--port` to `php artisan serve`.

### Ingesting transcripts (one-off CLI)

Before using the probability endpoints you need to populate the corpus:

```bash
cd python-api
python -m ingestion.ingest --limit 50
# Fetches the 50 most recent @whitehouse YouTube videos and stores their transcripts
```

Options:

| Flag | Default | Description |
|---|---|---|
| `--limit N` | `50` | Maximum number of videos to ingest per run |

Re-running the command is safe: already-ingested videos are skipped automatically.

---

## Python API Reference

Base URL: `http://localhost:8000`

### Meta

#### `GET /health`

Returns the service health status.

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### Model (logistic prediction)

#### `POST /predict`

Estimate a binary market probability from a normalised mention score using the core logistic model.

**Request body**
```json
{
  "mention_score": 0.65,
  "baseline": 0.5,
  "steepness": 10.0
}
```

| Field | Type | Range | Default | Description |
|---|---|---|---|---|
| `mention_score` | float | [0, 1] | required | Normalised mention frequency |
| `baseline` | float | [0, 1] | `0.5` | Prior probability (shifts the curve) |
| `steepness` | float | > 0 | `10.0` | Logistic curve steepness parameter *k* |

**Response 200**
```json
{
  "mention_score": 0.65,
  "baseline": 0.5,
  "steepness": 10.0,
  "probability": 0.818595
}
```

---

### Corpus

#### `GET /speeches`

List all ingested speeches.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | int | `100` | Maximum number of results (1–1000) |

**Response 200**
```json
[
  {
    "video_id": "dQw4w9WgXcQ",
    "title": "Press Briefing",
    "upload_date": "20240315",
    "utterance_count": 842
  }
]
```

---

#### `GET /speeches/{video_id}`

Get the full transcript for a specific speech.

**Response 200**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Press Briefing",
  "upload_date": "20240315",
  "utterances": [
    {
      "text": "Good afternoon everyone.",
      "start_seconds": 0.0,
      "duration": 2.3
    }
  ]
}
```

**Response 404** – Speech not found.

---

#### `GET /frequencies`

Get word frequencies across the corpus.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `phrase` | string | `""` | If set, only count words from speeches that mention this phrase |
| `top` | int | `20` | Number of top words to return (1–200) |

**Response 200**
```json
[
  {"word": "president", "count": 1234},
  {"word": "executive", "count": 567}
]
```

---

### Probability

#### `GET /probability/base-rate/{phrase}`

Calculate the historical mention rate for a phrase across the entire corpus.

**Response 200**
```json
{
  "phrase": "executive order",
  "mention_rate": 0.42,
  "total_speeches": 50,
  "speeches_with_mention": 21,
  "avg_mentions_per_speech": 1.8
}
```

---

#### `POST /probability/estimate`

Produce a full probability estimate combining the Bayesian statistical model and (optionally) the Claude LLM.

**Request body**
```json
{
  "market_question": "Will the president mention executive orders today?",
  "target_phrase": "executive order",
  "current_transcript": "Good afternoon. Today we will discuss...",
  "elapsed_seconds": 120.0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `market_question` | string | yes | Natural-language market question (used as LLM context) |
| `target_phrase` | string | yes | Phrase whose mention probability is being estimated |
| `current_transcript` | string | no | Transcript text accumulated so far |
| `elapsed_seconds` | float | no | Seconds elapsed since the speech began |

**Response 200**
```json
{
  "probability": 0.4732,
  "lower_bound": 0.3950,
  "upper_bound": 0.5514,
  "base_rate": 0.42,
  "statistical_probability": 0.3810,
  "llm_probability": 0.52,
  "llm_available": true,
  "reasoning": "The speech has not yet referenced domestic policy..."
}
```

| Field | Description |
|---|---|
| `probability` | Final aggregated probability |
| `lower_bound` | Lower confidence bound |
| `upper_bound` | Upper confidence bound |
| `base_rate` | Historical mention rate from corpus |
| `statistical_probability` | Bayesian-updated statistical estimate |
| `llm_probability` | Claude LLM estimate (`null` if unavailable) |
| `llm_available` | Whether the LLM was used |
| `reasoning` | LLM-generated reasoning (`""` if LLM unavailable) |

---

## The Probability Model

### Core logistic model (`POST /predict`)

The `/predict` endpoint uses a **logistic (sigmoid) function** to map a normalised mention score to a probability:

```
probability = 1 / (1 + exp(-k * (x - 0.5)))
```

where:
- `x` = blended score: `(mention_score + baseline) / 2`
- `k` = steepness parameter (default 10)
- At `x = 0` → probability ≈ 0.007
- At `x = 0.5` → probability = 0.5
- At `x = 1` → probability ≈ 0.993

### Full estimation pipeline (`POST /probability/estimate`)

```
Historical corpus
      │
      ▼
┌─────────────────────────────────┐
│  1. Base Rate                   │
│  mention_rate = speeches_with / │
│                total_speeches   │
└──────────────┬──────────────────┘
               │ prior
               ▼
┌─────────────────────────────────┐
│  2. Bayesian Update             │
│  Adjusts prior using:           │
│  • collocate co-occurrence      │
│  • elapsed-time decay           │
│  → statistical_probability      │
└──────────────┬──────────────────┘
               │
               │         ┌──────────────────────────┐
               │         │  3. LLM Estimate          │
               │         │  Claude reads transcript  │
               │         │  → llm_probability        │
               │         └────────────┬─────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────┐
│  4. Aggregation                                      │
│  probability = 0.35 * statistical + 0.65 * llm      │
│  (falls back to statistical-only if LLM absent)     │
│                                                     │
│  Confidence band = f(disagreement between signals)  │
└─────────────────────────────────────────────────────┘
```

### Bayesian updater details

The updater takes a `prior` (base rate), a list of `collocates` (contextually related words), and an `avg_mention_time_seconds`:

```
collocate_score = (collocates present in transcript) / (total collocates)
time_decay      = max(0, 1 - elapsed / (3 × avg_mention_time))
probability     = prior × (1 + collocate_score) × time_decay
probability     = prior + (probability − prior) × 0.5   # dampen extremes
```

Final value is clamped to `[0.01, 0.99]`.

---

## Data Pipeline

```
YouTube (@whitehouse channel)
          │
          │  yt-dlp (list videos)
          ▼
┌─────────────────────┐
│  channel_lister.py  │  → [{video_id, title, upload_date, duration}]
└──────────┬──────────┘
           │
           │  youtube-transcript-api
           ▼
┌──────────────────────────┐
│  transcript_fetcher.py   │  → raw segments [{text, start, duration}]
└──────────┬───────────────┘
           │
           │  parse + clean
           ▼
┌──────────────────────────┐
│  transcript_parser.py    │  Removes [Music]/[Applause] noise tokens,
│                          │  decodes HTML entities, strips whitespace
└──────────┬───────────────┘
           │
           │  SQLAlchemy
           ▼
┌──────────────────────────┐
│  corpus/storage.py       │  Idempotent upsert into:
│  corpus.db (SQLite)      │  • speeches table
│                          │  • utterances table
└──────────────────────────┘
```

---

## Development

### Code style

| Tool | Scope | Command |
|---|---|---|
| Laravel Pint | PHP | `composer lint` |
| ESLint | TypeScript/React | `npm run lint` |
| Prettier | TypeScript/React | `npm run format` |

### Pre-commit hooks

The project uses **Lefthook** to run linters automatically on commit:

```bash
npx lefthook install
```

### Adding a new API route (Python)

1. Create a new file in `python-api/api/routes/`.
2. Define an `APIRouter` and add your endpoints.
3. Import and register the router in `python-api/main.py`:
   ```python
   from api.routes.my_module import router as my_router
   app.include_router(my_router)
   ```

---

## Testing

### Python tests (pytest)

```bash
cd python-api
pytest
```

Run with coverage:

```bash
pytest --cov=. --cov-report=term-missing
```

### PHP tests (Pest)

```bash
php artisan test
# or
composer test
```

### CI

GitHub Actions workflows are defined in `.github/workflows/`:

| Workflow | Trigger | What it runs |
|---|---|---|
| `lint.yml` | Push / PR | PHP Pint, ESLint, Prettier, TypeScript checks |
| `tests.yml` | Push / PR | Pest PHP tests + pytest Python tests |

---

## License

This project is licensed under the **GNU General Public License v3.0 or later**. See [LICENSE](LICENSE) for the full text.
