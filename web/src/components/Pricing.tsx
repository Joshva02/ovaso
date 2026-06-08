import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.23, 1, 0.32, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.6 },
};

const FREE_FEATURES = [
  "Search registered companies",
  "Check business registration",
  "Search name reservations",
  "No API key required",
  "30 requests/min",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Credibility scoring (0–100)",
  "Web presence discovery",
  "Social media detection",
  "Score breakdown & tips",
  "500 checks/mo",
  "Up to 3 API keys",
];

const BUSINESS_FEATURES = [
  "Everything in Pro",
  "2,500 checks/mo",
  "Up to 10 API keys",
  "30 checks/min rate limit",
  "Priority support",
];

type BillingCycle = "monthly" | "annual";

const PRICES = {
  pro:      { monthly: 129, annual: 1290 },
  business: { monthly: 339, annual: 3390 },
} as const;

function monthlyEquivalent(annual: number) {
  return Math.round(annual / 12 * 100) / 100;
}

export function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const isAnnual = billing === "annual";

  return (
    <section
      id="pricing"
      className="max-w-[1120px] mx-auto px-6 py-16 border-t border-warm-gray"
    >
      <motion.span
        {...fadeUp}
        transition={{ duration: 0.45, ease }}
        className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block"
      >
        Pricing
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.05, ease }}
        className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight mb-1.5"
      >
        Free to start, Pro to score
      </motion.h2>
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.1, ease }}
        className="text-dark-gray text-[15px] mb-8 max-w-[520px]"
      >
        Search and verify businesses for free. Upgrade for credibility
        scoring with full web presence analysis.
      </motion.p>

      {/* Billing toggle */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.12, ease }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="flex items-center bg-off-white rounded-lg p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer",
              !isAnnual
                ? "bg-white text-black shadow-sm"
                : "text-dark-gray hover:text-black"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-4 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer",
              isAnnual
                ? "bg-white text-black shadow-sm"
                : "text-dark-gray hover:text-black"
            )}
          >
            Annual
          </button>
        </div>
        {isAnnual && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            Save ~17%
          </span>
        )}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 max-w-[960px]">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease }}
          className="rounded-lg border border-warm-gray p-6"
        >
          <div className="mb-5">
            <h3 className="text-[15px] font-bold mb-1">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">$0</span>
              <span className="text-dark-gray text-[13px]">forever</span>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-charcoal">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#endpoints"
            className="block text-center text-[13px] font-semibold border-[1.5px] border-mid-gray text-black px-4 py-2.5 rounded hover:border-black active:scale-[0.97] transition-all no-underline"
          >
            Get started
          </a>
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.06, ease }}
          className="rounded-lg border-2 border-black p-6 relative"
        >
          <div className="absolute -top-3 left-5">
            <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded">
              <Zap size={10} />
              Popular
            </span>
          </div>
          <div className="mb-5">
            <h3 className="text-[15px] font-bold mb-1">Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                ${isAnnual ? monthlyEquivalent(PRICES.pro.annual) : PRICES.pro.monthly}
              </span>
              <span className="text-dark-gray text-[13px]">TTD/mo</span>
            </div>
            <p className="text-[12px] text-mid-gray mt-1">
              {isAnnual
                ? `$${PRICES.pro.annual} billed annually (~$${Math.round(PRICES.pro.annual / 6.8)} USD/yr)`
                : `~$${Math.round(PRICES.pro.monthly / 6.8)} USD/mo`
              }
            </p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-charcoal">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to={`/dashboard?upgrade=pro&cycle=${billing}`}
            className="block text-center text-[13px] font-semibold bg-tt-red text-force-white px-4 py-2.5 rounded hover:bg-tt-red-deep active:scale-[0.97] transition-all no-underline"
          >
            Upgrade to Pro
          </Link>
        </motion.div>

        {/* Business */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.12, ease }}
          className="rounded-lg border border-warm-gray p-6"
        >
          <div className="mb-5">
            <h3 className="text-[15px] font-bold mb-1">Business</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">
                ${isAnnual ? monthlyEquivalent(PRICES.business.annual) : PRICES.business.monthly}
              </span>
              <span className="text-dark-gray text-[13px]">TTD/mo</span>
            </div>
            <p className="text-[12px] text-mid-gray mt-1">
              {isAnnual
                ? `$${PRICES.business.annual} billed annually (~$${Math.round(PRICES.business.annual / 6.8)} USD/yr)`
                : `~$${Math.round(PRICES.business.monthly / 6.8)} USD/mo`
              }
            </p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {BUSINESS_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-charcoal">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to={`/dashboard?upgrade=business&cycle=${billing}`}
            className="block text-center text-[13px] font-semibold bg-black text-white px-4 py-2.5 rounded hover:bg-charcoal active:scale-[0.97] transition-all no-underline"
          >
            Upgrade to Business
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
