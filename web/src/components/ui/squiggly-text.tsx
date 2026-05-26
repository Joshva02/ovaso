import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SquigglyTextProps {
  children: React.ReactNode;
  steps?: number;
  stepDuration?: number;
  scale?: number | [number, number];
  baseFrequency?: number;
  numOctaves?: number;
  className?: string;
}

export function SquigglyText({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [6, 8],
  baseFrequency = 0.02,
  numOctaves = 3,
  className,
}: SquigglyTextProps) {
  const id = useId();
  const [step, setStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const seeds = useMemo(
    () => Array.from({ length: steps }, (_, i) => i * 10 + 1),
    [steps]
  );

  const scaleValue = Array.isArray(scale)
    ? scale[step % scale.length]
    : scale;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep((s) => (s + 1) % steps);
    }, stepDuration);
    return () => clearInterval(intervalRef.current);
  }, [steps, stepDuration]);

  const filterId = `squiggly-${id}-${step}`;

  return (
    <>
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="turbulence"
              baseFrequency={baseFrequency}
              numOctaves={numOctaves}
              seed={seeds[step]}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={scaleValue}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span
        className={cn("inline-block", className)}
        style={{ filter: `url(#${filterId})` }}
      >
        {children}
      </span>
    </>
  );
}
