"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "mr-theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
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
        className="h-8 w-14 shrink-0 rounded-full bg-slate-900/80 p-1 dark:bg-slate-800"
        aria-hidden
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
          <Sun className="size-3.5 text-amber-500" />
        </span>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-slate-200/80 bg-slate-900 p-1 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800"
      )}
    >
      <span
        className={cn(
          "pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="size-3.5 text-slate-700" />
        ) : (
          <Sun className="size-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
