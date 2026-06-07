"""Web presence discovery for businesses.

Searches the web for a business's digital footprint including website,
social media profiles, Google Maps listing, and reviews.
"""

import asyncio
import os
import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx

from app.logging import get_logger

logger = get_logger(__name__)

SOCIAL_PLATFORMS = {
    "facebook": ["facebook.com", "fb.com"],
    "instagram": ["instagram.com"],
    "linkedin": ["linkedin.com"],
    "twitter": ["twitter.com", "x.com"],
}

MAPS_DOMAINS = ["google.com/maps", "maps.google.com", "goo.gl/maps"]

EXCLUDED_DOMAINS = {
    "youtube.com", "wikipedia.org", "wikidata.org", "reddit.com",
    "pinterest.com", "tiktok.com", "amazon.com", "ebay.com",
    "yelp.com", "tripadvisor.com", "bbb.org",
}

NEWS_ARTICLE_DOMAINS = {
    "guardian.co.tt", "trinidadexpress.com", "newsday.co.tt", "looptt.com",
    "cnc3.co.tt", "tv6tnt.com", "ttt.live", "trinidadandtobagonewsday.com",
    "medium.com", "techcrunch.com", "bloomberg.com", "reuters.com",
    "bbc.com", "technewstt.com", "ground.news",
}

REQUEST_TIMEOUT = 10.0
WEBSITE_CHECK_TIMEOUT = 8.0


@dataclass(frozen=True)
class WebPresenceResult:
    website_url: str | None = None
    website_live: bool = False
    website_ssl: bool = False
    social_media: dict[str, str] = field(default_factory=dict)
    has_maps_listing: bool = False
    maps_url: str | None = None
    search_results_count: int = 0
    news_mentions: int = 0
    review_snippets: list[dict] = field(default_factory=list)
    articles: list[dict] = field(default_factory=list)


FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/search"


class WebPresenceChecker:
    """Discovers a business's web presence using Firecrawl search API."""

    def __init__(self) -> None:
        self._http = httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            },
        )
        self._firecrawl_key = os.environ.get("FIRECRAWL_API_KEY", "")

    async def close(self) -> None:
        await self._http.aclose()

    async def check(
        self,
        business_name: str,
        original_query: str | None = None,
        country: str = "Trinidad and Tobago",
    ) -> WebPresenceResult:
        """Run all web presence checks for a business.

        Searches multiple name variations to maximize discovery:
        - The original user query
        - The registry name (cleaned of legal suffixes)
        - Core brand name extracted from the registry name
        """
        name_variations = _generate_name_variations(business_name, original_query)
        all_name_tokens = set()
        for variation in name_variations:
            all_name_tokens.update(variation.lower().split())

        # Search all variations in parallel
        search_tasks = [
            self._search_web(f"{variation} {country}")
            for variation in name_variations
        ]
        variation_results = await asyncio.gather(*search_tasks, return_exceptions=True)

        # Merge all results, deduplicating by URL
        seen_urls: set[str] = set()
        search_results: list[dict] = []
        for result in variation_results:
            if isinstance(result, Exception):
                continue
            for item in result:
                url = item.get("url", "")
                if url not in seen_urls:
                    seen_urls.add(url)
                    search_results.append(item)

        social_media = _extract_social_links(search_results, all_name_tokens)
        website_url = _extract_business_website(search_results, business_name, all_name_tokens)
        has_maps, maps_url = _extract_maps_listing(search_results)
        news_count = _count_news_mentions(search_results)
        review_snippets = _extract_review_snippets(search_results)
        articles = _extract_articles(search_results, business_name, all_name_tokens)

        website_live = False
        website_ssl = False
        if website_url:
            website_live, website_ssl = await self._check_website(website_url)

        # Targeted searches for missing signals
        if not has_maps:
            primary_name = name_variations[0]
            maps_results = await self._search_web(f"{primary_name} {country} google maps")
            has_maps, maps_url = _extract_maps_listing(maps_results)

        if not social_media:
            primary_name = name_variations[0]
            social_results = await self._search_social(primary_name, country)
            social_media = {**social_results, **social_media}

        return WebPresenceResult(
            website_url=website_url,
            website_live=website_live,
            website_ssl=website_ssl,
            social_media=social_media,
            has_maps_listing=has_maps,
            maps_url=maps_url,
            search_results_count=len(search_results),
            news_mentions=news_count,
            review_snippets=review_snippets,
            articles=articles,
        )

    async def _search_web(self, query: str) -> list[dict]:
        """Search the web using Firecrawl API."""
        if self._firecrawl_key:
            results = await self._search_firecrawl(query)
            if results:
                return results
        return await self._search_ddg(query)

    async def _search_firecrawl(self, query: str) -> list[dict]:
        """Search using Firecrawl search API."""
        try:
            response = await self._http.post(
                FIRECRAWL_API_URL,
                headers={
                    "Authorization": f"Bearer {self._firecrawl_key}",
                    "Content-Type": "application/json",
                },
                json={"query": query, "limit": 10},
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            results = []
            for item in data.get("data", []):
                results.append({
                    "url": item.get("url", ""),
                    "title": item.get("title", ""),
                    "snippet": item.get("description", ""),
                })
            return results
        except Exception as e:
            logger.warning("firecrawl_search_error", query=query, error=str(e))
            return []

    async def _search_ddg(self, query: str) -> list[dict]:
        """Search using DuckDuckGo HTML (fallback)."""
        try:
            response = await self._http.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
            )
            response.raise_for_status()
            return _parse_ddg_results(response.text)
        except Exception as e:
            logger.warning("ddg_search_error", query=query, error=str(e))
            return []

    async def _search_social(self, business_name: str, country: str) -> dict[str, str]:
        """Search specifically for social media profiles."""
        results: dict[str, str] = {}
        social_results = await self._search_web(
            f"{business_name} {country} facebook instagram linkedin"
        )
        for item in social_results:
            url = item.get("url", "").lower()
            for platform, domains in SOCIAL_PLATFORMS.items():
                if platform not in results and any(d in url for d in domains):
                    results[platform] = item["url"]
        return results

    async def _check_website(self, url: str) -> tuple[bool, bool]:
        """Check if a website is live and has SSL."""
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        has_ssl = False
        is_live = False

        try:
            response = await self._http.get(url, timeout=WEBSITE_CHECK_TIMEOUT)
            is_live = response.status_code < 500
            has_ssl = str(response.url).startswith("https://")
        except httpx.ConnectError:
            # Try http if https failed
            if url.startswith("https://"):
                try:
                    http_url = url.replace("https://", "http://", 1)
                    response = await self._http.get(http_url, timeout=WEBSITE_CHECK_TIMEOUT)
                    is_live = response.status_code < 500
                    has_ssl = str(response.url).startswith("https://")
                except Exception:
                    pass
        except Exception as e:
            logger.warning("website_check_error", url=url, error=str(e))

        return is_live, has_ssl


LEGAL_SUFFIXES = re.compile(
    r"\b(LIMITED|LTD\.?|INCORPORATED|INC\.?|COMPANY|CO\.?|CORPORATION|CORP\.?|"
    r"ENTERPRISES?|SERVICES?|HOLDINGS?|GROUP|SOLUTIONS?|PARTNERS?|"
    r"INTERNATIONAL|INT'?L|ASSOCIATES?|CONSULTANTS?|VENTURES?|"
    r"TRADING|INVESTMENTS?)\b",
    re.IGNORECASE,
)

FORMERLY_PATTERN = re.compile(r"\s+FORMERLY\s+.*", re.IGNORECASE)


def _generate_name_variations(registry_name: str, original_query: str | None = None) -> list[str]:
    """Generate search-friendly name variations from a registry name.

    Example: "WAMNOW TECHNOLOGIES FORMERLY WAMNOW FINANCIAL LIMITED"
    -> ["wamnow technologies", "wamnow", "WAMNOW TECHNOLOGIES"]
    With original_query="wamnow technologies":
    -> ["wamnow technologies", "wamnow", "WAMNOW TECHNOLOGIES"]
    """
    variations: list[str] = []
    seen: set[str] = set()

    def _add(name: str) -> None:
        cleaned = " ".join(name.split()).strip()
        if cleaned and cleaned.lower() not in seen and len(cleaned) >= 2:
            seen.add(cleaned.lower())
            variations.append(cleaned)

    # 1. Original user query (most likely to match brand name)
    if original_query:
        _add(original_query)

    # 2. Registry name without "FORMERLY ..." clause
    name_without_formerly = FORMERLY_PATTERN.sub("", registry_name).strip()
    _add(name_without_formerly)

    # 3. Registry name without legal suffixes
    core_name = LEGAL_SUFFIXES.sub("", name_without_formerly).strip()
    core_name = re.sub(r"[.\s]+", " ", core_name).strip()
    core_name = " ".join(core_name.split())
    _add(core_name)

    # 4. First word only (often the brand: "WAMNOW", "MASSY", "GUARDIAN")
    first_word = core_name.split()[0] if core_name else ""
    if len(first_word) >= 3:
        _add(first_word)

    # 5. Full registry name as fallback
    _add(registry_name)

    return variations if variations else [registry_name]


def _parse_ddg_results(html: str) -> list[dict]:
    """Parse DuckDuckGo HTML search results into structured data."""
    results = []

    link_pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>(.*?)</a>',
        re.DOTALL,
    )
    snippet_pattern = re.compile(
        r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
        re.DOTALL,
    )

    links = link_pattern.findall(html)
    snippets = snippet_pattern.findall(html)

    for i, (url, title) in enumerate(links):
        url = _clean_ddg_url(url)
        title = re.sub(r"<[^>]+>", "", title).strip()
        snippet = ""
        if i < len(snippets):
            snippet = re.sub(r"<[^>]+>", "", snippets[i]).strip()

        if url:
            results.append({"url": url, "title": title, "snippet": snippet})

    return results


def _clean_ddg_url(url: str) -> str:
    """Extract the actual URL from DuckDuckGo's redirect wrapper."""
    if "uddg=" in url:
        match = re.search(r"uddg=([^&]+)", url)
        if match:
            from urllib.parse import unquote
            return unquote(match.group(1))
    return url


def _is_profile_url(url: str, platform: str) -> bool:
    """Check if a social media URL is a profile/page (not a post by someone else)."""
    parsed = urlparse(url)
    path = parsed.path.lower().rstrip("/")
    # Posts, reels, status updates from other accounts
    post_indicators = ["/posts/", "/p/", "/reel/", "/status/", "/videos/", "/watch"]
    return not any(indicator in path for indicator in post_indicators)


def _social_url_matches_business(url: str, name_tokens: set[str]) -> bool:
    """Check if a social media URL path contains the business name."""
    parsed = urlparse(url)
    path = parsed.path.lower()
    return any(token in path for token in name_tokens if len(token) >= 3)


def _extract_social_links(
    results: list[dict],
    name_tokens: set[str] | None = None,
) -> dict[str, str]:
    """Extract social media profile URLs from search results.

    Prefers profile pages that contain the business name over
    third-party posts that merely mention the business.
    """
    # First pass: find profile URLs with business name in path
    owned: dict[str, str] = {}
    # Second pass fallback: any social link that's a profile
    profile_fallback: dict[str, str] = {}
    # Third pass fallback: any social link at all
    any_fallback: dict[str, str] = {}

    meaningful = {t for t in (name_tokens or set()) if len(t) >= 3}

    for item in results:
        url = item.get("url", "")
        url_lower = url.lower()
        for platform, domains in SOCIAL_PLATFORMS.items():
            if not any(d in url_lower for d in domains):
                continue

            if platform not in owned and meaningful and _social_url_matches_business(url, meaningful):
                owned[platform] = url
            elif platform not in profile_fallback and _is_profile_url(url, platform):
                profile_fallback[platform] = url
            elif platform not in any_fallback:
                any_fallback[platform] = url

    # Merge: prefer owned > profile > any
    merged: dict[str, str] = {}
    all_platforms = set(owned) | set(profile_fallback) | set(any_fallback)
    for platform in all_platforms:
        merged[platform] = owned.get(platform) or profile_fallback.get(platform) or any_fallback[platform]

    return merged


INSTITUTIONAL_DOMAINS = {
    "central-bank.org.tt", "cbtt.org.tt", "ttse.com", "ttsec.org.tt",
    "news.gov.tt", "nalis.gov.tt", "ttparliament.org",
}


def _extract_business_website(
    results: list[dict],
    business_name: str,
    all_name_tokens: set[str] | None = None,
) -> str | None:
    """Find the most likely business website from search results.

    Only matches on the domain name containing the business name.
    Skips news sites, social media, government, and institutional domains
    to avoid returning articles *about* the business as its website.
    """
    name_tokens = all_name_tokens or set(business_name.lower().split())
    stop_words = {
        "the", "and", "of", "for", "in", "to", "a", "an", "is", "it",
        "limited", "ltd", "inc", "company", "co", "corporation", "corp",
        "formerly", "enterprises", "services", "holdings", "group",
        "solutions", "international", "trinidad", "tobago",
    }
    meaningful_tokens = {t for t in name_tokens if len(t) > 2 and t not in stop_words}

    for item in results:
        url = item.get("url", "")
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")

        if any(excluded in domain for excluded in EXCLUDED_DOMAINS):
            continue
        if any(d in domain for platform_domains in SOCIAL_PLATFORMS.values() for d in platform_domains):
            continue
        if any(d in domain for d in MAPS_DOMAINS):
            continue
        if "gov.tt" in domain or "rgd." in domain:
            continue
        if domain in INSTITUTIONAL_DOMAINS:
            continue
        # Skip news domains — those are articles about the business, not the business itself
        if any(nd in domain for nd in NEWS_ARTICLE_DOMAINS):
            continue

        # Only match on the domain containing the business name
        domain_no_tld = domain.rsplit(".", 1)[0] if "." in domain else domain

        if any(token in domain_no_tld for token in meaningful_tokens):
            return url

    return None


def _extract_maps_listing(results: list[dict]) -> tuple[bool, str | None]:
    """Check if any result is a Google Maps listing."""
    for item in results:
        url = item.get("url", "").lower()
        if any(d in url for d in MAPS_DOMAINS):
            return True, item["url"]
    return False, None


def _count_news_mentions(results: list[dict]) -> int:
    """Count results that appear to be news articles."""
    news_domains = {"news", "guardian", "express", "newsday", "loop", "cnc3", "tv6"}
    count = 0
    for item in results:
        domain = urlparse(item.get("url", "")).netloc.lower()
        if any(nd in domain for nd in news_domains):
            count += 1
    return count


def _extract_review_snippets(results: list[dict]) -> list[dict]:
    """Extract review-related snippets from search results."""
    review_keywords = {"review", "rating", "stars", "rated", "customer"}
    snippets = []
    for item in results:
        snippet_lower = item.get("snippet", "").lower()
        if any(kw in snippet_lower for kw in review_keywords):
            snippets.append({
                "source": item.get("title", ""),
                "snippet": item.get("snippet", ""),
                "url": item.get("url", ""),
            })
    return snippets


def _extract_articles(
    results: list[dict],
    business_name: str,
    name_tokens: set[str] | None = None,
) -> list[dict]:
    """Extract news articles and press mentions about the business."""
    tokens = name_tokens or set(business_name.lower().split())
    stop_words = {
        "the", "and", "of", "for", "in", "to", "a", "an", "is", "it",
        "limited", "ltd", "inc", "company", "co", "trinidad", "tobago",
    }
    meaningful = {t for t in tokens if len(t) > 2 and t not in stop_words}

    articles = []
    seen_urls: set[str] = set()

    for item in results:
        url = item.get("url", "")
        if url in seen_urls:
            continue

        domain = urlparse(url).netloc.lower().replace("www.", "")
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        combined = f"{title} {snippet}".lower()

        # Skip social media and non-article pages
        if any(d in domain for domains in SOCIAL_PLATFORMS.values() for d in domains):
            continue
        if any(d in domain for d in MAPS_DOMAINS):
            continue

        # Must mention the business in the title or snippet
        if not any(token in combined for token in meaningful):
            continue

        # Check if it's from a known news/article domain
        is_news_domain = any(nd in domain for nd in NEWS_ARTICLE_DOMAINS)
        # Or has news-like URL patterns
        is_article_url = any(
            p in url.lower()
            for p in ["/article", "/news/", "/business/", "/story/", "/post"]
        )

        if is_news_domain or is_article_url:
            seen_urls.add(url)
            articles.append({
                "title": title,
                "source": domain,
                "snippet": snippet,
                "url": url,
            })

    return articles[:10]
