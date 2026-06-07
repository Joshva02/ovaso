import { Terminal } from "./ui/terminal";
import { API_BASE } from "@/utils/config";

const COMMANDS = [
  `curl "${API_BASE}/credibility?name=massy+holdings"`,
  `curl "${API_BASE}/check?name=guardian+holdings+limited"`,
  `curl "${API_BASE}/search?name=massy"`,
  `curl "${API_BASE}/reservations?name=island"`,
];

const OUTPUTS: Record<number, string[]> = {
  0: [
    '{ "credibility_score": 78, "credibility_label": "Moderate Credibility", "is_registered": true, ... }',
  ],
  1: [
    '{ "is_registered": true, "exact_matches": [{ "company_name": "GUARDIAN HOLDINGS LIMITED", ... }] }',
  ],
  2: [
    '{ "total_results": 24, "companies": [{ "company_name": "MASSY HOLDINGS LTD.", ... }] }',
  ],
  3: [
    '{ "total_results": 12, "reservations": [{ "proposed_name": "ISLAND BREEZE VENTURES LTD", ... }] }',
  ],
};

export function QuickStart() {
  return (
    <section className="max-w-[1120px] mx-auto px-6 pb-16">
      <Terminal
        commands={COMMANDS}
        outputs={OUTPUTS}
        typingSpeed={25}
        delayBetweenCommands={800}
      />
    </section>
  );
}
