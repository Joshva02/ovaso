import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContext {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeCtx = createContext<ThemeContext>({
  theme: "system",
  setTheme: () => {},
});

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored ?? "system";
  });

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
