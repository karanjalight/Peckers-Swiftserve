"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

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

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 text-slate-700">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      {mrOptions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-mr" className="text-xs font-medium text-slate-500">
            MR
          </label>
          <select
            id="filter-mr"
            value={initial.mrId ?? ""}
            onChange={(e) => updateParams({ mrId: e.target.value || undefined })}
            className="h-9 min-w-[160px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All MRs</option>
            {mrOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {regionOptions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-region" className="text-xs font-medium text-slate-500">
            Region
          </label>
          <select
            id="filter-region"
            value={initial.region ?? ""}
            onChange={(e) =>
              updateParams({ region: e.target.value || undefined })
            }
            className="h-9 min-w-[140px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All regions</option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          id="filter-status"
          value={initial.status ?? ""}
          onChange={(e) =>
            updateParams({ status: e.target.value || undefined })
          }
          className="h-9 min-w-[120px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-dateFrom" className="text-xs font-medium text-slate-500">
          From date
        </label>
        <input
          id="filter-dateFrom"
          type="date"
          value={initial.dateFrom ?? ""}
          onChange={(e) =>
            updateParams({ dateFrom: e.target.value || undefined })
          }
          className="h-9 min-w-[140px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-dateTo" className="text-xs font-medium text-slate-500">
          To date
        </label>
        <input
          id="filter-dateTo"
          type="date"
          value={initial.dateTo ?? ""}
          onChange={(e) =>
            updateParams({ dateTo: e.target.value || undefined })
          }
          className="h-9 min-w-[140px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 gap-1.5 text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
