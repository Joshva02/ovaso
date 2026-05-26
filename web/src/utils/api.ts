const API_BASE = import.meta.env.VITE_API_URL ?? "";

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
