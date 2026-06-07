"""Trinidad & Tobago Company Registry API.

Open-source public REST API to search businesses registered with the RGD
(Registrar General's Department) at https://rgd.legalaffairs.gov.tt
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.cache import TTLCache
from app.client import RGDClient
from app.credibility import calculate_credibility, generate_improvement_tips, get_credibility_label
from app.logging import setup_logging, get_logger
from app.models import (
    AvailabilityResponse,
    Company,
    CredibilityResponse,
    HealthResponse,
    NameReservation,
    NameReservationResponse,
    ScoreBreakdownInfo,
    SearchResponse,
    WebPresenceInfo,
)
from app.web_presence import WebPresenceChecker

setup_logging()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.rgd = RGDClient()
    app.state.web_presence = WebPresenceChecker()
    app.state.cache = TTLCache(ttl=300, max_size=2000)
    logger.info("app_started")
    yield
    await app.state.rgd.close()
    await app.state.web_presence.close()
    logger.info("app_stopped")


app = FastAPI(
    title="Ovaso API",
    description=(
        "A free, public REST API to search the Trinidad & Tobago Companies "
        "Registry (RGD). Verify whether a business is registered, look up "
        "company details, and check name reservations.\n\n"
        "**No API key required.** Rate limited to 30 requests/minute per IP."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
    max_age=86400,
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return Response(
        content='{"detail":"Rate limit exceeded. Max 30 requests/minute."}',
        status_code=429,
        media_type="application/json",
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000, 1)
    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
        client=request.client.host if request.client else None,
    )
    return response


# --- Helpers ---


def _rgd(request: Request) -> RGDClient:
    return request.app.state.rgd


def _web_presence(request: Request) -> WebPresenceChecker:
    return request.app.state.web_presence


def _cache(request: Request) -> TTLCache:
    return request.app.state.cache


# --- Endpoints ---


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check",
)
async def health(request: Request):
    """Returns API health status and cache statistics."""
    return HealthResponse(
        status="healthy",
        cache_size=_cache(request).size,
    )


@app.get(
    "/search",
    response_model=SearchResponse,
    tags=["Search"],
    summary="Search registered companies",
    responses={
        200: {
            "description": "Matching companies found",
            "content": {
                "application/json": {
                    "example": {
                        "query": "massy",
                        "total_results": 24,
                        "companies": [
                            {
                                "company_name": "MASSY HOLDINGS LTD.",
                                "company_number": "N233(C)",
                                "company_identifier": "124290",
                                "record_type": "PROFIT COMPANY",
                                "record_status": "ACTIVE (CONTINUED)",
                                "registration_date": "07/01/1983",
                                "street_address": "63 PARK STREET",
                                "state": "PORT-OF-SPAIN",
                                "building": "",
                                "town": "",
                            }
                        ],
                    }
                }
            },
        },
        429: {"description": "Rate limit exceeded"},
        502: {"description": "RGD upstream error"},
    },
)
@limiter.limit("30/minute")
async def search_companies(
    request: Request,
    name: str = Query(
        ..., min_length=2, description="Company or business name to search for"
    ),
):
    """Search for registered companies and businesses by name."""
    cache = _cache(request)
    cache_key = f"search:{name.strip().lower()}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        results = await _rgd(request).search_companies(name)
    except Exception as e:
        logger.error("search_error", name=name, error=str(e))
        raise HTTPException(status_code=502, detail=f"RGD upstream error: {e}")

    companies = [Company.from_rgd(r) for r in results]
    response = SearchResponse(
        query=name, total_results=len(companies), companies=companies
    )

    await cache.set(cache_key, response)
    return response


@app.get(
    "/reservations",
    response_model=NameReservationResponse,
    tags=["Search"],
    summary="Search name reservations",
    responses={
        200: {
            "description": "Matching reservations found",
            "content": {
                "application/json": {
                    "example": {
                        "query": "island",
                        "total_results": 12,
                        "reservations": [
                            {
                                "proposed_name": "ISLAND BREEZE VENTURES LTD",
                                "reservation_status": "APPROVED",
                                "expiry_date": "15/11/2025",
                            }
                        ],
                    }
                }
            },
        },
        429: {"description": "Rate limit exceeded"},
        502: {"description": "RGD upstream error"},
    },
)
@limiter.limit("30/minute")
async def search_reservations(
    request: Request,
    name: str = Query(
        ..., min_length=2, description="Proposed name to search for"
    ),
):
    """Search for name reservations filed with the RGD."""
    cache = _cache(request)
    cache_key = f"reservations:{name.strip().lower()}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        results = await _rgd(request).search_name_reservations(name)
    except Exception as e:
        logger.error("reservations_error", name=name, error=str(e))
        raise HTTPException(status_code=502, detail=f"RGD upstream error: {e}")

    reservations = [NameReservation.from_rgd(r) for r in results]
    response = NameReservationResponse(
        query=name, total_results=len(reservations), reservations=reservations
    )

    await cache.set(cache_key, response)
    return response


@app.get(
    "/check",
    response_model=AvailabilityResponse,
    tags=["Search"],
    summary="Check business name availability",
    responses={
        200: {
            "description": "Availability check result",
            "content": {
                "application/json": {
                    "example": {
                        "query": "guardian holdings limited",
                        "is_registered": True,
                        "exact_matches": [
                            {
                                "company_name": "GUARDIAN HOLDINGS LIMITED",
                                "company_number": "G967(C)",
                                "company_identifier": "105614",
                                "record_type": "PROFIT COMPANY",
                                "record_status": "ACTIVE (CONTINUED)",
                                "registration_date": "14/04/1998",
                                "street_address": "1 GUARDIAN DRIVE",
                                "state": "WESTMOORINGS",
                                "building": "",
                                "town": "",
                            }
                        ],
                        "similar_matches": [],
                        "reserved_names": [],
                    }
                }
            },
        },
        429: {"description": "Rate limit exceeded"},
        502: {"description": "RGD upstream error"},
    },
)
@limiter.limit("30/minute")
async def check_availability(
    request: Request,
    name: str = Query(..., min_length=2, description="Business name to check"),
):
    """Check if a business name is registered or reserved.

    Returns exact and similar matches from both the company registry
    and name reservations, along with a boolean indicating whether
    an exact match was found.
    """
    cache = _cache(request)
    cache_key = f"check:{name.strip().lower()}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    client = _rgd(request)
    try:
        company_results = await client.search_companies(name)
        reservation_results = await client.search_name_reservations(name)
    except Exception as e:
        logger.error("check_error", name=name, error=str(e))
        raise HTTPException(status_code=502, detail=f"RGD upstream error: {e}")

    companies = [Company.from_rgd(r) for r in company_results]
    reservations = [NameReservation.from_rgd(r) for r in reservation_results]

    query_upper = name.strip().upper()
    exact_matches = [c for c in companies if c.company_name.upper() == query_upper]
    similar_matches = [
        c for c in companies if c.company_name.upper() != query_upper
    ]

    response = AvailabilityResponse(
        query=name,
        is_registered=len(exact_matches) > 0,
        exact_matches=exact_matches,
        similar_matches=similar_matches,
        reserved_names=reservations,
    )

    await cache.set(cache_key, response)
    return response


@app.get(
    "/credibility",
    response_model=CredibilityResponse,
    tags=["Credibility"],
    summary="Business credibility check",
    responses={
        200: {
            "description": "Credibility score and breakdown",
            "content": {
                "application/json": {
                    "example": {
                        "query": "massy holdings",
                        "credibility_score": 78,
                        "credibility_label": "Moderate Credibility",
                        "is_registered": True,
                        "registry_match": {
                            "company_name": "MASSY HOLDINGS LTD.",
                            "company_number": "N233(C)",
                            "company_identifier": "124290",
                            "record_type": "PROFIT COMPANY",
                            "record_status": "ACTIVE (CONTINUED)",
                            "registration_date": "07/01/1983",
                            "street_address": "63 PARK STREET",
                            "state": "PORT-OF-SPAIN",
                            "building": "",
                            "town": "",
                        },
                        "web_presence": {
                            "website_url": "https://massygroup.com",
                            "website_live": True,
                            "website_ssl": True,
                            "social_media": {
                                "facebook": "https://facebook.com/massygroup",
                                "linkedin": "https://linkedin.com/company/massy-group",
                            },
                            "has_maps_listing": True,
                            "maps_url": None,
                            "search_results_count": 15,
                            "news_mentions": 3,
                            "review_snippets": [],
                        },
                        "score_breakdown": {
                            "registry_score": 30,
                            "registry_max": 30,
                            "registry_details": {
                                "registered": True,
                                "active": True,
                                "years_registered": 42,
                            },
                            "web_presence_score": 21,
                            "web_presence_max": 25,
                            "web_presence_details": {},
                            "social_media_score": 15,
                            "social_media_max": 25,
                            "social_media_details": {},
                            "reviews_score": 10,
                            "reviews_max": 20,
                            "reviews_details": {},
                        },
                    }
                }
            },
        },
        429: {"description": "Rate limit exceeded"},
        502: {"description": "RGD upstream error"},
    },
)
@limiter.limit("15/minute")
async def credibility_check(
    request: Request,
    name: str = Query(
        ..., min_length=2, description="Business name to check credibility for"
    ),
):
    """Check business credibility by searching the registry and the web.

    Returns a credibility score out of 100 based on:
    - **Registry (30 pts)**: Whether the business is registered, active, and how long
    - **Web Presence (25 pts)**: Website existence, SSL, search visibility
    - **Social Media (25 pts)**: Facebook, Instagram, LinkedIn, Twitter, Google Maps
    - **Reviews (20 pts)**: Review mentions and sources found online
    """
    cache = _cache(request)
    cache_key = f"credibility:{name.strip().lower()}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    # Step 1: Check registry
    client = _rgd(request)
    try:
        company_results = await client.search_companies(name)
    except Exception as e:
        logger.error("credibility_registry_error", name=name, error=str(e))
        raise HTTPException(status_code=502, detail=f"RGD upstream error: {e}")

    companies = [Company.from_rgd(r) for r in company_results]
    query_upper = name.strip().upper()
    exact = [c for c in companies if c.company_name.upper() == query_upper]
    best_match = exact[0] if exact else (companies[0] if companies else None)

    is_registered = len(exact) > 0 or len(companies) > 0
    record_status = best_match.record_status if best_match else ""
    registration_date = best_match.registration_date if best_match else ""

    # Step 2: Check web presence
    checker = _web_presence(request)
    search_name = best_match.company_name if best_match else name
    web_result = await checker.check(search_name, original_query=name)

    # Step 3: Calculate credibility score
    breakdown = calculate_credibility(
        is_registered=is_registered,
        record_status=record_status,
        registration_date=registration_date,
        web_presence=web_result,
    )

    # Show claim prompt and tips for scores below 60
    show_claim = breakdown.total_score < 60
    tips = generate_improvement_tips(breakdown) if show_claim else []

    response = CredibilityResponse(
        query=name,
        credibility_score=breakdown.total_score,
        credibility_label=get_credibility_label(breakdown.total_score),
        is_registered=is_registered,
        registry_match=best_match,
        web_presence=WebPresenceInfo(
            website_url=web_result.website_url,
            website_live=web_result.website_live,
            website_ssl=web_result.website_ssl,
            social_media=web_result.social_media,
            has_maps_listing=web_result.has_maps_listing,
            maps_url=web_result.maps_url,
            search_results_count=web_result.search_results_count,
            news_mentions=web_result.news_mentions,
            review_snippets=web_result.review_snippets,
        ),
        score_breakdown=ScoreBreakdownInfo(
            registry_score=breakdown.registry_score,
            registry_max=breakdown.registry_max,
            registry_details=breakdown.registry_details,
            web_presence_score=breakdown.web_presence_score,
            web_presence_max=breakdown.web_presence_max,
            web_presence_details=breakdown.web_presence_details,
            social_media_score=breakdown.social_media_score,
            social_media_max=breakdown.social_media_max,
            social_media_details=breakdown.social_media_details,
            reviews_score=breakdown.reviews_score,
            reviews_max=breakdown.reviews_max,
            reviews_details=breakdown.reviews_details,
        ),
        show_claim_prompt=show_claim,
        improvement_tips=tips,
    )

    await cache.set(cache_key, response)
    return response
