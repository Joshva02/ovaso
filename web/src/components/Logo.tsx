import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-black", className)}
    >
      <path d="M 22 100 L 61 32.5 L 139 32.5" stroke="currentColor" strokeWidth="9" />
      <path d="M 139 167.5 L 61 167.5 L 22 100" stroke="currentColor" strokeWidth="9" />
      <path d="M 139 32.5 L 178 100 L 139 167.5" stroke="#DC2626" strokeWidth="9" />
      <path d="M 82 70 Q 72 70 72 80 L 72 92 Q 72 100 64 100 Q 72 100 72 108 L 72 120 Q 72 130 82 130" stroke="currentColor" strokeWidth="7" />
      <path d="M 118 70 Q 128 70 128 80 L 128 92 Q 128 100 136 100 Q 128 100 128 108 L 128 120 Q 128 130 118 130" stroke="currentColor" strokeWidth="7" />
      <line x1="88" y1="93" x2="112" y2="93" stroke="currentColor" strokeWidth="7" />
      <line x1="88" y1="107" x2="112" y2="107" stroke="#DC2626" strokeWidth="7" />
    </svg>
  );
}
