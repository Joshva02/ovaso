import { motion } from "motion/react";
import { EndpointCard } from "./EndpointCard";
import { ENDPOINTS } from "@/utils/constants";

const ease = [0.23, 1, 0.32, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.6 },
};

export function Endpoints() {
  return (
    <section id="endpoints" className="max-w-[1120px] mx-auto px-6 py-16 border-t border-warm-gray">
      <motion.span
        {...fadeUp}
        transition={{ duration: 0.45, ease }}
        className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block"
      >
        Reference
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.05, ease }}
        className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight mb-1.5"
      >
        Endpoints
      </motion.h2>
      <motion.p
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.1, ease }}
        className="text-dark-gray text-[15px] mb-10 max-w-[520px]"
      >
        All endpoints are public GET requests returning JSON. Base URL:{" "}
        <code className="font-mono text-sm text-black bg-off-white px-1.5 py-0.5 rounded">
          https://ovaso.vercel.app
        </code>
      </motion.p>

      {ENDPOINTS.map((ep, i) => (
        <motion.div
          key={ep.path}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: i * 0.06, ease }}
        >
          <EndpointCard
            method={ep.method}
            path={ep.path}
            description={ep.description}
            detail={ep.detail}
            params={ep.params}
            request={ep.request}
            response={ep.response}
            fields={ep.fields}
            defaultOpen={i === 0}
          />
        </motion.div>
      ))}
    </section>
  );
}
