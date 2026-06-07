# Ovaso API — Terms of Use & Methodology

Last updated: June 2026

## Terms of Use

### 1. Service Description

Ovaso is a free, open-source REST API that provides business registration verification and credibility scoring for businesses registered in Trinidad & Tobago. The API aggregates publicly available data from the Registrar General's Department (RGD) and the open web.

### 2. No Warranty

The API is provided "as-is" without warranty of any kind. Ovaso does not guarantee the accuracy, completeness, or timeliness of any data returned. Registry data is sourced from the RGD and may not reflect the most recent filings.

### 3. Credibility Score Disclaimer

Credibility scores are **algorithmic estimates** based on publicly available signals. They are not endorsements, credit ratings, or definitive assessments of a business's legitimacy. A low score does not mean a business is fraudulent, and a high score does not guarantee trustworthiness.

Scores should be used as one of many inputs when evaluating a business, not as the sole basis for any decision.

### 4. Data Sources

- **Registry data**: Sourced from the Trinidad & Tobago Registrar General's Department (RGD) public name search
- **Web data**: Gathered from publicly accessible search results, websites, and social media profiles
- **No private data**: Ovaso does not access any private, paid, or restricted databases

### 5. Rate Limits

- Standard endpoints: 30 requests per minute per IP
- Credibility endpoint: 15 requests per minute per IP
- Responses are cached for 5 minutes

### 6. Acceptable Use

You may use this API for legitimate purposes including business verification, due diligence, research, and application integration. You may not use this API to harass, defame, or discriminate against any business or individual.

---

## Credibility Score Methodology

### Overview

The credibility score ranges from 0 to 100 and measures a business's verifiable online footprint across four categories. Each category contributes a maximum number of points to the total score.

### Category 1: Registry (max 30 points)

Checks whether the business is formally registered with the Trinidad & Tobago Registrar General's Department.

| Signal | Points | How it's measured |
|--------|--------|-------------------|
| Registered with RGD | 15 | Name search returns a matching record |
| Active registration status | 10 | Record status contains ACTIVE, CONTINUED, REGISTERED, or GOOD STANDING |
| Registration age: 5+ years | 5 | Calculated from registration date |
| Registration age: 2-5 years | 3 | Calculated from registration date |
| Registration age: < 2 years | 1 | Calculated from registration date |

**Why this matters**: Formal registration is the most fundamental indicator of a legitimate business. Longer registration history suggests stability.

### Category 2: Web Presence (max 25 points)

Evaluates whether the business has a discoverable and functional website, and how visible it is in search results.

| Signal | Points | How it's measured |
|--------|--------|-------------------|
| Has a website | 8 | A URL matching the business name is found in search results (excluding social media, maps, and common platforms) |
| Website is live | 5 | HTTP request to the URL returns a status code below 500 |
| Website has SSL | 4 | Final URL after redirects uses HTTPS |
| 10+ search results | 4 | DuckDuckGo search returns 10 or more results |
| 5-9 search results | 2 | DuckDuckGo search returns 5-9 results |
| News mentions | 4 | Search results include URLs from recognized news domains |

**Why this matters**: A functional website with SSL demonstrates investment in the business's online presence. Search visibility indicates the business has an established digital footprint.

### Category 3: Social Media (max 25 points)

Checks for the existence of business profiles on major social platforms and Google Maps.

| Signal | Points | How it's measured |
|--------|--------|-------------------|
| Facebook | 5 | Search results contain a facebook.com or fb.com URL |
| Instagram | 5 | Search results contain an instagram.com URL |
| LinkedIn | 5 | Search results contain a linkedin.com URL |
| Twitter/X | 5 | Search results contain a twitter.com or x.com URL |
| Google Maps | 5 | Search results contain a Google Maps URL, or a targeted maps search finds one |

**Why this matters**: Legitimate businesses typically maintain profiles on at least some social platforms. A Google Maps listing indicates a physical or verified presence.

### Category 4: Reviews & Reputation (max 20 points)

Looks for review-related content across search results.

| Signal | Points | How it's measured |
|--------|--------|-------------------|
| Has review mentions | 10 | Search result snippets contain words like "review", "rating", "stars", "rated", or "customer" |
| Reviews on 2+ sources | 5 | Review mentions come from 2 or more distinct search results |
| Reviews on 4+ sources | 5 | Review mentions come from 4 or more distinct search results |

**Why this matters**: Customer reviews across multiple platforms indicate real customer interactions and accountability.

### Score Interpretation

| Range | Label | Meaning |
|-------|-------|---------|
| 80-100 | High Credibility | Strong registration, active web presence, multiple social profiles, review history |
| 60-79 | Moderate Credibility | Registered and active, with some online presence |
| 40-59 | Low Credibility | May be registered but limited online footprint |
| 20-39 | Very Low Credibility | Minimal verifiable information found |
| 0-19 | Insufficient Data | Almost no verifiable signals found |

### Improvement Tips

For businesses scoring below 60, the API returns a `show_claim_prompt` flag (for displaying a "Do you own this business?" prompt) and an `improvement_tips` array with specific, actionable suggestions. Tips are generated based on which scoring signals are missing, for example:

- Register with the RGD if not yet registered
- Create a professional website with SSL
- Set up profiles on Facebook, Instagram, LinkedIn, and Twitter
- Claim your Google Business Profile for Google Maps visibility
- Encourage customers to leave reviews on multiple platforms

### Limitations

- **Web search coverage**: Results depend on DuckDuckGo indexing. Newly created or low-traffic pages may not appear
- **Social media detection**: Only detects profiles that appear in search results; private or very new profiles may be missed
- **Review detection**: Based on keyword matching in search snippets, not direct API access to review platforms
- **Registry data**: Reflects the RGD's public database, which may lag behind recent filings
- **No human review**: Scores are fully automated with no manual verification

### Updates

The scoring methodology may be updated over time to improve accuracy. Changes will be reflected in this document and in the API version.
