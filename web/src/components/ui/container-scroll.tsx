import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContainerScroll({
  titleComponent,
  children,
  className,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scaleDimensions = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.4]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="sticky top-20 mb-12">{titleComponent}</div>
      <motion.div
        style={{
          scale: scaleDimensions,
          rotateX: rotate,
          y: translateY,
          opacity,
        }}
        className="w-full origin-top"
      >
        {children}
      </motion.div>
    </div>
  );
}
