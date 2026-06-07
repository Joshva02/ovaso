import { API_BASE } from "./config";

export interface Company {
  company_name: string;
  company_number: string;
  company_identifier: string;
  record_type: string;
  record_status: string;
  registration_date: string;
  street_address: string;
  state: string;
  building: string;
  town: string;
}

export interface NameReservation {
  proposed_name: string;
  reservation_status: string;
  expiry_date: string;
}

export interface CheckResponse {
  query: string;
  is_registered: boolean;
  exact_matches: Company[];
  similar_matches: Company[];
  reserved_names: NameReservation[];
}

export interface SearchResponse {
  query: string;
  total_results: number;
  companies: Company[];
}

export interface ReservationResponse {
  query: string;
  total_results: number;
  reservations: NameReservation[];
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function checkName(name: string) {
  return fetchJSON<CheckResponse>(`/check?name=${encodeURIComponent(name)}`);
}

export function searchCompanies(name: string) {
  return fetchJSON<SearchResponse>(`/search?name=${encodeURIComponent(name)}`);
}

export function searchReservations(name: string) {
  return fetchJSON<ReservationResponse>(
    `/reservations?name=${encodeURIComponent(name)}`
  );
}

export interface WebPresence {
  website_url: string | null;
  website_live: boolean;
  website_ssl: boolean;
  social_media: Record<string, string>;
  has_maps_listing: boolean;
  maps_url: string | null;
  search_results_count: number;
  news_mentions: number;
  review_snippets: Array<{ source: string; snippet: string; url: string }>;
}

export interface ScoreBreakdown {
  registry_score: number;
  registry_max: number;
  registry_details: Record<string, unknown>;
  web_presence_score: number;
  web_presence_max: number;
  web_presence_details: Record<string, unknown>;
  social_media_score: number;
  social_media_max: number;
  social_media_details: Record<string, unknown>;
  reviews_score: number;
  reviews_max: number;
  reviews_details: Record<string, unknown>;
}

export interface CredibilityResponse {
  query: string;
  credibility_score: number;
  credibility_label: string;
  is_registered: boolean;
  registry_match: Company | null;
  web_presence: WebPresence;
  score_breakdown: ScoreBreakdown;
  show_claim_prompt: boolean;
  improvement_tips: string[];
}

export function checkCredibility(name: string) {
  return fetchJSON<CredibilityResponse>(
    `/credibility?name=${encodeURIComponent(name)}`
  );
}
