import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] bg-tt-red text-white overflow-hidden"
        >
          <div className="max-w-[1120px] mx-auto px-6 h-9 flex items-center justify-center text-[13px] font-medium relative">
            <Link
              to="/changelog"
              className="inline-flex items-center gap-2 text-force-white no-underline hover:opacity-90 transition-opacity"
            >
              <span className="bg-white/20 text-force-white text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded">
                New
              </span>
              <span className="font-bold text-force-white">Ovaso v1.1</span>
              <span className="hidden sm:inline font-medium text-force-white">
                — Business Credibility Scoring is here
              </span>
              <ArrowRight size={13} className="opacity-80" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="absolute right-4 p-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useBannerVisible() {
  return true;
}
