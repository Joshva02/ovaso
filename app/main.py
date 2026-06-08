"""Trinidad & Tobago Company Registry API.

Open-source public REST API to search businesses registered with the RGD
(Registrar General's Department) at https://rgd.legalaffairs.gov.tt
"""

import asyncio
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
    ArticleInfo,
    AvailabilityResponse,
    Company,
    CredibilityResponse,
    HealthResponse,
    NameReservation,
    NameReservationResponse,
    ResearchReportInfo,
    ScoreBreakdownInfo,
    SearchResponse,
    WebPresenceInfo,
)
from app.research_agent import ResearchAgent
from app.web_presence import WebPresenceChecker

setup_logging()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.rgd = RGDClient()
    app.state.web_presence = WebPresenceChecker()
    app.state.research_agent = ResearchAgent()
    app.state.cache = TTLCache(ttl=300, max_size=2000)
    logger.info("app_started")
    yield
    await app.state.rgd.close()
    await app.state.web_presence.close()
    await app.state.research_agent.close()
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


def _research_agent(request: Request) -> ResearchAgent:
    return request.app.state.research_agent


def _cache(request: Request) -> TTLCache:
    return request.app.state.cache


async def _enrich_web_presence(
    web_result: "WebPresenceResult",
    research_report: "ResearchReport | None",
    checker: WebPresenceChecker,
) -> "WebPresenceResult":
    """Merge AI-discovered digital presence into the algorithmic web result.

    The research agent often finds websites and social accounts that
    pattern-based search misses (creative domains, alternate handles, etc.).
    Discoveries are verified (website liveness check) before merging.
    """
    from app.web_presence import WebPresenceResult
    from app.research_agent import ResearchReport

    if not research_report:
        return web_result

    # Start with existing values
    website_url = web_result.website_url
    website_live = web_result.website_live
    website_ssl = web_result.website_ssl
    social_media = dict(web_result.social_media)
    has_maps = web_result.has_maps_listing
    maps_url = web_result.maps_url
    review_snippets = list(web_result.review_snippets)

    # Merge discovered website if we don't already have one
    if not website_url and research_report.discovered_website:
        website_url = research_report.discovered_website
        # Verify the discovered website is actually live
        website_live, website_ssl = await checker._check_website(website_url)
        logger.info(
            "ai_discovered_website",
            url=website_url,
            live=website_live,
            ssl=website_ssl,
        )

    # Merge discovered social media — override if existing URL is a post/article
    from app.web_presence import _is_profile_url
    for platform, url in research_report.discovered_social_media.items():
        if not url:
            continue
        existing = social_media.get(platform)
        if not existing:
            # No existing entry — use AI discovery
            social_media[platform] = url
            logger.info("ai_discovered_social", platform=platform, url=url)
        elif not _is_profile_url(existing, platform):
            # Existing entry is a post/article — AI found the real profile
            logger.info(
                "ai_override_social",
                platform=platform,
                old_url=existing,
                new_url=url,
            )
            social_media[platform] = url

    # Merge discovered maps listing (reject generic country/region URLs)
    if not has_maps and research_report.discovered_maps_url:
        discovered_maps = research_report.discovered_maps_url.lower()
        is_generic = any(
            p in discovered_maps
            for p in ["/maps/search/trinidad", "/maps/search/tobago", "/maps/place/trinidad"]
        )
        if not is_generic:
            has_maps = True
            maps_url = research_report.discovered_maps_url
            logger.info("ai_discovered_maps", url=maps_url)

    # Merge discovered review snippets (deduplicate by URL)
    existing_urls = {r.get("url", "") for r in review_snippets}
    for review in research_report.discovered_review_snippets:
        if review.get("url") and review["url"] not in existing_urls:
            review_snippets.append(review)
            existing_urls.add(review["url"])

    return WebPresenceResult(
        website_url=website_url,
        website_live=website_live,
        website_ssl=website_ssl,
        social_media=social_media,
        has_maps_listing=has_maps,
        maps_url=maps_url,
        search_results_count=web_result.search_results_count,
        news_mentions=web_result.news_mentions,
        review_snippets=review_snippets,
        articles=web_result.articles,
    )


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
    company_name: str | None = Query(
        None,
        description=(
            "Exact company name from a prior /search or /check result. "
            "When provided, skips the registry search and treats this as a "
            "known registered business. Use this when the user selects a "
            "specific company from search results."
        ),
    ),
    company_number: str | None = Query(
        None, description="Company number from a prior search result (for cache keying)"
    ),
    record_status: str | None = Query(
        None, description="Record status from a prior search result (e.g. ACTIVE)"
    ),
    registration_date: str | None = Query(
        None, description="Registration date from a prior search result (e.g. 02/07/1986)"
    ),
):
    """Check business credibility by searching the registry and the web.

    Returns a credibility score out of 100 based on:
    - **Registry (30 pts)**: Whether the business is registered, active, and how long
    - **Web Presence (25 pts)**: Website existence, SSL, search visibility
    - **Social Media (25 pts)**: Facebook, Instagram, LinkedIn, Twitter, Google Maps
    - **Reviews (20 pts)**: Review mentions and sources found online

    **Two modes:**
    - **Search mode** (just `name`): Searches the registry, picks best match
    - **Direct mode** (`name` + `company_name`): Skips search, uses the exact
      company from a prior `/search` or `/check` result. Pass `record_status`
      and `registration_date` from the search result for accurate scoring.
    """
    # Use company_name for cache key if provided (more specific)
    cache_identity = company_name or name
    cache = _cache(request)
    cache_key = f"credibility:{cache_identity.strip().lower()}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    # Step 1: Check registry
    if company_name:
        # Direct mode: caller selected a specific company from search results
        best_match = Company(
            company_name=company_name,
            company_number=company_number or "",
            company_identifier="",
            record_type="",
            record_status=record_status or "",
            registration_date=registration_date or "",
            street_address="",
            state="",
            building="",
            town="",
        )
        is_registered = True
        _record_status = record_status or ""
        _registration_date = registration_date or ""
    else:
        # Search mode: search the registry
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
        _record_status = best_match.record_status if best_match else ""
        _registration_date = best_match.registration_date if best_match else ""

    # Step 2: Check web presence + run AI research in parallel
    checker = _web_presence(request)
    agent = _research_agent(request)
    search_name = best_match.company_name if best_match else name

    research_context = {
        "is_registered": is_registered,
        "registry_name": search_name,
        "record_status": _record_status,
        "registration_date": _registration_date,
    }

    web_task = checker.check(search_name, original_query=name)
    research_task = agent.research(name, context=research_context) if agent.available else None

    if research_task:
        web_result, research_report = await asyncio.gather(web_task, research_task)
    else:
        web_result = await web_task
        research_report = None

    # Step 2b: Merge AI-discovered digital presence into web result
    # The agent often finds websites/socials that algorithmic search misses
    # (e.g. "wamnow" → wam.now, creative domain names, alternate handles)
    enriched_result = await _enrich_web_presence(web_result, research_report, checker)

    # Step 3: Calculate credibility score using ENRICHED data
    breakdown = calculate_credibility(
        is_registered=is_registered,
        record_status=_record_status,
        registration_date=_registration_date,
        web_presence=enriched_result,
    )

    # Show claim prompt and tips for scores below 60
    show_claim = breakdown.total_score < 60
    tips = generate_improvement_tips(breakdown) if show_claim else []

    # Build research report info if available
    research_info = None
    if research_report and research_report.summary:
        research_info = ResearchReportInfo(
            summary=research_report.summary,
            industry=research_report.industry,
            founded=research_report.founded,
            key_people=research_report.key_people,
            services_products=research_report.services_products,
            reputation_signals=research_report.reputation_signals,
            sources=research_report.sources,
            confidence=research_report.confidence,
            gaps=research_report.gaps,
        )

    response = CredibilityResponse(
        query=name,
        credibility_score=breakdown.total_score,
        credibility_label=get_credibility_label(breakdown.total_score),
        is_registered=is_registered,
        registry_match=best_match,
        web_presence=WebPresenceInfo(
            website_url=enriched_result.website_url,
            website_live=enriched_result.website_live,
            website_ssl=enriched_result.website_ssl,
            social_media=enriched_result.social_media,
            has_maps_listing=enriched_result.has_maps_listing,
            maps_url=enriched_result.maps_url,
            search_results_count=enriched_result.search_results_count,
            news_mentions=enriched_result.news_mentions,
            review_snippets=enriched_result.review_snippets,
            articles=[
                ArticleInfo(**a) for a in enriched_result.articles
            ],
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
        research_report=research_info,
        show_claim_prompt=show_claim,
        improvement_tips=tips,
    )

    await cache.set(cache_key, response)
    return response
