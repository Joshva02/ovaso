import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface FlipTextProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function FlipText({
  words,
  interval = 2800,
  className,
}: FlipTextProps) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval]);

  // Measure the widest word to prevent layout shift
  const longestWord = useMemo(
    () => words.reduce((a, b) => (a.length > b.length ? a : b), ""),
    [words]
  );

  return (
    <span
      className={cn("inline-grid items-center", className)}
      style={{ perspective: "600px" }}
    >
      {/* Invisible sizer — reserves space for longest word */}
      <span className="col-start-1 row-start-1 invisible" aria-hidden="true">
        {longestWord}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: "100%", opacity: 0, rotateX: -80 }}
          animate={{ y: "0%", opacity: 1, rotateX: 0 }}
          exit={{ y: "-100%", opacity: 0, rotateX: 80 }}
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="col-start-1 row-start-1 inline-block origin-bottom"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
