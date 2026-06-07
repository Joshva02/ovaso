<p align="center">
  <img src="web/public/logo.svg" height="80" alt="Ovaso" />
</p>

<h1 align="center">Ovaso</h1>

<p align="center">
  Free, open-source REST API to verify businesses registered in Trinidad & Tobago.
  <br />
  <a href="https://ovaso.vercel.app"><strong>Website</strong></a> · <a href="https://ovaso.vercel.app/docs"><strong>Docs</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/python-3.12-blue" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/framework-FastAPI-009688" alt="FastAPI" />
</p>

---

## What is this?

Trinidad & Tobago has no public API for its business registry. The only way to check if a company is registered is through the [RGD website](https://rgd.legalaffairs.gov.tt/ttNameSearch/), which is a clunky web app with no programmatic access.

**Ovaso wraps the RGD registry in a clean REST API** so developers, startups, and anyone in T&T can verify business registrations from their own apps — for free, with zero sign-up.

With the new **Credibility Score** feature, Ovaso goes beyond registry lookups — it scrapes the web to find a business's website, social media profiles, Google Maps listing, and review mentions, then calculates a credibility score out of 100.

## Quick start

No API key. No sign-up. Just fetch.

```bash
# Check if a business is registered
curl "https://ovaso.onrender.com/check?name=guardian+holdings+limited"

# Get a full credibility score
curl "https://ovaso.onrender.com/credibility?name=massy+holdings"

# Search companies by name
curl "https://ovaso.onrender.com/search?name=massy"

# Search name reservations
curl "https://ovaso.onrender.com/reservations?name=island"
```

### JavaScript

```js
const res = await fetch(
  "https://ovaso.onrender.com/check?name=guardian+holdings+limited"
);
const data = await res.json();

if (data.is_registered) {
  console.log("Registered:", data.exact_matches[0].company_name);
}
```

### Python

```python
import requests

res = requests.get(
    "https://ovaso.onrender.com/check",
    params={"name": "guardian holdings limited"}
)
data = res.json()

if data["is_registered"]:
    print("Registered:", data["exact_matches"][0]["company_name"])
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/check?name=` | Check if a business name is registered (recommended) |
| `GET` | `/credibility?name=` | Full credibility score with web presence analysis |
| `GET` | `/search?name=` | Search registered companies |
| `GET` | `/reservations?name=` | Search name reservations |
| `GET` | `/health` | API health check |

All endpoints return JSON. See the [full documentation](https://ovaso.onrender.com/docs) for response schemas and examples.

## Example response — `/check`

```json
{
  "query": "guardian holdings limited",
  "is_registered": true,
  "exact_matches": [
    {
      "company_name": "GUARDIAN HOLDINGS LIMITED",
      "company_number": "G967(C)",
      "record_type": "PROFIT COMPANY",
      "record_status": "ACTIVE (CONTINUED)",
      "registration_date": "14/04/1998",
      "street_address": "1 GUARDIAN DRIVE",
      "state": "WESTMOORINGS"
    }
  ],
  "similar_matches": [],
  "reserved_names": []
}
```

## Example response — `/credibility`

```json
{
  "query": "massy holdings",
  "credibility_score": 78,
  "credibility_label": "Moderate Credibility",
  "is_registered": true,
  "registry_match": {
    "company_name": "MASSY HOLDINGS LTD.",
    "record_status": "ACTIVE (CONTINUED)",
    "registration_date": "07/01/1983"
  },
  "web_presence": {
    "website_url": "https://massygroup.com",
    "website_live": true,
    "website_ssl": true,
    "social_media": {
      "facebook": "https://facebook.com/massygroup",
      "linkedin": "https://linkedin.com/company/massy-group"
    },
    "has_maps_listing": true,
    "search_results_count": 15,
    "news_mentions": 3
  },
  "score_breakdown": {
    "registry_score": 30,
    "registry_max": 30,
    "web_presence_score": 21,
    "web_presence_max": 25,
    "social_media_score": 15,
    "social_media_max": 25,
    "reviews_score": 10,
    "reviews_max": 20
  },
  "show_claim_prompt": false,
  "improvement_tips": []
}
```

## Credibility score methodology

The credibility score (0-100) evaluates four categories:

| Category | Max Points | What it checks |
|----------|-----------|----------------|
| **Registry** | 30 | RGD registration, active status, years registered |
| **Web Presence** | 25 | Has website, website is live, SSL, search visibility, news mentions |
| **Social Media** | 25 | Facebook, Instagram, LinkedIn, Twitter/X, Google Maps |
| **Reviews** | 20 | Review mentions found online, across multiple platforms |

For businesses scoring below 60, the API returns `show_claim_prompt: true` and an `improvement_tips` array with actionable suggestions to improve their score.

See [TERMS.md](TERMS.md) for the full methodology breakdown with point values for each signal.

## Rate limits

- **30 requests/minute** per IP (standard endpoints)
- **15 requests/minute** per IP (`/credibility` — involves web scraping)
- Responses cached for 5 minutes server-side
- Cached responses don't count toward the rate limit

> **Note:** The API runs on a free-tier server that sleeps after 15 minutes of inactivity. The first request after a cold start may take ~30 seconds. Subsequent requests are fast. If there's enough demand, I'll upgrade to an always-on instance.

## Self-hosting

If you want to run your own instance:

### Prerequisites

- Python 3.12+
- Node.js 20+ (for the frontend)

### Run locally

```bash
# Clone the repo
git clone https://github.com/Joshva02/ovaso.git
cd ovaso

# Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# Frontend (in a separate terminal)
cd web
npm install
npm run dev
```

### Docker

```bash
docker build -t ovaso .
docker run -p 8000:8000 ovaso
```

### Run tests

```bash
pytest tests/ -v
```

## Tech stack

| Layer | Tech |
|-------|------|
| API | Python, FastAPI, httpx, Pydantic |
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Caching | In-memory async TTL cache |
| Rate limiting | slowapi (30 req/min per IP) |
| Logging | structlog (JSON) |
| CI | GitHub Actions |
| Container | Docker (multi-stage build) |

## Project structure

```
ovaso/
├── app/
│   ├── main.py          # FastAPI app, endpoints, middleware
│   ├── client.py         # RGD registry client (httpx + JWT session)
│   ├── models.py         # Pydantic response models
│   ├── web_presence.py   # Web scraping, social media detection
│   ├── credibility.py    # Credibility score calculator + tips
│   ├── cache.py          # Async TTL cache
│   └── logging.py        # structlog config
├── web/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Home + Docs pages
│   │   ├── hooks/        # Theme, API playground hooks
│   │   └── utils/        # API client, constants, config
│   └── public/           # Static assets, logo
├── tests/                # pytest test suite
├── Dockerfile            # Multi-stage build
├── docker-compose.yml
└── .github/workflows/    # CI pipeline
```

## Contributing

Contributions welcome. Open an issue or submit a PR.

If you build something with Ovaso, tag [@Joshva02](https://github.com/Joshva02) — would love to see it.

## License

MIT

## Terms & methodology

See [TERMS.md](TERMS.md) for full terms of use and a detailed breakdown of how credibility scores are calculated, including point values for every signal.

## Disclaimer

Data is sourced from the [Registrar General's Department](https://rgd.legalaffairs.gov.tt/ttNameSearch/) and publicly available web data. Credibility scores are algorithmic estimates and should not be used as the sole basis for business decisions. This project is open source and has no affiliation with the Government of Trinidad & Tobago.
