import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "@/components/Logo";
import { Sun, Moon, Monitor } from "lucide-react";

const NAV_LINKS = [
  { label: "Endpoints", href: "#endpoints" },
  { label: "Playground", href: "#playground" },
  { label: "Setup", href: "#setup" },
];

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

const THEME_CYCLE = ["light", "dark", "system"] as const;
const THEME_ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const onScroll = useCallback(() => setScrolled(window.scrollY > 16), []);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const ThemeIcon = THEME_ICON[theme];

  return (
    <nav
      className={cn(
        "fixed top-9 left-0 right-0 z-50 bg-white/92 backdrop-blur-xl border-b transition-[border-color,box-shadow] duration-300",
        scrolled
          ? "border-warm-gray shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
          : "border-transparent"
      )}
    >
      <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-black no-underline">
          <Logo className="h-7 w-7" />
          <span className="font-bold text-sm tracking-tight">Ovaso</span>
        </Link>
        <div className="flex items-center gap-5">
          {isHome &&
            NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => smoothScroll(e, link.href)}
                className="text-dark-gray hover:text-black text-[13px] font-medium transition-colors no-underline hidden sm:block"
              >
                {link.label}
              </a>
            ))}
          <Link
            to="/docs"
            className={cn(
              "text-[13px] font-medium transition-colors no-underline hidden sm:block",
              location.pathname === "/docs"
                ? "text-black"
                : "text-dark-gray hover:text-black"
            )}
          >
            Docs
          </Link>
          <Link
            to="/changelog"
            className={cn(
              "text-[13px] font-medium transition-colors no-underline hidden sm:block",
              location.pathname === "/changelog"
                ? "text-black"
                : "text-dark-gray hover:text-black"
            )}
          >
            Changelog
          </Link>
          <button
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}`}
            className="p-1.5 text-dark-gray hover:text-black transition-colors cursor-pointer"
          >
            <ThemeIcon size={15} strokeWidth={2} />
          </button>
          <a
            href="https://github.com/Joshva02/ovaso"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-charcoal active:scale-[0.96] transition-all no-underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
