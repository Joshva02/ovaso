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
