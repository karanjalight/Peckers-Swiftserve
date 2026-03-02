"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Target,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type MrOption = { id: string; full_name: string };

interface MrHistoryFiltersProps {
  mrOptions: MrOption[];
  regionOptions: string[];
  role: "MR" | "MANAGER" | "ADMIN";
  initial: {
    mrId?: string;
    region?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function MrHistoryFilters({
  mrOptions,
  regionOptions,
  role,
  initial,
}: MrHistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasFilters =
    initial.mrId ||
    initial.region ||
    initial.status ||
    initial.dateFrom ||
    initial.dateTo;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      });
      router.push(`/mr/history?${next.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/mr/history");
  }, [router]);

  const isManagerOrAdmin = role === "MANAGER" || role === "ADMIN";

  if (!isManagerOrAdmin) return null;

  const currentRange: DateRange | undefined = useMemo(() => {
    const from = initial.dateFrom ? new Date(initial.dateFrom) : undefined;
    const to = initial.dateTo ? new Date(initial.dateTo) : undefined;
    if (!from && !to) return undefined;
    return { from, to };
  }, [initial.dateFrom, initial.dateTo]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* MR filter card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-slate-900 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10" />
          <div className="relative flex items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
                MR
              </p>
              <p className="mt-1 text-sm text-slate-700">Filter by field rep</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="relative px-4 pb-3 pt-2">
            {mrOptions.length > 0 ? (
              <select
                id="filter-mr"
                value={initial.mrId ?? ""}
                onChange={(e) =>
                  updateParams({ mrId: e.target.value || undefined })
                }
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All MRs</option>
                {mrOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500">No MR options</p>
            )}
          </div>
        </div>

        {/* Region filter card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-slate-900 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/60" />
          <div className="relative flex items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                Region
              </p>
              <p className="mt-1 text-sm text-slate-700">Narrow by territory</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="relative px-4 pb-3 pt-2">
            {regionOptions.length > 0 ? (
              <select
                id="filter-region"
                value={initial.region ?? ""}
                onChange={(e) =>
                  updateParams({ region: e.target.value || undefined })
                }
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">All regions</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500">No region options</p>
            )}
          </div>
        </div>

        {/* Status filter card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#eef2ff] to-[#e0f2fe] text-slate-900 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-400/20" />
          <div className="relative flex items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
                Status
              </p>
              <p className="mt-1 text-sm text-slate-700">Open vs submitted</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="relative px-4 pb-3 pt-2">
            <select
              id="filter-status"
              value={initial.status ?? ""}
              onChange={(e) =>
                updateParams({ status: e.target.value || undefined })
              }
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </div>
        </div>

        {/* Date range filter card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#fef3c7] to-[#fffbeb] text-slate-900 shadow-sm">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-200/70" />
          <div className="relative flex items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Date range
              </p>
              <p className="mt-1 text-sm text-slate-800">
                Filter by check-in date
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="relative px-4 pb-3 pt-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-full border border-amber-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-amber-50/40 dark:border-amber-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <CalendarIcon className="h-4 w-4 text-amber-700" />
                  <span className="whitespace-nowrap">
                    {currentRange?.from && currentRange?.to
                      ? `${format(currentRange.from, "dd MMM yyyy")} → ${format(
                          currentRange.to,
                          "dd MMM yyyy"
                        )}`
                      : "All dates"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={currentRange}
                  onSelect={(range) => {
                    const from = range?.from
                      ? format(range.from, "yyyy-MM-dd")
                      : undefined;
                    const to = range?.to
                      ? format(range.to, "yyyy-MM-dd")
                      : undefined;
                    updateParams({ dateFrom: from, dateTo: to });
                  }}
                />
                <div className="mt-3 flex justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Filter visits by check-in date.
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() =>
                      updateParams({ dateFrom: undefined, dateTo: undefined })
                    }
                  >
                    Clear
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {hasFilters && (
        <Button
          type="button"
          size="sm"
          onClick={clearFilters}
          className="h-9 gap-1.5 rounded-full py-4  text-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}
