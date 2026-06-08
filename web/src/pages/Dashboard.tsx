import { useUser, SignInButton } from "@clerk/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Key, Copy, Check, RefreshCw, Trash2, Plus, Shield, Zap, Loader2, X, BookOpen, Sparkles } from "lucide-react";
import { API_BASE } from "@/utils/config";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="p-1.5 text-dark-gray hover:text-black transition-colors cursor-pointer"
      aria-label="Copy"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
}

function DeleteKeyModal({
  keyName,
  onConfirm,
  onCancel,
}: {
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const confirmText = "i want to delete this key";
  const canConfirm = input.toLowerCase() === confirmText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-warm-gray shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">Delete {keyName}</h3>
          <button
            onClick={onCancel}
            className="p-1 text-dark-gray hover:text-black transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] text-dark-gray mb-1">
          This action cannot be undone. Any applications using this key will lose access immediately.
        </p>
        <p className="text-[13px] text-dark-gray mb-4">
          Type <span className="font-mono text-[12px] bg-warm-gray px-1.5 py-0.5 rounded">{confirmText}</span> to confirm.
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={confirmText}
          className="w-full border border-warm-gray rounded px-3 py-2 text-[13px] font-mono mb-4 outline-none focus:border-dark-gray transition-colors"
          autoFocus
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[13px] font-medium text-dark-gray hover:text-black transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-[13px] font-semibold hover:bg-red-700 active:scale-[0.96] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Key
          </button>
        </div>
      </div>
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  isNew,
}: {
  apiKey: { _id: any; key: string; name: string; isActive: boolean; createdAt: number; totalRequests: number; lastUsedAt?: number };
  isNew: boolean;
}) {
  const revoke = useMutation(api.apiKeys.revoke);
  const regenerate = useMutation(api.apiKeys.regenerate);
  const [showFull, setShowFull] = useState(isNew);
  const [regenerating, setRegenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const maskedKey = "ovaso_" + "•".repeat(35);
  const displayKey = showFull ? apiKey.key : maskedKey;

  const handleRegenerate = async () => {
    setRegenerating(true);
    await regenerate({ keyId: apiKey._id });
    setRegenerating(false);
    setShowFull(true);
  };

  if (!apiKey.isActive) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-warm-gray">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Key size={14} className="text-dark-gray shrink-0" />
            <span className="text-[13px] font-medium">{apiKey.name}</span>
          </div>
          <button
            onClick={() => setShowFull(!showFull)}
            className="font-mono text-[12px] text-dark-gray hover:text-black transition-colors cursor-pointer truncate block max-w-full text-left"
          >
            {displayKey}
          </button>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-mid-gray">
            <span>{apiKey.totalRequests} requests</span>
            {apiKey.lastUsedAt && (
              <span>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton text={apiKey.key} />
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="p-1.5 text-dark-gray hover:text-black transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Regenerate"
          >
            <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-1.5 text-dark-gray hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <DeleteKeyModal
          keyName={apiKey.name}
          onConfirm={() => {
            revoke({ keyId: apiKey._id });
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const createUser = useMutation(api.users.create);
  const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
  const apiKeys = useQuery(api.apiKeys.getByUserId, convexUser ? { userId: convexUser._id } : "skip");
  const createKey = useMutation(api.apiKeys.create);
  const [newKeyId, setNewKeyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentPending = searchParams.get("payment") === "processing";
  const isPaid = convexUser?.plan === "pro" || convexUser?.plan === "business";
  const planLabel = convexUser?.plan === "business" ? "Business" : convexUser?.plan === "pro" ? "Pro" : "Free";
  const maxKeys = convexUser?.plan === "business" ? 10 : 3;

  // Clear payment param once user is upgraded
  useEffect(() => {
    if (paymentPending && isPaid) {
      setSearchParams({}, { replace: true });
    }
  }, [paymentPending, isPaid, setSearchParams]);

  // Sync Clerk user to Convex on first visit
  useEffect(() => {
    if (user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? undefined,
      });
    }
  }, [user, convexUser, createUser]);

  const handleCreateKey = async () => {
    if (!convexUser) return;
    setCreating(true);
    const result = await createKey({
      userId: convexUser._id,
      name: `API Key ${(apiKeys?.filter((k) => k.isActive).length ?? 0) + 1}`,
    });
    setNewKeyId(result.id);
    setCreating(false);
  };

  const handleUpgrade = async (plan: "pro" | "business", billingCycle: "monthly" | "annual") => {
    if (!convexUser || upgrading) return;
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const url = `${CONVEX_SITE_URL}/create-checkout`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: convexUser._id, plan, billingCycle }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setUpgradeError(data.error ?? "Failed to create checkout session");
        setUpgrading(false);
      }
    } catch (err) {
      setUpgradeError("Could not connect to payment service");
      setUpgrading(false);
    }
  };

  const activeKeys = apiKeys?.filter((k) => k.isActive) ?? [];

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
      <p className="text-[14px] text-dark-gray mb-8">
        Manage your API keys and subscription.
      </p>

      {/* Payment processing banner */}
      {paymentPending && !isPaid && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
          <Loader2 size={16} className="animate-spin text-amber-600 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-amber-900">Payment processing</p>
            <p className="text-[12px] text-amber-700">
              Your upgrade is being confirmed. This page will update automatically.
            </p>
          </div>
        </div>
      )}

      {/* Plan */}
      <div className="rounded-lg border border-warm-gray p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray">
            Current Plan
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold",
            isPaid
              ? "bg-emerald-100 text-emerald-700"
              : "bg-warm-gray text-dark-gray"
          )}>
            <Shield size={12} />
            {planLabel}
          </div>
          <span className="text-[13px] text-dark-gray">
            {isPaid
              ? `Full access to /credibility${convexUser?.billingCycle ? ` · ${convexUser.billingCycle}` : ""}`
              : "/credibility endpoint requires a paid plan"
            }
          </span>
        </div>
        {!isPaid && (
          <UpgradeSelector
            upgrading={upgrading}
            onUpgrade={handleUpgrade}
          />
        )}
        {upgradeError && (
          <p className="text-[12px] text-red-600 mt-3">{upgradeError}</p>
        )}
      </div>

      {/* API Keys */}
      <div className="rounded-lg border border-warm-gray p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray">
            API Keys
          </h2>
          {isPaid && (
            <button
              onClick={handleCreateKey}
              disabled={creating || activeKeys.length >= maxKeys}
              className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-charcoal active:scale-[0.96] transition-all cursor-pointer disabled:bg-mid-gray disabled:cursor-not-allowed"
            >
              <Plus size={12} />
              {creating ? "Creating..." : "Create Key"}
            </button>
          )}
        </div>

        {!isPaid ? (
          <div className="text-center py-8">
            <Key size={24} className="mx-auto text-mid-gray mb-3" />
            <p className="text-[14px] text-dark-gray mb-1">
              API keys are available on paid plans
            </p>
            <p className="text-[12px] text-mid-gray">
              Upgrade to access the /credibility endpoint
            </p>
          </div>
        ) : activeKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key size={24} className="mx-auto text-mid-gray mb-3" />
            <p className="text-[14px] text-dark-gray">
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeKeys.map((key) => (
              <ApiKeyRow
                key={key._id}
                apiKey={key}
                isNew={key._id === newKeyId}
              />
            ))}
            {activeKeys.length >= maxKeys && (
              <p className="text-[11px] text-mid-gray text-center pt-2">
                Maximum {maxKeys} active keys
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Start Guide — only show for paid users with keys */}
      {isPaid && activeKeys.length > 0 && (
        <SetupGuide apiKey={activeKeys[0].key} />
      )}
    </div>
  );
}

function UpgradeSelector({
  upgrading,
  onUpgrade,
}: {
  upgrading: boolean;
  onUpgrade: (plan: "pro" | "business", billingCycle: "monthly" | "annual") => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const isAnnual = billing === "annual";

  const prices = {
    pro:      { monthly: 129, annual: 1290 },
    business: { monthly: 339, annual: 3390 },
  };

  const proPrice = isAnnual ? Math.round(prices.pro.annual / 12) : prices.pro.monthly;
  const bizPrice = isAnnual ? Math.round(prices.business.annual / 12) : prices.business.monthly;

  return (
    <div className="mt-4 pt-4 border-t border-warm-gray">
      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center bg-off-white rounded-lg p-0.5">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer",
              !isAnnual ? "bg-white text-black shadow-sm" : "text-dark-gray hover:text-black"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer",
              isAnnual ? "bg-white text-black shadow-sm" : "text-dark-gray hover:text-black"
            )}
          >
            Annual
          </button>
        </div>
        {isAnnual && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
            Save ~17%
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Pro */}
        <div className="rounded-lg border border-warm-gray p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold">Pro</span>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Popular
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-bold">${proPrice}</span>
            <span className="text-[12px] text-dark-gray">TTD/mo</span>
          </div>
          <p className="text-[11px] text-mid-gray mb-3">
            500 checks/mo · 3 API keys · ~${Math.round(proPrice / 6.8)} USD
          </p>
          <button
            onClick={() => onUpgrade("pro", billing)}
            disabled={upgrading}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-tt-red text-force-white px-3 py-2 rounded text-[12px] font-semibold hover:bg-tt-red-deep active:scale-[0.96] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {upgrading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {upgrading ? "Redirecting..." : "Get Pro"}
          </button>
        </div>

        {/* Business */}
        <div className="rounded-lg border border-warm-gray p-4">
          <div className="mb-2">
            <span className="text-[13px] font-bold">Business</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-bold">${bizPrice}</span>
            <span className="text-[12px] text-dark-gray">TTD/mo</span>
          </div>
          <p className="text-[11px] text-mid-gray mb-3">
            2,500 checks/mo · 10 API keys · ~${Math.round(bizPrice / 6.8)} USD
          </p>
          <button
            onClick={() => onUpgrade("business", billing)}
            disabled={upgrading}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 rounded text-[12px] font-semibold hover:bg-charcoal active:scale-[0.96] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {upgrading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {upgrading ? "Redirecting..." : "Get Business"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupGuide({ apiKey }: { apiKey: string }) {
  const maskedKey = apiKey.slice(0, 10) + "••••••••••••";

  return (
    <div className="rounded-lg border border-warm-gray p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray">
          Quick Start
        </h2>
        <a
          href="/docs#credibility"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-dark-gray hover:text-black transition-colors no-underline"
        >
          <BookOpen size={12} />
          Full docs
        </a>
      </div>

      <div className="space-y-5">
        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold shrink-0">
              1
            </span>
            <span className="text-[13px] font-medium">Add your API key</span>
          </div>
          <p className="text-[12px] text-dark-gray ml-7 mb-2">
            Include your key in the <code className="font-mono text-[11px] bg-warm-gray px-1 py-0.5 rounded">X-API-Key</code> header with every request to the <code className="font-mono text-[11px] bg-warm-gray px-1 py-0.5 rounded">/credibility</code> endpoint.
          </p>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold shrink-0">
              2
            </span>
            <span className="text-[13px] font-medium">Make your first request</span>
          </div>
          <div className="ml-7 space-y-3">
            <CodeSnippet
              label="cURL"
              code={`curl -H "X-API-Key: ${maskedKey}" \\
  "${API_BASE}/credibility?name=massy+holdings"`}
            />
            <CodeSnippet
              label="JavaScript"
              code={`const response = await fetch(
  "${API_BASE}/credibility?name=massy+holdings",
  {
    headers: { "X-API-Key": process.env.OVASO_API_KEY },
  }
);
const data = await response.json();
console.log(data.credibility_score);`}
            />
            <CodeSnippet
              label="Python"
              code={`import requests

response = requests.get(
    "${API_BASE}/credibility",
    params={"name": "massy holdings"},
    headers={"X-API-Key": os.environ["OVASO_API_KEY"]},
)
data = response.json()
print(data["credibility_score"])`}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold shrink-0">
              3
            </span>
            <span className="text-[13px] font-medium">Handle the response</span>
          </div>
          <div className="ml-7">
            <div className="bg-off-white rounded-lg p-4 text-[12px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-dark-gray">credibility_score</span>
                <span className="font-mono font-medium">0–100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-gray">is_registered</span>
                <span className="font-mono font-medium">true / false</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-gray">web_presence</span>
                <span className="font-mono font-medium">website, socials, maps</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-gray">score_breakdown</span>
                <span className="font-mono font-medium">registry, web, social, reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important notes */}
        <div className="ml-7 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[12px] text-amber-900 font-medium mb-1">Keep your key safe</p>
          <ul className="text-[12px] text-amber-800 space-y-1 list-disc pl-4">
            <li>Store your API key in environment variables — never commit it to source code</li>
            <li>Each key is rate limited to 15 credibility checks per minute</li>
            <li>Free endpoints (<code className="font-mono text-[11px]">/check</code>, <code className="font-mono text-[11px]">/search</code>, <code className="font-mono text-[11px]">/reservations</code>) don't require a key</li>
          </ul>
        </div>

        {/* AI Setup Prompt */}
        <AiSetupPrompt />
      </div>
    </div>
  );
}

function AiSetupPrompt() {
  const [copied, setCopied] = useState(false);

  const prompt = `Integrate the Ovaso credibility API into my project. Here's everything you need:

## API Details
- Base URL: ${API_BASE}
- Auth: Include header \`X-API-Key: <your-key>\` (store in env var OVASO_API_KEY)
- Endpoint: GET /credibility?name={business_name}
- Rate limit: 15 requests/min

## Response Shape
\`\`\`typescript
interface CredibilityResponse {
  query: string;
  credibility_score: number;           // 0-100
  credibility_label: string;           // "High Credibility" | "Moderate Credibility" | "Low Credibility" | "Very Low Credibility" | "Insufficient Data"
  is_registered: boolean;
  registry_match: {
    company_name: string;
    company_number: string;
    company_identifier: string;
    record_type: string;               // "PROFIT COMPANY" | "PARTNERSHIP/FIRM BUSINESS" | etc.
    record_status: string;             // "ACTIVE" | "STRUCK OFF" | "DISSOLVED" | etc.
    registration_date: string;         // "DD/MM/YYYY"
    street_address: string | null;
    state: string | null;
  } | null;
  web_presence: {
    website_url: string | null;
    website_live: boolean;
    website_ssl: boolean;
    social_media: Record<string, string>;  // e.g. { facebook: "https://...", linkedin: "https://..." }
    has_maps_listing: boolean;
    maps_url: string | null;
    search_results_count: number;
    news_mentions: number;
    review_snippets: Array<{ source: string; text: string }>;
    articles: Array<{ title: string; source: string; snippet: string; url: string }>;
  };
  score_breakdown: {
    registry_score: number;            // max 30
    registry_max: 30;
    web_presence_score: number;        // max 25
    web_presence_max: 25;
    social_media_score: number;        // max 25
    social_media_max: 25;
    reviews_score: number;             // max 20
    reviews_max: 20;
  };
  show_claim_prompt: boolean;          // true when score < 60
  improvement_tips: string[];          // actionable suggestions
  search_powered_by: string;
}
\`\`\`

## Free Endpoints (no API key needed)
- GET /check?name={name} — check if registered, returns exact + similar matches
- GET /search?name={name} — search companies by name
- GET /reservations?name={name} — search name reservations

## Example Request
\`\`\`
fetch(\`${API_BASE}/credibility?name=\${encodeURIComponent(businessName)}\`, {
  headers: { "X-API-Key": process.env.OVASO_API_KEY }
})
\`\`\`

## Error Handling
- 401: Missing or invalid API key
- 422: Name too short (min 2 chars)
- 429: Rate limit exceeded — retry after cooldown
- 502: Upstream registry unavailable

Set up the integration following my project's conventions. Store the API key in an environment variable. Add proper error handling and loading states.`;

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-warm-gray overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-off-white border-b border-warm-gray">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-mid-gray" />
          <span className="text-[11px] font-medium text-mid-gray">AI Setup Prompt</span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-dark-gray hover:text-black bg-white border border-warm-gray rounded transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={10} className="text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy size={10} />
              Copy prompt
            </>
          )}
        </button>
      </div>
      <div className="px-3 py-3">
        <p className="text-[12px] text-dark-gray leading-relaxed">
          Copy this prompt and paste it into Claude, ChatGPT, Cursor, or any AI assistant to instantly set up the Ovaso credibility API in your project. It includes the full response type, all endpoints, auth details, and error codes.
        </p>
      </div>
    </div>
  );
}

function CodeSnippet({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-warm-gray overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-off-white border-b border-warm-gray">
        <span className="text-[11px] font-medium text-mid-gray">{label}</span>
        <button
          onClick={copy}
          className="p-1 text-mid-gray hover:text-black transition-colors cursor-pointer"
          aria-label="Copy"
        >
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="px-3 py-3 text-[12px] font-mono text-charcoal overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <>
      <Navbar />
      {!isLoaded ? (
        <div className="flex items-center justify-center pt-40">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-mid-gray border-t-black" />
        </div>
      ) : !isSignedIn ? (
        <div className="max-w-[720px] mx-auto px-6 pt-40 pb-16 text-center">
          <Key size={32} className="mx-auto text-mid-gray mb-4" />
          <h1 className="text-xl font-bold tracking-tight mb-2">Sign in to access your dashboard</h1>
          <p className="text-[14px] text-dark-gray mb-6">
            Manage your API keys and subscription.
          </p>
          <SignInButton mode="modal">
            <button className="bg-tt-red text-force-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-tt-red-deep active:scale-[0.96] transition-all cursor-pointer">
              Sign in
            </button>
          </SignInButton>
        </div>
      ) : (
        <DashboardContent />
      )}
    </>
  );
}
