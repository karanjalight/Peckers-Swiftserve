"use client";

import Link from "next/link";

export function MrLoginNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/80">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
          aria-label="Peckers Services – Home"
        >
          <img
            src="/logo.png"
            alt="Peckers Services Logo"
            className="h-9 w-auto sm:h-10"
          />
        </Link>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm">
          Field sign-in
        </span>
      </div>
    </nav>
  );
}
