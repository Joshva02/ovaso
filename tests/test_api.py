"""Integration tests for API endpoints.

These tests mock the RGD upstream client so they run offline.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

MOCK_COMPANY = {
    "CompanyName": "TEST HOLDINGS LIMITED",
    "CompanyNumber": "T100",
    "CompanyIdentifier": "12345",
    "RecordType": "PROFIT COMPANY",
    "RecordStatus": "ACTIVE",
    "RegistrationDate": "01/06/2020",
    "CurrentStreetAddress": "1 Test Road",
    "CurrentState": "PORT-OF-SPAIN",
    "CurrentBuilding": "",
    "CurrentTown": "",
}

MOCK_RESERVATION = {
    "ProposedName": "TEST VENTURES LTD",
    "ReservationStatus": "APPROVED",
    "ExpiryDate": "01/12/2025",
}


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "cache_size" in data


class TestSearch:
    @patch("app.main.RGDClient.search_companies", new_callable=AsyncMock)
    def test_search_returns_companies(self, mock_search, client):
        mock_search.return_value = [MOCK_COMPANY]
        resp = client.get("/search?name=test")
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "test"
        assert data["total_results"] == 1
        assert data["companies"][0]["company_name"] == "TEST HOLDINGS LIMITED"

    def test_search_requires_name(self, client):
        resp = client.get("/search")
        assert resp.status_code == 422

    def test_search_min_length(self, client):
        resp = client.get("/search?name=a")
        assert resp.status_code == 422


class TestReservations:
    @patch(
        "app.main.RGDClient.search_name_reservations", new_callable=AsyncMock
    )
    def test_reservations_returns_results(self, mock_search, client):
        mock_search.return_value = [MOCK_RESERVATION]
        resp = client.get("/reservations?name=test")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_results"] == 1
        assert data["reservations"][0]["proposed_name"] == "TEST VENTURES LTD"


class TestCheck:
    @patch(
        "app.main.RGDClient.search_name_reservations", new_callable=AsyncMock
    )
    @patch("app.main.RGDClient.search_companies", new_callable=AsyncMock)
    def test_check_finds_exact_match(
        self, mock_companies, mock_reservations, client
    ):
        mock_companies.return_value = [MOCK_COMPANY]
        mock_reservations.return_value = []
        resp = client.get("/check?name=test+holdings+limited")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_registered"] is True
        assert len(data["exact_matches"]) == 1
        assert len(data["similar_matches"]) == 0

    @patch(
        "app.main.RGDClient.search_name_reservations", new_callable=AsyncMock
    )
    @patch("app.main.RGDClient.search_companies", new_callable=AsyncMock)
    def test_check_no_exact_match(
        self, mock_companies, mock_reservations, client
    ):
        mock_companies.return_value = [MOCK_COMPANY]
        mock_reservations.return_value = []
        resp = client.get("/check?name=something+else")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_registered"] is False
        assert len(data["exact_matches"]) == 0
        assert len(data["similar_matches"]) == 1

    @patch(
        "app.main.RGDClient.search_name_reservations", new_callable=AsyncMock
    )
    @patch("app.main.RGDClient.search_companies", new_callable=AsyncMock)
    def test_check_includes_reservations(
        self, mock_companies, mock_reservations, client
    ):
        mock_companies.return_value = []
        mock_reservations.return_value = [MOCK_RESERVATION]
        resp = client.get("/check?name=test")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["reserved_names"]) == 1


class TestCORS:
    def test_cors_headers_present(self, client):
        resp = client.options(
            "/health",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" in resp.headers
