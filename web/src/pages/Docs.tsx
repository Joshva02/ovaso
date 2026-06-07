import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CodeBlock } from "@/components/ui/code-block";
import { API_BASE } from "@/utils/config";

const COMPANY_FIELDS = [
  { field: "company_name", type: "string", desc: "Registered name" },
  { field: "company_number", type: "string", desc: "Official registration number" },
  { field: "company_identifier", type: "string", desc: "Unique ID in the registry" },
  { field: "record_type", type: "string", desc: "e.g. PROFIT COMPANY, PARTNERSHIP/FIRM BUSINESS, NON-PROFIT ORGANISATION" },
  { field: "record_status", type: "string", desc: "e.g. ACTIVE, STRUCK OFF, DISSOLVED, CONTINUED" },
  { field: "registration_date", type: "string", desc: "Date of registration (DD/MM/YYYY)" },
  { field: "street_address", type: "string | null", desc: "Registered street address" },
  { field: "state", type: "string | null", desc: "State/region" },
];

const RESERVATION_FIELDS = [
  { field: "proposed_name", type: "string", desc: "The reserved business name" },
  { field: "reservation_status", type: "string", desc: "e.g. APPROVED, PENDING" },
  { field: "expiry_date", type: "string | null", desc: "Reservation expiry (DD/MM/YYYY)" },
];

const ENDPOINTS = [
  {
    id: "credibility",
    method: "GET",
    path: "/credibility",
    title: "Business credibility score",
    desc: "The flagship endpoint. Checks the RGD registry and scrapes the web to build a credibility score out of 100. Returns the score breakdown, discovered web presence, and improvement tips for low-scoring businesses. Rate limited to 15 req/min.",
    params: [
      { name: "name", type: "string", required: true, desc: "Business name to check credibility for (min 2 chars)" },
    ],
    request: `curl "${API_BASE}/credibility?name=massy+holdings"`,
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
    responseFields: [
      { field: "credibility_score", type: "number", desc: "Overall credibility score (0-100)" },
      { field: "credibility_label", type: "string", desc: "Human-readable label (e.g. High Credibility)" },
      { field: "is_registered", type: "boolean", desc: "Whether the business is in the RGD registry" },
      { field: "registry_match", type: "Company | null", desc: "Best matching company record" },
      { field: "web_presence", type: "WebPresence", desc: "Discovered website, social media, maps, reviews" },
      { field: "score_breakdown", type: "ScoreBreakdown", desc: "Points breakdown by category" },
      { field: "show_claim_prompt", type: "boolean", desc: "True when score < 60 (show 'Do you own this business?')" },
      { field: "improvement_tips", type: "string[]", desc: "Actionable tips to improve the score" },
    ],
  },
  {
    id: "check",
    method: "GET",
    path: "/check",
    title: "Check business registration",
    desc: "Returns whether a name is registered, exact matches, similar companies, and name reservations — all in one call.",
    params: [
      { name: "name", type: "string", required: true, desc: "Business name to check (min 2 chars)" },
    ],
    request: `curl "${API_BASE}/check?name=guardian+holdings+limited"`,
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
  "similar_matches": [],
  "reserved_names": []
}`,
    responseFields: [
      { field: "query", type: "string", desc: "The name you searched for" },
      { field: "is_registered", type: "boolean", desc: "Whether an exact match exists" },
      { field: "exact_matches", type: "Company[]", desc: "Companies with an exact name match" },
      { field: "similar_matches", type: "Company[]", desc: "Companies with names containing the query" },
      { field: "reserved_names", type: "Reservation[]", desc: "Name reservations matching the query" },
    ],
  },
  {
    id: "search",
    method: "GET",
    path: "/search",
    title: "Search companies",
    desc: "Search registered companies and businesses by name. Returns all matching records from the RGD registry.",
    params: [
      { name: "name", type: "string", required: true, desc: "Company or business name (min 2 chars)" },
    ],
    request: `curl "${API_BASE}/search?name=massy"`,
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
    responseFields: [
      { field: "query", type: "string", desc: "The name you searched for" },
      { field: "total_results", type: "number", desc: "Number of matching companies" },
      { field: "companies", type: "Company[]", desc: "Array of matching company records" },
    ],
  },
  {
    id: "reservations",
    method: "GET",
    path: "/reservations",
    title: "Search name reservations",
    desc: "Search name reservations filed with the RGD. Check if someone already reserved a proposed business name.",
    params: [
      { name: "name", type: "string", required: true, desc: "Proposed name to search (min 2 chars)" },
    ],
    request: `curl "${API_BASE}/reservations?name=island"`,
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
    responseFields: [
      { field: "query", type: "string", desc: "The name you searched for" },
      { field: "total_results", type: "number", desc: "Number of matching reservations" },
      { field: "reservations", type: "Reservation[]", desc: "Array of matching name reservations" },
    ],
  },
  {
    id: "health",
    method: "GET",
    path: "/health",
    title: "Health check",
    desc: "Returns the API status. Use this to verify the service is running.",
    params: [],
    request: `curl "${API_BASE}/health"`,
    response: `{
  "status": "healthy"
}`,
    responseFields: [
      { field: "status", type: "string", desc: "Always \"healthy\" when the API is up" },
    ],
  },
];

const ERROR_EXAMPLE = `{
  "detail": "Name query must be at least 2 characters"
}`;

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold tracking-tight mt-16 mb-4 pt-4 border-t border-warm-gray scroll-mt-20"
    >
      {children}
    </h2>
  );
}

function FieldTable({
  fields,
}: {
  fields: { field: string; type: string; desc: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="border-b-2 border-warm-gray">
            <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
              Field
            </th>
            <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
              Type
            </th>
            <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.field} className="border-b border-warm-gray">
              <td className="py-2.5 px-3">
                <code className="font-mono font-medium text-black text-xs">
                  {f.field}
                </code>
              </td>
              <td className="py-2.5 px-3 font-mono text-dark-gray text-xs">
                {f.type}
              </td>
              <td className="py-2.5 px-3 text-charcoal text-[13px]">
                {f.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Docs() {
  return (
    <>
      <Navbar />
      <main className="max-w-[1120px] mx-auto px-6 pt-32 pb-16">
        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block">
          Documentation
        </span>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tighter leading-tight mb-3">
          API Reference
        </h1>
        <p className="text-dark-gray text-[15px] leading-relaxed max-w-[560px] mb-4">
          Ovaso is a free, public REST API for verifying businesses registered
          in Trinidad & Tobago and assessing their online credibility. No authentication required.
        </p>

        {/* Table of contents */}
        <nav className="mb-12 py-4 border-y border-warm-gray">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <li>
              <a href="#overview" className="text-dark-gray hover:text-black transition-colors no-underline">
                Overview
              </a>
            </li>
            {ENDPOINTS.map((ep) => (
              <li key={ep.id}>
                <a
                  href={`#${ep.id}`}
                  className="text-dark-gray hover:text-black transition-colors no-underline font-mono"
                >
                  {ep.path}
                </a>
              </li>
            ))}
            <li>
              <a href="#credibility-methodology" className="text-dark-gray hover:text-black transition-colors no-underline">
                Credibility methodology
              </a>
            </li>
            <li>
              <a href="#schemas" className="text-dark-gray hover:text-black transition-colors no-underline">
                Schemas
              </a>
            </li>
            <li>
              <a href="#errors" className="text-dark-gray hover:text-black transition-colors no-underline">
                Errors
              </a>
            </li>
            <li>
              <a href="#rate-limiting" className="text-dark-gray hover:text-black transition-colors no-underline">
                Rate limiting
              </a>
            </li>
            <li>
              <a href="#terms" className="text-dark-gray hover:text-black transition-colors no-underline">
                Terms of use
              </a>
            </li>
          </ul>
        </nav>

        {/* Overview */}
        <section>
          <h2
            id="overview"
            className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold tracking-tight mb-4 scroll-mt-20"
          >
            Overview
          </h2>
          <div className="space-y-3 text-[15px] text-charcoal leading-relaxed max-w-[640px]">
            <p>
              Base URL:{" "}
              <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">
                {API_BASE}
              </code>
            </p>
            <p>
              All endpoints accept <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">GET</code> requests
              and return JSON. No API key or authentication is required.
            </p>
            <p>
              Data is sourced from the{" "}
              <a
                href="https://rgd.legalaffairs.gov.tt/ttNameSearch/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tt-red hover:underline no-underline"
              >
                Registrar General's Department
              </a>{" "}
              of Trinidad & Tobago. Responses are cached for 5 minutes
              to reduce load on the upstream registry.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        {ENDPOINTS.map((ep) => (
          <section key={ep.id}>
            <SectionHeading id={ep.id}>{ep.title}</SectionHeading>

            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-black text-white tracking-wide">
                {ep.method}
              </span>
              <code className="font-mono text-[15px] font-medium text-black">
                {ep.path}
              </code>
            </div>

            <p className="text-[15px] text-charcoal leading-relaxed max-w-[640px] mb-6">
              {ep.desc}
            </p>

            {ep.params.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-3">
                  Parameters
                </h4>
                <FieldTable
                  fields={ep.params.map((p) => ({
                    field: p.name + (p.required ? " *" : ""),
                    type: p.type,
                    desc: p.desc,
                  }))}
                />
              </div>
            )}

            <div className="space-y-4 mb-6">
              <CodeBlock code={ep.request} language="bash" filename="Request" />
              <CodeBlock code={ep.response} language="json" filename="Response" />
            </div>

            <div className="mb-2">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-3">
                Response fields
              </h4>
              <FieldTable fields={ep.responseFields} />
            </div>
          </section>
        ))}

        {/* Credibility Methodology */}
        <SectionHeading id="credibility-methodology">Credibility score methodology</SectionHeading>
        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3 mb-8">
          <p>
            The <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">/credibility</code> endpoint
            calculates a score from 0-100 by evaluating four categories of publicly available signals.
          </p>
        </div>

        <div className="space-y-8 mb-8">
          <div>
            <h3 className="font-semibold text-[15px] mb-3">Registry (max 30 points)</h3>
            <p className="text-[14px] text-dark-gray mb-3">Checks formal registration with the Trinidad & Tobago RGD.</p>
            <FieldTable fields={[
              { field: "Registered with RGD", type: "15 pts", desc: "Name search returns a matching record" },
              { field: "Active status", type: "10 pts", desc: "Status contains ACTIVE, CONTINUED, REGISTERED, or GOOD STANDING" },
              { field: "Registered 5+ years", type: "5 pts", desc: "Calculated from registration date" },
              { field: "Registered 2-5 years", type: "3 pts", desc: "Calculated from registration date" },
              { field: "Registered < 2 years", type: "1 pt", desc: "Calculated from registration date" },
            ]} />
          </div>

          <div>
            <h3 className="font-semibold text-[15px] mb-3">Web Presence (max 25 points)</h3>
            <p className="text-[14px] text-dark-gray mb-3">Evaluates the business's website and search visibility.</p>
            <FieldTable fields={[
              { field: "Has a website", type: "8 pts", desc: "A URL matching the business name found in search results" },
              { field: "Website is live", type: "5 pts", desc: "HTTP request returns status below 500" },
              { field: "Website has SSL", type: "4 pts", desc: "Final URL uses HTTPS" },
              { field: "10+ search results", type: "4 pts", desc: "DuckDuckGo returns 10+ results" },
              { field: "5-9 search results", type: "2 pts", desc: "DuckDuckGo returns 5-9 results" },
              { field: "News mentions", type: "4 pts", desc: "Results include recognized news domains" },
            ]} />
          </div>

          <div>
            <h3 className="font-semibold text-[15px] mb-3">Social Media (max 25 points)</h3>
            <p className="text-[14px] text-dark-gray mb-3">Checks for profiles on major platforms.</p>
            <FieldTable fields={[
              { field: "Facebook", type: "5 pts", desc: "facebook.com or fb.com URL found" },
              { field: "Instagram", type: "5 pts", desc: "instagram.com URL found" },
              { field: "LinkedIn", type: "5 pts", desc: "linkedin.com URL found" },
              { field: "Twitter/X", type: "5 pts", desc: "twitter.com or x.com URL found" },
              { field: "Google Maps", type: "5 pts", desc: "Google Maps listing URL found" },
            ]} />
          </div>

          <div>
            <h3 className="font-semibold text-[15px] mb-3">Reviews & Reputation (max 20 points)</h3>
            <p className="text-[14px] text-dark-gray mb-3">Looks for review mentions across the web.</p>
            <FieldTable fields={[
              { field: "Has review mentions", type: "10 pts", desc: "Snippets contain review/rating keywords" },
              { field: "Reviews on 2+ sources", type: "5 pts", desc: "Review mentions from 2+ search results" },
              { field: "Reviews on 4+ sources", type: "5 pts", desc: "Review mentions from 4+ search results" },
            ]} />
          </div>
        </div>

        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3 mb-4">
          <h3 className="font-semibold text-[15px] mb-3">Score labels</h3>
          <FieldTable fields={[
            { field: "80-100", type: "High Credibility", desc: "Strong registration, active web presence, multiple social profiles" },
            { field: "60-79", type: "Moderate Credibility", desc: "Registered and active, with some online presence" },
            { field: "40-59", type: "Low Credibility", desc: "May be registered but limited online footprint" },
            { field: "20-39", type: "Very Low Credibility", desc: "Minimal verifiable information found" },
            { field: "0-19", type: "Insufficient Data", desc: "Almost no verifiable signals found" },
          ]} />
        </div>

        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3 mb-4">
          <h3 className="font-semibold text-[15px] mb-3">Improvement tips & claim prompt</h3>
          <p>
            When a business scores below 60, the response includes{" "}
            <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">show_claim_prompt: true</code>{" "}
            and an <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">improvement_tips</code>{" "}
            array with specific, actionable suggestions to improve the score, such as:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[14px]">
            <li>Register with the RGD if not yet registered</li>
            <li>Create a professional website with SSL (HTTPS)</li>
            <li>Set up profiles on Facebook, Instagram, LinkedIn, and Twitter</li>
            <li>Claim your Google Business Profile for Maps visibility</li>
            <li>Encourage customers to leave reviews on multiple platforms</li>
          </ul>
        </div>

        {/* Schemas */}
        <SectionHeading id="schemas">Schemas</SectionHeading>
        <div className="space-y-8">
          <div>
            <h3 className="font-mono font-semibold text-[15px] mb-3">Company</h3>
            <FieldTable fields={COMPANY_FIELDS} />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-[15px] mb-3">Reservation</h3>
            <FieldTable fields={RESERVATION_FIELDS} />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-[15px] mb-3">WebPresence</h3>
            <FieldTable fields={[
              { field: "website_url", type: "string | null", desc: "Discovered website URL" },
              { field: "website_live", type: "boolean", desc: "Whether the website responds successfully" },
              { field: "website_ssl", type: "boolean", desc: "Whether the website uses HTTPS" },
              { field: "social_media", type: "object", desc: "Map of platform name to profile URL" },
              { field: "has_maps_listing", type: "boolean", desc: "Whether a Google Maps listing was found" },
              { field: "maps_url", type: "string | null", desc: "Google Maps listing URL" },
              { field: "search_results_count", type: "number", desc: "Number of search results found" },
              { field: "news_mentions", type: "number", desc: "Number of news article results" },
              { field: "review_snippets", type: "object[]", desc: "Review-related search result snippets" },
            ]} />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-[15px] mb-3">ScoreBreakdown</h3>
            <FieldTable fields={[
              { field: "registry_score", type: "number", desc: "Points earned for registry signals" },
              { field: "registry_max", type: "number", desc: "Maximum possible registry points (30)" },
              { field: "registry_details", type: "object", desc: "Detailed registry signal results" },
              { field: "web_presence_score", type: "number", desc: "Points earned for web presence signals" },
              { field: "web_presence_max", type: "number", desc: "Maximum possible web presence points (25)" },
              { field: "web_presence_details", type: "object", desc: "Detailed web presence signal results" },
              { field: "social_media_score", type: "number", desc: "Points earned for social media signals" },
              { field: "social_media_max", type: "number", desc: "Maximum possible social media points (25)" },
              { field: "social_media_details", type: "object", desc: "Detailed social media signal results" },
              { field: "reviews_score", type: "number", desc: "Points earned for review signals" },
              { field: "reviews_max", type: "number", desc: "Maximum possible review points (20)" },
              { field: "reviews_details", type: "object", desc: "Detailed review signal results" },
            ]} />
          </div>
        </div>

        {/* Errors */}
        <SectionHeading id="errors">Errors</SectionHeading>
        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3 mb-6">
          <p>
            Errors return a JSON object with a <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">detail</code> field
            describing what went wrong.
          </p>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-warm-gray">
                <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
                  Status
                </th>
                <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-warm-gray">
                <td className="py-2.5 px-3 font-mono font-medium text-black text-xs">422</td>
                <td className="py-2.5 px-3 text-charcoal">Validation error — name is missing or too short (&lt; 2 chars)</td>
              </tr>
              <tr className="border-b border-warm-gray">
                <td className="py-2.5 px-3 font-mono font-medium text-black text-xs">429</td>
                <td className="py-2.5 px-3 text-charcoal">Rate limit exceeded — wait before retrying</td>
              </tr>
              <tr className="border-b border-warm-gray">
                <td className="py-2.5 px-3 font-mono font-medium text-black text-xs">502</td>
                <td className="py-2.5 px-3 text-charcoal">Upstream RGD registry is unavailable</td>
              </tr>
            </tbody>
          </table>
        </div>
        <CodeBlock code={ERROR_EXAMPLE} language="json" filename="Error response" />

        {/* Rate limiting */}
        <SectionHeading id="rate-limiting">Rate limiting</SectionHeading>
        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3">
          <p>
            Standard endpoints are rate-limited to <strong>30 requests per minute</strong> per
            IP address. The <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">/credibility</code> endpoint
            is limited to <strong>15 requests per minute</strong> as it involves web scraping.
          </p>
          <p>
            If you exceed the limit, you'll receive a{" "}
            <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">429</code> response.
            Responses are cached server-side for 5 minutes. Repeated queries for
            the same name will be served from cache and won't count toward the
            rate limit.
          </p>
        </div>

        {/* Terms */}
        <SectionHeading id="terms">Terms of use</SectionHeading>
        <div className="text-[15px] text-charcoal leading-relaxed max-w-[640px] space-y-3">
          <p>
            This API is provided as-is for informational purposes. Credibility scores are{" "}
            <strong>algorithmic estimates</strong> based on publicly available data and should
            not be used as the sole basis for business decisions.
          </p>
          <p>
            A low score does not mean a business is fraudulent, and a high score does
            not guarantee trustworthiness. Scores should be used as one input among
            many when evaluating a business.
          </p>
          <p>
            <strong>Data sources:</strong> Registry data from the Trinidad & Tobago RGD public
            name search. Web data gathered from publicly accessible search results, websites,
            and social media profiles. No private or restricted databases are accessed.
          </p>
          <p>
            You may use this API for legitimate purposes including business verification,
            due diligence, research, and application integration. You may not use this API
            to harass, defame, or discriminate against any business or individual.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
