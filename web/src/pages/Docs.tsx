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
    id: "check",
    method: "GET",
    path: "/check",
    title: "Check business registration",
    desc: "The recommended endpoint. Returns whether a name is registered, exact matches, similar companies, and name reservations — all in one call.",
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
      <main className="max-w-[1120px] mx-auto px-6 pt-24 pb-16">
        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block">
          Documentation
        </span>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tighter leading-tight mb-3">
          API Reference
        </h1>
        <p className="text-dark-gray text-[15px] leading-relaxed max-w-[560px] mb-4">
          Ovaso is a free, public REST API for verifying businesses registered
          in Trinidad & Tobago. No authentication required.
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
            The API is rate-limited to <strong>30 requests per minute</strong> per
            IP address. If you exceed this limit, you'll receive a{" "}
            <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">429</code> response.
          </p>
          <p>
            Responses are cached server-side for 5 minutes. Repeated queries for
            the same name will be served from cache and won't count toward the
            rate limit.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
