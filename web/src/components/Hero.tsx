import { motion } from "motion/react";
import { FlipText } from "./ui/flip-text";
import { SquigglyText } from "./ui/squiggly-text";
import { ArrowDown } from "lucide-react";

const FLIP_WORDS = ["registered", "incorporated", "reserved", "active"];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function Hero() {
  return (
    <section className="pt-36 pb-20 px-6 max-w-[1120px] mx-auto">
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase text-tt-red mb-6"
      >
        <span className="w-6 h-0.5 bg-tt-red" />
        Open Source API
      </motion.div>

      <motion.h1
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-[clamp(2.4rem,5vw,4rem)] font-bold tracking-tighter leading-[1.15] max-w-[720px]"
      >
        Check if a business is{" "}
        <FlipText words={FLIP_WORDS} className="text-tt-red" />
        <br />
        in{" "}
        <SquigglyText
          scale={[3, 5]}
          stepDuration={120}
          className="text-tt-red"
        >
          Trinidad
        </SquigglyText>
        {" & "}
        <SquigglyText
          scale={[3, 5]}
          stepDuration={120}
          className="text-tt-red"
        >
          Tobago.
        </SquigglyText>
      </motion.h1>

      <motion.p
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="mt-5 text-lg text-dark-gray max-w-[480px] leading-relaxed"
      >
        A free, public REST API to verify businesses against the Registrar
        General's Department. No API key required — just fetch.
      </motion.p>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-8 flex gap-3 items-center"
      >
        <a
          href="#endpoints"
          onClick={(e) => smoothScroll(e, "#endpoints")}
          className="inline-flex items-center gap-2 bg-tt-red text-force-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-tt-red-deep active:scale-[0.97] transition-all no-underline"
        >
          View endpoints
          <ArrowDown size={14} />
        </a>
        <a
          href="#playground"
          onClick={(e) => smoothScroll(e, "#playground")}
          className="inline-flex items-center gap-2 border-[1.5px] border-mid-gray text-black px-5 py-2.5 rounded text-sm font-semibold hover:border-black active:scale-[0.97] transition-all no-underline"
        >
          Try it live
        </a>
      </motion.div>
    </section>
  );
}
