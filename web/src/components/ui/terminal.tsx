import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  commands: string[];
  outputs?: Record<number, string[]>;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  className?: string;
}

export function Terminal({
  commands,
  outputs = {},
  typingSpeed = 40,
  delayBetweenCommands = 600,
  className,
}: TerminalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [lines, setLines] = useState<
    { type: "command" | "output"; text: string; typing?: boolean }[]
  >([]);
  const [currentChar, setCurrentChar] = useState("");

  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;

    async function animate() {
      for (let i = 0; i < commands.length; i++) {
        if (cancelled) return;

        // Type the command character by character
        const cmd = commands[i];
        for (let c = 0; c <= cmd.length; c++) {
          if (cancelled) return;
          setCurrentChar(cmd.slice(0, c));
          await sleep(typingSpeed);
        }

        // Add completed command
        setLines((prev) => [...prev, { type: "command", text: cmd }]);
        setCurrentChar("");

        // Add outputs
        const cmdOutputs = outputs[i];
        if (cmdOutputs) {
          await sleep(200);
          for (const line of cmdOutputs) {
            if (cancelled) return;
            setLines((prev) => [...prev, { type: "output", text: line }]);
            await sleep(80);
          }
        }

        if (i < commands.length - 1) {
          await sleep(delayBetweenCommands);
        }
      }
    }

    animate();
    return () => {
      cancelled = true;
    };
  }, [isInView, commands, outputs, typingSpeed, delayBetweenCommands]);

  return (
    <div
      ref={ref}
      className={cn(
        "w-full rounded-lg overflow-hidden bg-[#141310] border border-[#2c2a26] shadow-2xl",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 h-10 bg-[#1e1c18]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#3d3b37]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#3d3b37]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#3d3b37]" />
        <span className="ml-2 text-[11px] text-[#b0ada6] font-mono">
          terminal
        </span>
      </div>

      {/* Body */}
      <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[200px] overflow-auto max-h-[400px]">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            {line.type === "command" ? (
              <>
                <span className="text-tt-red mr-2 select-none">$</span>
                <span className="text-[#d4d0c8]">
                  {highlightCommand(line.text)}
                </span>
              </>
            ) : (
              <span className="text-[#6b6760] pl-4">{line.text}</span>
            )}
          </div>
        ))}

        {/* Currently typing line */}
        {currentChar !== "" && (
          <div className="flex">
            <span className="text-tt-red mr-2 select-none">$</span>
            <span className="text-[#d4d0c8]">
              {highlightCommand(currentChar)}
            </span>
            <motion.span
              className="w-[7px] h-[16px] bg-tt-red inline-block ml-px"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </div>
        )}

        {/* Idle cursor */}
        {currentChar === "" && lines.length > 0 && (
          <div className="flex mt-1">
            <span className="text-tt-red mr-2 select-none">$</span>
            <motion.span
              className="w-[7px] h-[16px] bg-tt-red/60 inline-block"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function highlightCommand(text: string) {
  // Simple syntax highlighting for curl commands
  return text.split(" ").map((word, i) => {
    if (i === 0)
      return (
        <span key={i} className="text-[#fafafa] font-medium">
          {word}{" "}
        </span>
      );
    if (word.startsWith('"') || word.startsWith("'"))
      return (
        <span key={i} className="text-tt-red">
          {word}{" "}
        </span>
      );
    if (word.startsWith("-"))
      return (
        <span key={i} className="text-[#b0ada6]">
          {word}{" "}
        </span>
      );
    return (
      <span key={i}>
        {word}{" "}
      </span>
    );
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
