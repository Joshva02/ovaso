export const ENDPOINTS = [
  {
    method: "GET" as const,
    path: "/credibility",
    description: "Business credibility score",
    tier: "pro" as const,
    detail:
      "Returns a credibility score out of 100 by checking the RGD registry and scraping the web for the business's website, social media profiles, Google Maps listing, and online reviews. Includes a full score breakdown and improvement tips for low-scoring businesses. Requires a Pro plan API key.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Business name to check credibility for (min 2 chars)",
      },
    ],
    request: `curl -H "X-API-Key: ovaso_xxxx_xxxx_xxxx_xxxx" \\
  "https://ovaso.onrender.com/credibility?name=massy+holdings"`,
    response: `{
  "query": "massy holdings",
  "credibility_score": 78,
  "credibility_label": "Moderate Credibility",
  "is_registered": true,
  "registry_match": {
    "company_name": "MASSY HOLDINGS LTD.",
    "company_number": "N233(C)",
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
}`,
    fields: [
      { key: "credibility_score", desc: "Overall credibility score (0-100)" },
      { key: "credibility_label", desc: "Human-readable label (e.g. High Credibility, Low Credibility)" },
      { key: "is_registered", desc: "Whether the business is found in the RGD registry" },
      { key: "registry_match", desc: "Best matching company record from the registry" },
      { key: "web_presence", desc: "Discovered website, social media, maps, and review data" },
      { key: "score_breakdown", desc: "Points breakdown across all four scoring categories" },
      { key: "show_claim_prompt", desc: "True when score < 60 — show 'Do you own this business?' prompt" },
      { key: "improvement_tips", desc: "Actionable tips to improve the credibility score" },
    ],
  },
  {
    method: "GET" as const,
    path: "/check",
    description: "Check if a business name is registered",
    tier: "free" as const,
    detail:
      "Returns whether the name is registered, exact matches, similar companies, and name reservations — all in one call.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Business name to check (min 2 chars)",
      },
    ],
    request: `curl "https://ovaso.onrender.com/check?name=guardian+holdings+limited"`,
    response: `{
  "query": "guardian holdings limited",
  "is_registered": true,
  "exact_matches": [
    {
      "company_name": "GUARDIAN HOLDINGS LIMITED",
      "company_number": "G967(C)",
      "company_identifier": "105614",
      "record_type": "PROFIT COMPANY",
      "record_status": "ACTIVE (CONTINUED)",
      "registration_date": "14/04/1998",
      "street_address": "1 GUARDIAN DRIVE",
      "state": "WESTMOORINGS"
    }
  ],
  "similar_matches": [...],
  "reserved_names": [...]
}`,
    fields: [
      { key: "is_registered", desc: "Whether an exact name match exists" },
      { key: "exact_matches", desc: "Companies with an exact name match" },
      {
        key: "similar_matches",
        desc: "Companies with names containing the query",
      },
      { key: "reserved_names", desc: "Name reservations matching the query" },
    ],
  },
  {
    method: "GET" as const,
    path: "/search",
    description: "Search registered companies",
    tier: "free" as const,
    detail:
      "Search registered companies and businesses by name. Returns all matching records from the RGD registry.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Company or business name (min 2 chars)",
      },
    ],
    request: `curl "https://ovaso.onrender.com/search?name=massy"`,
    response: `{
  "query": "massy",
  "total_results": 24,
  "companies": [
    {
      "company_name": "MASSY HOLDINGS LTD.",
      "company_number": "N233(C)",
      "record_type": "PROFIT COMPANY",
      "record_status": "ACTIVE (CONTINUED)",
      "registration_date": "07/01/1983"
    }
  ]
}`,
    fields: [
      { key: "company_name", desc: "Registered name of the company" },
      { key: "company_number", desc: "Official registration number" },
      { key: "company_identifier", desc: "Unique ID in the registry" },
      {
        key: "record_type",
        desc: "PROFIT COMPANY, PARTNERSHIP/FIRM BUSINESS, NON-PROFIT ORGANISATION, etc.",
      },
      {
        key: "record_status",
        desc: "ACTIVE, STRUCK OFF, DISSOLVED, CONTINUED, etc.",
      },
      { key: "registration_date", desc: "Date of registration (DD/MM/YYYY)" },
    ],
  },
  {
    method: "GET" as const,
    path: "/reservations",
    description: "Search name reservations",
    tier: "free" as const,
    detail:
      "Search name reservations filed with the RGD. Check if someone already reserved a proposed business name.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Proposed name to search (min 2 chars)",
      },
    ],
    request: `curl "https://ovaso.onrender.com/reservations?name=island"`,
    response: `{
  "query": "island",
  "total_results": 12,
  "reservations": [
    {
      "proposed_name": "ISLAND BREEZE VENTURES LTD",
      "reservation_status": "APPROVED",
      "expiry_date": "15/11/2025"
    }
  ]
}`,
    fields: [
      { key: "proposed_name", desc: "The reserved business name" },
      { key: "reservation_status", desc: "Status (e.g. APPROVED)" },
      {
        key: "expiry_date",
        desc: "When the reservation expires (DD/MM/YYYY)",
      },
    ],
  },
] as const;
