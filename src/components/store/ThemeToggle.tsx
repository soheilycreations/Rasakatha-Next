"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "./icons";

const THEME_KEY = "rasakatha:theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    queueMicrotask(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "light" ? "light" : "dark");
    });
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable — theme just won't persist across reloads
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="relative grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink-dim)] transition-colors hover:border-accent/40"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <IconSun
        className="absolute h-[18px] w-[18px] transition-all duration-300 ease-out"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.4)",
        }}
      />
      <IconMoon
        className="absolute h-[18px] w-[18px] transition-all duration-300 ease-out"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.4)" : "rotate(0deg) scale(1)",
        }}
      />
    </button>
  );
}
