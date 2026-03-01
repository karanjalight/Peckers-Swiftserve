"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  History,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/mr/dashboard", icon: LayoutDashboard },
  { label: "Pharmacies", href: "/mr/pharmacies", icon: MapPin },
  { label: "History", href: "/mr/history", icon: History },
  { label: "Reports", href: "/mr/reports", icon: FileBarChart },
] as const;

export function MrBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Bottom navigation"
    >
      {/* Rounded top bar: light bg + shadow / dark bg + subtle border glow */}
      <div
        className={cn(
          "rounded-t-2xl border-t border-slate-200",
          "bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
          "dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
        )}
      >
        <div
          className="flex items-stretch justify-around px-1 pt-2 pb-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== "/mr/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl py-2 px-2 transition-colors",
                  "active:bg-slate-100/80 dark:active:bg-slate-800/80",
                  isActive
                    ? "text-[#1e3a5f] dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active indicator bar above icon */}
                <span
                  className={cn(
                    "h-1 w-7 rounded-full transition-colors",
                    isActive
                      ? "bg-[#1e3a5f] dark:bg-blue-400"
                      : "bg-transparent"
                  )}
                  aria-hidden
                />
                <item.icon
                  className={cn(
                    "size-6 shrink-0 transition-colors",
                    isActive && "stroke-[2.5]"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight truncate max-w-[72px]",
                    isActive
                      ? "text-[#1e3a5f] dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
