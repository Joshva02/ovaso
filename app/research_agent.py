"""AI-powered deep business research agent.

Uses Anthropic's Claude API with tool_use to call Firecrawl for
deep web research on businesses, synthesizing structured reports.
"""

import json
import os
from dataclasses import dataclass, field

import httpx

from app.logging import get_logger

logger = get_logger(__name__)

FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1"

SYSTEM_PROMPT = """You are Ovaso, a deep business research agent for Trinidad & Tobago.

Your PRIMARY job is to find the business's real digital footprint — their actual website, social media accounts, Google Maps listing, and online reviews. Your secondary job is general business research.

## CRITICAL: Finding Digital Presence

Most businesses you research are LOCAL to Trinidad & Tobago. Their online presence may not be obvious:

1. **Website discovery** — The business name and domain often differ. Examples:
   - "WamNow" → website is wam.now (not wamnow.com)
   - "Massy Holdings" → website is massygroup.com
   - "ANSA McAL" → website is ansamcal.com
   Search creatively: try "{name} Trinidad website", "{name} Trinidad", "{name} TT", and look at search result URLs carefully. Also try scraping any promising URL to check if it's actually their site (look for the business name, address, or branding in the page content).

2. **Social media** — Search specifically for each platform:
   - "{name} Trinidad facebook"
   - "{name} Trinidad instagram"
   - "{name} Trinidad linkedin"
   - "{name} twitter" or "{name} x.com"
   The handle/username often differs from the business name. Look at the actual URLs returned.

3. **Google Maps / Google Business** — Search "{name} Trinidad google maps" or "{name} Trinidad location"

4. **Reviews** — Search "{name} Trinidad reviews", "{name} customer reviews"

## Process
1. First, do 2-3 broad searches to understand what this business is
2. Then do TARGETED searches for their website, each social platform, and maps listing
3. Scrape any promising URLs to verify they belong to this business
4. If a search returns no results for a platform, try alternate name spellings or abbreviations
5. Synthesize everything into the structured report

## Rules
- Focus on factual, verifiable information
- Always include the actual URL you found (not a guessed one)
- Only include a URL if you're confident it belongs to THIS business
- Flag anything uncertain or contradictory
- Be concise but thorough

## Output Format
Return your findings as a JSON object with this structure:
{
  "summary": "2-3 sentence overview of the business",
  "industry": "primary industry/sector",
  "founded": "year or 'unknown'",
  "key_people": [{"name": "...", "role": "..."}],
  "services_products": ["what they offer"],
  "discovered_website": "https://example.com or null if not found",
  "discovered_social_media": {
    "facebook": "https://facebook.com/... or null",
    "instagram": "https://instagram.com/... or null",
    "linkedin": "https://linkedin.com/... or null",
    "twitter": "https://twitter.com/... or null"
  },
  "discovered_maps_url": "https://maps.google.com/... or null",
  "discovered_review_snippets": [
    {"source": "Google Reviews", "snippet": "what people say", "url": "..."}
  ],
  "reputation_signals": {
    "positive": ["good things found"],
    "negative": ["concerns found"],
    "neutral": ["other notable findings"]
  },
  "sources": [{"title": "...", "url": "..."}],
  "confidence": "high/medium/low",
  "gaps": ["information we couldn't find"]
}

Set discovered_website, social media fields, and maps_url to null (not the string "null") if you genuinely could not find them. Only include URLs you are confident belong to this specific business.

IMPORTANT: After you finish your research, output ONLY the JSON object above as your final message. Do not wrap it in markdown code blocks."""

TOOLS = [
    {
        "name": "search",
        "description": (
            "Search the web for information about a business. "
            "Returns titles, URLs, and snippets from search results."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to find business information",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "scrape",
        "description": (
            "Scrape a specific web page to extract its content. "
            "Use this to get detailed information from a promising URL found via search."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to scrape",
                },
            },
            "required": ["url"],
        },
    },
]

MAX_TOOL_ROUNDS = 8
MAX_SCRAPE_LENGTH = 3000


@dataclass(frozen=True)
class ResearchReport:
    summary: str = ""
    industry: str = ""
    founded: str = "unknown"
    key_people: list[dict] = field(default_factory=list)
    services_products: list[str] = field(default_factory=list)
    discovered_website: str | None = None
    discovered_social_media: dict[str, str | None] = field(default_factory=dict)
    discovered_maps_url: str | None = None
    discovered_review_snippets: list[dict] = field(default_factory=list)
    reputation_signals: dict = field(default_factory=dict)
    sources: list[dict] = field(default_factory=list)
    confidence: str = "low"
    gaps: list[str] = field(default_factory=list)


class ResearchAgent:
    """Deep business research agent powered by Claude."""

    def __init__(self) -> None:
        self._api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self._firecrawl_key = os.environ.get("FIRECRAWL_API_KEY", "")
        self._http = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def close(self) -> None:
        await self._http.aclose()

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def research(self, business_name: str, context: dict | None = None) -> ResearchReport:
        """Run deep research on a business using Claude + Firecrawl tools."""
        if not self._api_key:
            logger.warning("research_agent_no_key", business="anthropic api key not set")
            return ResearchReport(gaps=["Research agent not configured"])

        # Build initial user message with any context we already have
        user_message = f"Research this Trinidad & Tobago business: {business_name}"
        if context:
            if context.get("is_registered"):
                user_message += f"\n\nRegistry info: registered as '{context.get('registry_name', business_name)}'"
                if context.get("record_status"):
                    user_message += f", status: {context['record_status']}"
                if context.get("registration_date"):
                    user_message += f", registered: {context['registration_date']}"
            if context.get("website_url"):
                user_message += f"\nKnown website: {context['website_url']}"

        messages = [{"role": "user", "content": user_message}]

        # Agentic loop: let Claude call tools until it produces a final answer
        for round_num in range(MAX_TOOL_ROUNDS):
            response = await self._call_claude(messages)
            if response is None:
                return ResearchReport(gaps=["Failed to get response from research agent"])

            # Collect the assistant's response
            assistant_content = response.get("content", [])
            messages.append({"role": "assistant", "content": assistant_content})

            # Check if there are tool calls
            tool_use_blocks = [b for b in assistant_content if b.get("type") == "tool_use"]
            if not tool_use_blocks:
                # No more tool calls - extract the final text response
                return self._parse_report(assistant_content)

            # Execute all tool calls and build tool results
            tool_results = []
            for tool_block in tool_use_blocks:
                tool_name = tool_block["name"]
                tool_input = tool_block["input"]
                tool_id = tool_block["id"]

                result = await self._execute_tool(tool_name, tool_input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": result,
                })

            messages.append({"role": "user", "content": tool_results})

        # Exhausted rounds - ask for final summary
        messages.append({
            "role": "user",
            "content": "Please provide your final research report now as JSON.",
        })
        response = await self._call_claude(messages)
        if response:
            return self._parse_report(response.get("content", []))

        return ResearchReport(gaps=["Research agent exhausted tool rounds"])

    async def _call_claude(self, messages: list[dict]) -> dict | None:
        """Call the Anthropic Messages API."""
        try:
            response = await self._http.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self._api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 4096,
                    "system": SYSTEM_PROMPT,
                    "tools": TOOLS,
                    "messages": messages,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error("claude_api_error", error=str(e))
            return None

    async def _execute_tool(self, tool_name: str, tool_input: dict) -> str:
        """Execute a tool call and return the result as a string."""
        if tool_name == "search":
            return await self._firecrawl_search(tool_input.get("query", ""))
        elif tool_name == "scrape":
            return await self._firecrawl_scrape(tool_input.get("url", ""))
        return f"Unknown tool: {tool_name}"

    async def _firecrawl_search(self, query: str) -> str:
        """Search using Firecrawl API."""
        if not self._firecrawl_key:
            return "Search unavailable: Firecrawl API key not configured"

        try:
            response = await self._http.post(
                f"{FIRECRAWL_API_URL}/search",
                headers={
                    "Authorization": f"Bearer {self._firecrawl_key}",
                    "Content-Type": "application/json",
                },
                json={"query": query, "limit": 8},
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            results = []
            for item in data.get("data", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", "")[:500],
                })
            return json.dumps(results[:8])
        except Exception as e:
            logger.warning("firecrawl_search_error", query=query, error=str(e))
            return f"Search failed: {e}"

    async def _firecrawl_scrape(self, url: str) -> str:
        """Scrape a URL using Firecrawl API."""
        if not self._firecrawl_key:
            return "Scrape unavailable: Firecrawl API key not configured"

        try:
            response = await self._http.post(
                f"{FIRECRAWL_API_URL}/scrape",
                headers={
                    "Authorization": f"Bearer {self._firecrawl_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "url": url,
                    "formats": ["markdown"],
                },
                timeout=20.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("data", {}).get("markdown", "")
            # Truncate to avoid blowing up context
            if len(content) > MAX_SCRAPE_LENGTH:
                content = content[:MAX_SCRAPE_LENGTH] + "\n\n[Content truncated]"
            return content if content else "No content extracted from page"
        except Exception as e:
            logger.warning("firecrawl_scrape_error", url=url, error=str(e))
            return f"Scrape failed: {e}"

    def _parse_report(self, content_blocks: list[dict]) -> ResearchReport:
        """Parse Claude's response into a ResearchReport."""
        # Extract text from content blocks
        text = ""
        for block in content_blocks:
            if block.get("type") == "text":
                text += block.get("text", "")

        # Try to parse JSON from the response
        try:
            # Try direct JSON parse first
            data = json.loads(text.strip())
            return self._dict_to_report(data)
        except json.JSONDecodeError:
            pass

        # Try to extract JSON from markdown code blocks
        import re
        json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                return self._dict_to_report(data)
            except json.JSONDecodeError:
                pass

        # Try to find any JSON object in the text
        brace_start = text.find("{")
        brace_end = text.rfind("}")
        if brace_start != -1 and brace_end > brace_start:
            try:
                data = json.loads(text[brace_start:brace_end + 1])
                return self._dict_to_report(data)
            except json.JSONDecodeError:
                pass

        # Fallback: return the text as a summary
        return ResearchReport(
            summary=text[:500] if text else "No report generated",
            gaps=["Could not parse structured report from agent response"],
        )

    def _dict_to_report(self, data: dict) -> ResearchReport:
        """Convert a dict to a ResearchReport."""
        # Extract social media, filtering out null/None values
        raw_social = data.get("discovered_social_media", {})
        social = {k: v for k, v in raw_social.items() if v} if raw_social else {}

        # Extract review snippets
        raw_reviews = data.get("discovered_review_snippets", [])
        reviews = [r for r in raw_reviews if isinstance(r, dict)] if raw_reviews else []

        return ResearchReport(
            summary=data.get("summary", ""),
            industry=data.get("industry", ""),
            founded=str(data.get("founded", "unknown")),
            key_people=data.get("key_people", []),
            services_products=data.get("services_products", []),
            discovered_website=data.get("discovered_website") or None,
            discovered_social_media=social,
            discovered_maps_url=data.get("discovered_maps_url") or None,
            discovered_review_snippets=reviews,
            reputation_signals=data.get("reputation_signals", {}),
            sources=data.get("sources", []),
            confidence=data.get("confidence", "low"),
            gaps=data.get("gaps", []),
        )
