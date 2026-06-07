import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApiPlayground } from "@/hooks/useApiPlayground";
import { CodeBlock } from "./ui/code-block";
import { CredibilityReport } from "./CredibilityReport";
import { Loader2, Send, Braces, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.23, 1, 0.32, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.6 },
};

type ViewMode = "report" | "json";

export function Playground() {
  const { endpoint, query, result, loading, error, setEndpoint, setQuery, execute } =
    useApiPlayground();
  const [viewMode, setViewMode] = useState<ViewMode>("report");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute();
  };

  const isCredibility = endpoint === "/credibility";
  const parsedCredibility = (() => {
    if (!result || !isCredibility) return null;
    try {
      const parsed = JSON.parse(result);
      if ("credibility_score" in parsed) return parsed;
    } catch { /* not valid credibility JSON */ }
    return null;
  })();

  return (
    <section
      id="playground"
      className="max-w-[1120px] mx-auto px-6 py-16 border-t border-warm-gray"
    >
      <motion.span
        {...fadeUp}
        transition={{ duration: 0.45, ease }}
        className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block"
      >
        Interactive
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.05, ease }}
        className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight mb-1.5"
      >
        Try it live
      </motion.h2>
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.1, ease }}
        className="text-dark-gray text-[15px] mb-10 max-w-[520px]"
      >
        Test the API directly from your browser. First request may take
        ~30s if the server is waking up.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, delay: 0.12, ease }}
        className="rounded-lg border border-warm-gray overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-warm-gray font-bold text-sm">
          Make a request
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap sm:flex-nowrap">
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value as "/credibility" | "/check" | "/search" | "/reservations")}
              className="font-mono text-sm font-medium px-3 py-2.5 border-[1.5px] border-mid-gray rounded bg-white outline-none focus:border-black transition-colors cursor-pointer"
            >
              <option value="/credibility">/credibility</option>
              <option value="/check">/check</option>
              <option value="/search">/search</option>
              <option value="/reservations">/reservations</option>
            </select>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a business name..."
              className="flex-1 min-w-0 text-sm px-3 py-2.5 border-[1.5px] border-mid-gray rounded outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="inline-flex items-center gap-2 bg-tt-red text-force-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-tt-red-deep active:scale-[0.97] transition-all disabled:bg-mid-gray disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send
                </>
              )}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease }}
                className="text-sm text-tt-red bg-tt-red-light rounded px-4 py-3 mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={`${result}-${viewMode}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                {/* View toggle for credibility responses */}
                {parsedCredibility && (
                  <div className="flex items-center gap-1 mb-4 bg-off-white rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setViewMode("report")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer",
                        viewMode === "report"
                          ? "bg-white text-black shadow-sm"
                          : "text-dark-gray hover:text-black"
                      )}
                    >
                      <FileText size={13} />
                      Report
                    </button>
                    <button
                      onClick={() => setViewMode("json")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all cursor-pointer",
                        viewMode === "json"
                          ? "bg-white text-black shadow-sm"
                          : "text-dark-gray hover:text-black"
                      )}
                    >
                      <Braces size={13} />
                      JSON
                    </button>
                  </div>
                )}

                {parsedCredibility && viewMode === "report" ? (
                  <CredibilityReport data={parsedCredibility} />
                ) : (
                  <CodeBlock
                    code={result}
                    language="json"
                    filename="Response"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
