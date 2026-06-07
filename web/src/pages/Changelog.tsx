import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const RELEASES = [
  {
    version: "1.1",
    date: "June 7, 2026",
    tag: "Latest",
    title: "Business Credibility Scoring",
    description:
      "Ovaso now goes beyond registry lookups. The new /credibility endpoint scrapes the web to assess a business's online presence and returns a credibility score out of 100.",
    changes: [
      {
        type: "added" as const,
        items: [
          "New /credibility endpoint — full business credibility scoring with web presence analysis",
          "Registry scoring (30 pts) — registration status, active status, years registered",
          "Web presence scoring (25 pts) — website detection, SSL check, search visibility, news mentions",
          "Social media scoring (25 pts) — Facebook, Instagram, LinkedIn, Twitter/X, Google Maps detection",
          "Reviews scoring (20 pts) — review mentions across multiple platforms",
          "Improvement tips — actionable suggestions for businesses scoring below 60",
          "\"Do you own this business?\" claim prompt for low-scoring businesses",
          "TERMS.md — full scoring methodology and terms of use",
        ],
      },
      {
        type: "improved" as const,
        items: [
          "Updated API playground with /credibility as the default endpoint",
          "Updated documentation with full methodology breakdown and scoring tables",
          "Added WebPresence and ScoreBreakdown schemas to docs",
          "Updated hero tagline to reflect credibility scoring feature",
        ],
      },
    ],
  },
  {
    version: "1.0",
    date: "May 2025",
    title: "Initial Release",
    description:
      "First public release of the Ovaso API — a free, open-source REST API to search the Trinidad & Tobago business registry.",
    changes: [
      {
        type: "added" as const,
        items: [
          "/check endpoint — verify if a business name is registered",
          "/search endpoint — search registered companies by name",
          "/reservations endpoint — search name reservations filed with the RGD",
          "/health endpoint — API health check",
          "In-memory TTL cache with 5-minute expiry",
          "Rate limiting at 30 requests/minute per IP",
          "Interactive API playground on the website",
          "Full API documentation with schemas and examples",
        ],
      },
    ],
  },
];

const TYPE_STYLES = {
  added: { label: "Added", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  improved: { label: "Improved", color: "text-blue-700 bg-blue-50 border-blue-200" },
  fixed: { label: "Fixed", color: "text-amber-700 bg-amber-50 border-amber-200" },
  removed: { label: "Removed", color: "text-red-700 bg-red-50 border-red-200" },
} as const;

export function Changelog() {
  return (
    <>
      <Navbar />
      <main className="max-w-[1120px] mx-auto px-6 pt-32 pb-16">
        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block">
          Changelog
        </span>
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tighter leading-tight mb-3">
          What's new in Ovaso
        </h1>
        <p className="text-dark-gray text-[15px] leading-relaxed max-w-[560px] mb-12">
          All notable changes to the Ovaso API and website are documented here.
        </p>

        <div className="space-y-16">
          {RELEASES.map((release) => (
            <article key={release.version} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[clamp(1.25rem,2.5vw,1.5rem)] font-bold tracking-tight">
                  v{release.version}
                </h2>
                {release.tag && (
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-tt-red text-white px-2 py-0.5 rounded">
                    {release.tag}
                  </span>
                )}
                <span className="text-[13px] text-mid-gray ml-auto">
                  {release.date}
                </span>
              </div>

              {release.title && (
                <h3 className="text-[17px] font-semibold mb-2">{release.title}</h3>
              )}

              <p className="text-[15px] text-charcoal leading-relaxed max-w-[640px] mb-6">
                {release.description}
              </p>

              <div className="space-y-6">
                {release.changes.map((group) => {
                  const style = TYPE_STYLES[group.type];
                  return (
                    <div key={group.type}>
                      <span
                        className={`inline-block text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border mb-3 ${style.color}`}
                      >
                        {style.label}
                      </span>
                      <ul className="space-y-2">
                        {group.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-[14px] text-charcoal leading-relaxed"
                          >
                            <span className="text-mid-gray mt-1.5 shrink-0">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {release !== RELEASES[RELEASES.length - 1] && (
                <div className="mt-12 border-b border-warm-gray" />
              )}
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
