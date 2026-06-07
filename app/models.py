"""Response models for the company registry API."""

from pydantic import BaseModel


class Company(BaseModel):
    company_name: str
    company_number: str
    company_identifier: str
    record_type: str
    record_status: str
    registration_date: str
    street_address: str
    state: str
    building: str
    town: str

    @classmethod
    def from_rgd(cls, fields: dict) -> "Company":
        return cls(
            company_name=fields.get("CompanyName", ""),
            company_number=fields.get("CompanyNumber", ""),
            company_identifier=fields.get("CompanyIdentifier", ""),
            record_type=fields.get("RecordType", ""),
            record_status=fields.get("RecordStatus", ""),
            registration_date=fields.get("RegistrationDate", ""),
            street_address=fields.get("CurrentStreetAddress", ""),
            state=fields.get("CurrentState", ""),
            building=fields.get("CurrentBuilding", ""),
            town=fields.get("CurrentTown", ""),
        )


class NameReservation(BaseModel):
    proposed_name: str
    reservation_status: str
    expiry_date: str

    @classmethod
    def from_rgd(cls, fields: dict) -> "NameReservation":
        return cls(
            proposed_name=fields.get("ProposedName", ""),
            reservation_status=fields.get("ReservationStatus", ""),
            expiry_date=fields.get("ExpiryDate", ""),
        )


class SearchResponse(BaseModel):
    query: str
    total_results: int
    companies: list[Company]


class NameReservationResponse(BaseModel):
    query: str
    total_results: int
    reservations: list[NameReservation]


class HealthResponse(BaseModel):
    status: str
    cache_size: int


class AvailabilityResponse(BaseModel):
    query: str
    is_registered: bool
    exact_matches: list[Company]
    similar_matches: list[Company]
    reserved_names: list[NameReservation]


class WebPresenceInfo(BaseModel):
    website_url: str | None = None
    website_live: bool = False
    website_ssl: bool = False
    social_media: dict[str, str] = {}
    has_maps_listing: bool = False
    maps_url: str | None = None
    search_results_count: int = 0
    news_mentions: int = 0
    review_snippets: list[dict] = []


class ScoreBreakdownInfo(BaseModel):
    registry_score: int
    registry_max: int
    registry_details: dict

    web_presence_score: int
    web_presence_max: int
    web_presence_details: dict

    social_media_score: int
    social_media_max: int
    social_media_details: dict

    reviews_score: int
    reviews_max: int
    reviews_details: dict


class CredibilityResponse(BaseModel):
    query: str
    credibility_score: int
    credibility_label: str
    is_registered: bool
    registry_match: Company | None = None
    web_presence: WebPresenceInfo
    score_breakdown: ScoreBreakdownInfo
    show_claim_prompt: bool = False
    improvement_tips: list[str] = []
