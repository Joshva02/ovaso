export const ENDPOINTS = [
  {
    method: "GET" as const,
    path: "/check",
    description: "Check if a business name is registered",
    detail:
      "The recommended endpoint. Returns whether the name is registered, exact matches, similar companies, and name reservations — all in one call.",
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
