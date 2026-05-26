import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-warm-gray p-6 transition-all duration-200",
        "hover:border-mid-gray hover:shadow-sm",
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-3",
        rowSpan === 2 && "md:row-span-2",
        className
      )}
    >
      {children}
    </div>
  );
}
