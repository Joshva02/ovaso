import {
  Globe,
  ShieldCheck,
  ShieldX,
  Lock,
  LockOpen,
  MapPin,
  ExternalLink,
  Lightbulb,
  Building2,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CredibilityData {
  query: string;
  credibility_score: number;
  credibility_label: string;
  is_registered: boolean;
  registry_match: {
    company_name: string;
    company_number: string;
    company_identifier: string;
    record_type: string;
    record_status: string;
    registration_date: string;
    street_address: string;
    state: string;
  } | null;
  web_presence: {
    website_url: string | null;
    website_live: boolean;
    website_ssl: boolean;
    social_media: Record<string, string>;
    has_maps_listing: boolean;
    maps_url: string | null;
    search_results_count: number;
    news_mentions: number;
    review_snippets: Array<{ source: string; snippet: string; url: string }>;
  };
  score_breakdown: {
    registry_score: number;
    registry_max: number;
    registry_details: Record<string, unknown>;
    web_presence_score: number;
    web_presence_max: number;
    web_presence_details: Record<string, unknown>;
    social_media_score: number;
    social_media_max: number;
    social_media_details: Record<string, unknown>;
    reviews_score: number;
    reviews_max: number;
    reviews_details: Record<string, unknown>;
  };
  show_claim_prompt: boolean;
  improvement_tips: string[];
}

const SOCIAL_ICONS: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E4405F" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  twitter: { label: "Twitter / X", color: "#000000" },
};

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80
      ? "#16a34a"
      : score >= 60
        ? "#ca8a04"
        : score >= 40
          ? "#ea580c"
          : "#dc2626";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-warm-gray"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>
          {score}
        </span>
        <span className="text-[11px] text-mid-gray font-medium">/ 100</span>
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-yellow-500"
        : pct > 0
          ? "bg-orange-500"
          : "bg-mid-gray";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="text-dark-gray font-mono text-xs">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-warm-gray rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SocialLink({ platform, url }: { platform: string; url: string }) {
  const info = SOCIAL_ICONS[platform] || { label: platform, color: "#6b6760" };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-warm-gray hover:border-mid-gray transition-colors no-underline text-[13px] font-medium"
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: info.color }}
      />
      <span className="text-black">{info.label}</span>
      <ExternalLink size={11} className="text-mid-gray" />
    </a>
  );
}

export function CredibilityReport({ data }: { data: CredibilityData }) {
  const { score_breakdown: breakdown, web_presence: web, registry_match: reg } = data;
  const yearsRegistered = breakdown.registry_details.years_registered as number | null;

  return (
    <div className="space-y-6">
      {/* Header: Score + Label */}
      <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
        <ScoreRing score={data.credibility_score} />
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold tracking-tight mb-1">
            {data.credibility_label}
          </h3>
          <p className="text-[14px] text-dark-gray">
            Credibility report for{" "}
            <span className="font-semibold text-black">{data.query}</span>
          </p>
          {reg && (
            <p className="text-[12px] text-mid-gray mt-1 font-mono">
              {reg.company_name}
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border border-warm-gray p-5 space-y-4">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray">
          Score Breakdown
        </h4>
        <CategoryBar label="Registry" score={breakdown.registry_score} max={breakdown.registry_max} />
        <CategoryBar label="Web Presence" score={breakdown.web_presence_score} max={breakdown.web_presence_max} />
        <CategoryBar label="Social Media" score={breakdown.social_media_score} max={breakdown.social_media_max} />
        <CategoryBar label="Reviews" score={breakdown.reviews_score} max={breakdown.reviews_max} />
      </div>

      {/* Registry Info */}
      <div className="rounded-lg border border-warm-gray p-5">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-4">
          Registry
        </h4>
        {reg ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 size={16} className="text-dark-gray mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] font-medium">{reg.company_name}</p>
                <p className="text-[12px] text-dark-gray">
                  {reg.record_type} &middot; {reg.company_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.is_registered ? (
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <ShieldX size={16} className="text-red-500 shrink-0" />
              )}
              <span className="text-[14px]">
                <span className={cn("font-medium", data.is_registered ? "text-emerald-700" : "text-red-600")}>
                  {reg.record_status}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays size={16} className="text-dark-gray shrink-0" />
              <span className="text-[14px] text-charcoal">
                Registered {reg.registration_date}
                {yearsRegistered != null && (
                  <span className="text-dark-gray"> ({yearsRegistered} years)</span>
                )}
              </span>
            </div>
            {reg.street_address && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-dark-gray shrink-0" />
                <span className="text-[14px] text-charcoal">
                  {reg.street_address}{reg.state ? `, ${reg.state}` : ""}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[14px] text-dark-gray">
            <ShieldX size={16} className="text-red-500" />
            Not found in the RGD registry
          </div>
        )}
      </div>

      {/* Web Presence */}
      <div className="rounded-lg border border-warm-gray p-5">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-4">
          Web Presence
        </h4>
        <div className="space-y-3">
          {/* Website */}
          <div className="flex items-center gap-3">
            <Globe size={16} className={web.website_url ? "text-emerald-600" : "text-mid-gray"} />
            {web.website_url ? (
              <a
                href={web.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-tt-red hover:underline no-underline inline-flex items-center gap-1.5"
              >
                {new URL(web.website_url).hostname.replace("www.", "")}
                <ExternalLink size={11} />
              </a>
            ) : (
              <span className="text-[14px] text-dark-gray">No website found</span>
            )}
          </div>

          {/* SSL */}
          {web.website_url && (
            <div className="flex items-center gap-3">
              {web.website_ssl ? (
                <Lock size={16} className="text-emerald-600" />
              ) : (
                <LockOpen size={16} className="text-orange-500" />
              )}
              <span className="text-[14px] text-charcoal">
                {web.website_ssl ? "SSL certificate active (HTTPS)" : "No SSL certificate"}
              </span>
            </div>
          )}

          {/* Website status */}
          {web.website_url && (
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0",
                web.website_live ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className="text-[14px] text-charcoal">
                {web.website_live ? "Website is live" : "Website is down or unreachable"}
              </span>
            </div>
          )}

          {/* Search visibility */}
          <div className="flex items-center gap-3 pt-1 border-t border-warm-gray mt-2">
            <span className="text-[14px] text-charcoal">
              <span className="font-medium">{web.search_results_count}</span>{" "}
              search results found
            </span>
            {web.news_mentions > 0 && (
              <span className="text-[12px] text-dark-gray">
                &middot; {web.news_mentions} news mention{web.news_mentions !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Google Maps */}
          <div className="flex items-center gap-3">
            <MapPin size={16} className={web.has_maps_listing ? "text-emerald-600" : "text-mid-gray"} />
            {web.has_maps_listing ? (
              web.maps_url ? (
                <a
                  href={web.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-tt-red hover:underline no-underline inline-flex items-center gap-1.5"
                >
                  Google Maps listing
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span className="text-[14px] text-charcoal">Google Maps listing found</span>
              )
            ) : (
              <span className="text-[14px] text-dark-gray">No Google Maps listing found</span>
            )}
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="rounded-lg border border-warm-gray p-5">
        <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-4">
          Social Media
        </h4>
        {Object.keys(web.social_media).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(web.social_media).map(([platform, url]) => (
              <SocialLink key={platform} platform={platform} url={url} />
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-dark-gray">No social media profiles found</p>
        )}
      </div>

      {/* Reviews */}
      {web.review_snippets.length > 0 && (
        <div className="rounded-lg border border-warm-gray p-5">
          <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-4">
            Reviews & Mentions
          </h4>
          <div className="space-y-3">
            {web.review_snippets.slice(0, 5).map((review, i) => (
              <div key={i} className="border-b border-warm-gray last:border-0 pb-3 last:pb-0">
                <a
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-tt-red hover:underline no-underline inline-flex items-center gap-1.5 mb-1"
                >
                  {review.source}
                  <ExternalLink size={10} />
                </a>
                <p className="text-[13px] text-dark-gray leading-relaxed">
                  {review.snippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Prompt + Tips */}
      {data.show_claim_prompt && data.improvement_tips.length > 0 && (
        <div className="rounded-lg border-2 border-dashed border-tt-red/30 bg-tt-red-light p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-tt-red mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-[15px] mb-1">Do you own this business?</h4>
              <p className="text-[13px] text-dark-gray">
                Here's how to improve your credibility score:
              </p>
            </div>
          </div>
          <div className="space-y-2.5 ml-7">
            {data.improvement_tips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 text-[13px] text-charcoal leading-relaxed">
                <Lightbulb size={14} className="text-tt-red mt-0.5 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
