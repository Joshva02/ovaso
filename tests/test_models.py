from app.models import Company, NameReservation


def test_company_from_rgd():
    fields = {
        "CompanyName": "TEST CO LTD",
        "CompanyNumber": "T123",
        "CompanyIdentifier": "999",
        "RecordType": "PROFIT COMPANY",
        "RecordStatus": "ACTIVE",
        "RegistrationDate": "01/01/2020",
        "CurrentStreetAddress": "1 Main St",
        "CurrentState": "Port of Spain",
        "CurrentBuilding": "",
        "CurrentTown": "",
    }
    company = Company.from_rgd(fields)
    assert company.company_name == "TEST CO LTD"
    assert company.company_number == "T123"
    assert company.record_type == "PROFIT COMPANY"
    assert company.record_status == "ACTIVE"
    assert company.street_address == "1 Main St"


def test_company_from_rgd_missing_fields():
    company = Company.from_rgd({})
    assert company.company_name == ""
    assert company.company_number == ""
    assert company.record_status == ""


def test_name_reservation_from_rgd():
    fields = {
        "ProposedName": "MY NEW BIZ LTD",
        "ReservationStatus": "APPROVED",
        "ExpiryDate": "15/12/2025",
    }
    reservation = NameReservation.from_rgd(fields)
    assert reservation.proposed_name == "MY NEW BIZ LTD"
    assert reservation.reservation_status == "APPROVED"
    assert reservation.expiry_date == "15/12/2025"


def test_name_reservation_from_rgd_missing_fields():
    reservation = NameReservation.from_rgd({})
    assert reservation.proposed_name == ""
    assert reservation.reservation_status == ""
