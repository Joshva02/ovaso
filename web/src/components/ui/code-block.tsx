import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  highlightLines?: number[];
}

export function CodeBlock({
  code,
  language = "json",
  filename,
  className,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn("rounded-lg overflow-hidden bg-[#141310] border border-[#2c2a26]", className)}
    >
      {filename && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1c18] border-b border-[#2c2a26]">
          <span className="text-[11px] font-mono font-medium text-[#b0ada6] tracking-wide uppercase">
            {filename}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-[#b0ada6] hover:text-[#e8e6e1] transition-colors font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={12} /> Copied
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          customStyle={{
            background: "transparent",
            padding: 0,
            margin: 0,
            fontSize: "13px",
            lineHeight: "1.7",
          }}
          wrapLines
          lineProps={(lineNumber) => ({
            style: highlightLines.includes(lineNumber)
              ? { background: "rgba(200, 16, 46, 0.12)" }
              : {},
          })}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
