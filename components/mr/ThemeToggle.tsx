"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "mr-theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setThemeState(initial);
    apply(initial);
  }, []);

  function apply(next: "light" | "dark") {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  if (!mounted) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-1 border-slate-500 bg-slate-50 dark:border-slate-600 dark:bg-slate-700"
        aria-hidden
      >
        <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-1 border-slate-500 bg-slate-50 text-slate-800 -sm transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:hover:border-slate-400 dark:hover:bg-slate-600"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
