"""Client for the Trinidad & Tobago Companies Registry (RGD) name search API."""

import asyncio
import re

import httpx

from app.logging import get_logger

BASE_URL = "https://rgd.legalaffairs.gov.tt/namesearch-server/webapi"
LANG = "en"
APP_ID = "ttNameSearch"

JWT_PATTERN = re.compile(r"jwt=([^;]+)")

logger = get_logger(__name__)


class RGDClient:
    """Handles session management and search requests to the RGD API.

    Uses an asyncio lock to prevent concurrent session refresh races.
    """

    def __init__(self) -> None:
        self._jwt: str | None = None
        self._session_lock = asyncio.Lock()
        self._http = httpx.AsyncClient(
            base_url=f"{BASE_URL}/{LANG}",
            verify=False,
            timeout=30.0,
        )

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._jwt:
            headers["Cookie"] = f"jwt={self._jwt}"
        return headers

    async def _ensure_session(self) -> None:
        """Acquire a JWT session cookie, guarded by a lock for concurrency safety."""
        async with self._session_lock:
            if self._jwt:
                return
            logger.info("rgd_session_acquiring")
            response = await self._http.get(f"/session/{APP_ID}")
            response.raise_for_status()
            set_cookie = response.headers.get("set-cookie", "")
            match = JWT_PATTERN.search(set_cookie)
            if match:
                self._jwt = match.group(1)
                logger.info("rgd_session_acquired")
            else:
                logger.error("rgd_session_no_jwt", set_cookie=set_cookie)

    async def _refresh_session(self) -> None:
        """Force a session refresh."""
        async with self._session_lock:
            self._jwt = None
        await self._ensure_session()

    async def _post_search(self, payload: dict) -> list[dict]:
        """Post a search request with automatic session retry on 401."""
        await self._ensure_session()

        response = await self._http.post(
            "/search", headers=self._headers(), json=payload
        )

        if response.status_code == 401:
            logger.warn("rgd_session_expired_retrying")
            await self._refresh_session()
            response = await self._http.post(
                "/search", headers=self._headers(), json=payload
            )

        response.raise_for_status()
        data = response.json()
        return [record["fields"] for record in data.get("resultset", [])]

    async def search_companies(self, name: str) -> list[dict]:
        """Search registered companies/businesses by name."""
        logger.info("rgd_search_companies", name=name)
        return await self._post_search(
            {
                "rvr-input-lang": LANG,
                "CompanyName": name,
                "searchName": "ns-public-search",
            }
        )

    async def search_name_reservations(self, name: str) -> list[dict]:
        """Search name reservations by proposed name."""
        logger.info("rgd_search_reservations", name=name)
        return await self._post_search(
            {
                "rvr-input-lang": LANG,
                "ProposedName": name,
                "searchName": "ns-name-reservation",
            }
        )

    async def close(self) -> None:
        await self._http.aclose()
