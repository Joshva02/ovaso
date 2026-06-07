"""Credibility score calculator for businesses.

Computes a score out of 100 based on registry data, web presence,
social media, and review signals.
"""

from dataclasses import dataclass, field
from datetime import datetime

from app.web_presence import WebPresenceResult


@dataclass(frozen=True)
class ScoreBreakdown:
    registry_score: int = 0
    registry_max: int = 30
    registry_details: dict = field(default_factory=dict)

    web_presence_score: int = 0
    web_presence_max: int = 25
    web_presence_details: dict = field(default_factory=dict)

    social_media_score: int = 0
    social_media_max: int = 25
    social_media_details: dict = field(default_factory=dict)

    reviews_score: int = 0
    reviews_max: int = 20
    reviews_details: dict = field(default_factory=dict)

    @property
    def total_score(self) -> int:
        return (
            self.registry_score
            + self.web_presence_score
            + self.social_media_score
            + self.reviews_score
        )

    @property
    def max_score(self) -> int:
        return (
            self.registry_max
            + self.web_presence_max
            + self.social_media_max
            + self.reviews_max
        )


def calculate_credibility(
    is_registered: bool,
    record_status: str,
    registration_date: str,
    web_presence: WebPresenceResult,
) -> ScoreBreakdown:
    """Calculate the overall credibility score from all signals."""
    registry = _score_registry(is_registered, record_status, registration_date)
    web = _score_web_presence(web_presence)
    social = _score_social_media(web_presence)
    reviews = _score_reviews(web_presence)

    return ScoreBreakdown(
        registry_score=registry[0],
        registry_details=registry[1],
        web_presence_score=web[0],
        web_presence_details=web[1],
        social_media_score=social[0],
        social_media_details=social[1],
        reviews_score=reviews[0],
        reviews_details=reviews[1],
    )


def _score_registry(
    is_registered: bool,
    record_status: str,
    registration_date: str,
) -> tuple[int, dict]:
    """Score based on registry data (max 30 points).

    - Registered: 15 pts
    - Active status: 10 pts
    - Registration age (>5 years = 5, >2 years = 3, >0 = 1): up to 5 pts
    """
    score = 0
    details: dict = {}

    if is_registered:
        score += 15
        details["registered"] = True
    else:
        details["registered"] = False
        return score, details

    status_upper = record_status.upper()
    active_keywords = {"ACTIVE", "CONTINUED", "REGISTERED", "GOOD STANDING"}
    is_active = any(kw in status_upper for kw in active_keywords)
    if is_active:
        score += 10
        details["active"] = True
    else:
        details["active"] = False

    years = _parse_registration_years(registration_date)
    details["years_registered"] = years
    if years is not None:
        if years >= 5:
            score += 5
        elif years >= 2:
            score += 3
        elif years > 0:
            score += 1

    return score, details


def _score_web_presence(web_presence: WebPresenceResult) -> tuple[int, dict]:
    """Score based on web presence (max 25 points).

    - Has website: 8 pts
    - Website is live: 5 pts
    - Website has SSL: 4 pts
    - Search results >= 10: 4 pts, >= 5: 2 pts
    - News mentions >= 1: 4 pts
    """
    score = 0
    details: dict = {}

    if web_presence.website_url:
        score += 8
        details["has_website"] = True
        details["website_url"] = web_presence.website_url

        if web_presence.website_live:
            score += 5
            details["website_live"] = True
        else:
            details["website_live"] = False

        if web_presence.website_ssl:
            score += 4
            details["has_ssl"] = True
        else:
            details["has_ssl"] = False
    else:
        details["has_website"] = False

    details["search_results_count"] = web_presence.search_results_count
    if web_presence.search_results_count >= 10:
        score += 4
    elif web_presence.search_results_count >= 5:
        score += 2

    details["news_mentions"] = web_presence.news_mentions
    if web_presence.news_mentions >= 1:
        score += 4

    return score, details


def _score_social_media(web_presence: WebPresenceResult) -> tuple[int, dict]:
    """Score based on social media presence (max 25 points).

    - 5 pts each for: Facebook, Instagram, LinkedIn, Twitter
    - 5 pts for Google Maps listing
    """
    score = 0
    details: dict = {"platforms_found": {}}
    platforms = web_presence.social_media

    for platform in ("facebook", "instagram", "linkedin", "twitter"):
        if platform in platforms:
            score += 5
            details["platforms_found"][platform] = platforms[platform]

    if web_presence.has_maps_listing:
        score += 5
        details["google_maps"] = True
        details["maps_url"] = web_presence.maps_url
    else:
        details["google_maps"] = False

    return score, details


def _score_reviews(web_presence: WebPresenceResult) -> tuple[int, dict]:
    """Score based on reviews and reputation signals (max 20 points).

    - Has review mentions: 10 pts
    - Multiple review sources: +5 pts (>= 2 snippets)
    - Many review sources: +5 pts (>= 4 snippets)
    """
    score = 0
    details: dict = {}

    review_count = len(web_presence.review_snippets)
    details["review_mentions_found"] = review_count

    if review_count > 0:
        score += 10
        details["review_sources"] = [
            {"source": s["source"], "url": s["url"]}
            for s in web_presence.review_snippets[:5]
        ]

    if review_count >= 2:
        score += 5

    if review_count >= 4:
        score += 5

    return score, details


def _parse_registration_years(date_str: str) -> int | None:
    """Parse an RGD date string and return years since registration."""
    if not date_str:
        return None

    formats = ["%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"]
    for fmt in formats:
        try:
            reg_date = datetime.strptime(date_str, fmt)
            delta = datetime.now() - reg_date
            return max(0, delta.days // 365)
        except ValueError:
            continue

    return None


def get_credibility_label(score: int) -> str:
    """Return a human-readable label for a credibility score."""
    if score >= 80:
        return "High Credibility"
    if score >= 60:
        return "Moderate Credibility"
    if score >= 40:
        return "Low Credibility"
    if score >= 20:
        return "Very Low Credibility"
    return "Insufficient Data"


def generate_improvement_tips(breakdown: ScoreBreakdown) -> list[str]:
    """Generate actionable tips to improve a business's credibility score."""
    tips: list[str] = []

    # Registry tips
    reg = breakdown.registry_details
    if not reg.get("registered"):
        tips.append(
            "Register your business with the Registrar General's Department (RGD) "
            "at https://rgd.legalaffairs.gov.tt to gain up to 30 credibility points."
        )
    elif not reg.get("active"):
        tips.append(
            "Your business registration status is not marked as active. "
            "Contact the RGD to ensure your filing is current and in good standing."
        )

    # Web presence tips
    web = breakdown.web_presence_details
    if not web.get("has_website"):
        tips.append(
            "Create a professional website for your business. "
            "A live website with SSL (HTTPS) can add up to 17 points to your score."
        )
    else:
        if not web.get("website_live"):
            tips.append(
                "Your website appears to be down or unreachable. "
                "Ensure your hosting is active and the domain is properly configured."
            )
        if not web.get("has_ssl"):
            tips.append(
                "Add an SSL certificate (HTTPS) to your website. "
                "Most hosting providers offer free SSL via Let's Encrypt."
            )

    if web.get("search_results_count", 0) < 5:
        tips.append(
            "Improve your online visibility by creating content, "
            "getting listed in local directories, and ensuring your business "
            "appears in search results."
        )

    # Social media tips
    social = breakdown.social_media_details
    platforms_found = social.get("platforms_found", {})
    missing_platforms = [
        p for p in ("facebook", "instagram", "linkedin", "twitter")
        if p not in platforms_found
    ]
    if missing_platforms:
        names = ", ".join(p.title() for p in missing_platforms)
        tips.append(
            f"Create and maintain business profiles on: {names}. "
            f"Each active social media presence adds 5 points to your score."
        )

    if not social.get("google_maps"):
        tips.append(
            "Add your business to Google Maps via Google Business Profile "
            "(https://business.google.com). This makes your business discoverable "
            "and adds 5 points to your score."
        )

    # Reviews tips
    reviews = breakdown.reviews_details
    if reviews.get("review_mentions_found", 0) == 0:
        tips.append(
            "Encourage satisfied customers to leave reviews on Google, Facebook, "
            "or other review platforms. Reviews can add up to 20 points."
        )
    elif reviews.get("review_mentions_found", 0) < 2:
        tips.append(
            "Build your review presence across multiple platforms. "
            "Having reviews on 2+ sources adds an additional 5 points."
        )

    return tips
