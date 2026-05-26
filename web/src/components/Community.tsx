import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { motion } from "motion/react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.6 },
};

function GitHubStarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1.25l1.85 3.75 4.15.6-3 2.93.71 4.12L8 10.63l-3.71 1.95.71-4.12-3-2.93 4.15-.6L8 1.25z" />
    </svg>
  );
}

export function Community() {
  return (
    <section className="max-w-[1120px] mx-auto px-6 py-16 border-t border-warm-gray">
      <div className="max-w-xl">
        <motion.span
          {...fadeUp}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="text-[11px] font-bold tracking-[0.1em] uppercase text-tt-red mb-3 block"
        >
          Open Source
        </motion.span>

        <motion.p
          {...fadeUp}
          transition={{
            duration: 0.45,
            delay: 0.06,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="text-[clamp(1.25rem,2.5vw,1.65rem)] font-semibold tracking-tight text-charcoal leading-snug"
        >
          If Ovaso saved you time,{" "}
          <PointerHighlight
            containerClassName="inline-block align-baseline"
            rectangleClassName="border-tt-red"
            pointerClassName="text-tt-red"
          >
            <a
              href="https://github.com/Joshva02/company-registry-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-tt-red hover:text-tt-red-deep transition-colors duration-150 no-underline px-1.5 py-0.5"
            >
              <GitHubStarIcon className="w-[1em] h-[1em] shrink-0 translate-y-[-0.5px]" />
              leave a star on GitHub
            </a>
          </PointerHighlight>
        </motion.p>

        <motion.p
          {...fadeUp}
          transition={{
            duration: 0.45,
            delay: 0.12,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="text-dark-gray text-[15px] mt-4 leading-relaxed max-w-md"
        >
          Building something with the API? Tag{" "}
          <a
            href="https://github.com/Joshva02"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tt-red hover:text-tt-red-deep transition-colors duration-150 no-underline font-medium"
          >
            @Joshva02
          </a>{" "}
          — would love to see what you make.
        </motion.p>
      </div>
    </section>
  );
}
