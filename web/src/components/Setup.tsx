import { motion } from "motion/react";
import { CodeBlock } from "./ui/code-block";
import { API_BASE } from "@/utils/config";

const ease = [0.23, 1, 0.32, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.6 },
};

const USAGE_JS = `// JavaScript / TypeScript
const response = await fetch(
  "${API_BASE}/check?name=guardian+holdings+limited"
);
const data = await response.json();

if (data.is_registered) {
  console.log("Business is registered:", data.exact_matches[0]);
} else {
  console.log("No exact match found");
}`;

const USAGE_PYTHON = `# Python
import requests

response = requests.get(
    "${API_BASE}/check",
    params={"name": "guardian holdings limited"}
)
data = response.json()

if data["is_registered"]:
    print("Registered:", data["exact_matches"][0]["company_name"])`;

const USAGE_CURL = `# cURL
curl "${API_BASE}/check?name=guardian+holdings+limited"

# Search all companies matching a name
curl "${API_BASE}/search?name=massy"

# Check name reservations
curl "${API_BASE}/reservations?name=island"`;

export function Setup() {
  return (
    <section
      id="setup"
      className="max-w-[1120px] mx-auto px-6 py-16 border-t border-warm-gray"
    >
      <motion.span
        {...fadeUp}
        transition={{ duration: 0.45, ease }}
        className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block"
      >
        Integration
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.05, ease }}
        className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight mb-1.5"
      >
        Start using the API
      </motion.h2>
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.1, ease }}
        className="text-dark-gray text-[15px] mb-10 max-w-[520px]"
      >
        Free endpoints work instantly — no sign-up needed. For credibility
        scoring, grab a Pro API key from your{" "}
        <a href="/dashboard" className="text-tt-red hover:underline no-underline">
          dashboard
        </a>.
      </motion.p>

      <div className="space-y-4">
        {[
          { code: USAGE_JS, language: "javascript" as const, filename: "example.ts" },
          { code: USAGE_PYTHON, language: "python" as const, filename: "example.py" },
          { code: USAGE_CURL, language: "bash" as const, filename: "Terminal" },
        ].map((block, i) => (
          <motion.div
            key={block.filename}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
          >
            <CodeBlock code={block.code} language={block.language} filename={block.filename} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
