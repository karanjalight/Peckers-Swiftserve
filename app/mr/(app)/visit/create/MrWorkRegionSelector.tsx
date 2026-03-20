"use client";

import { useEffect, useState } from "react";
import { MR_REGIONS } from "@/lib/mr/constants";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

const STORAGE_KEY = "mr_work_region";
const DATE_KEY = "mr_work_region_date";

function getStoredRegion(): string {
  if (typeof window === "undefined") return "";
  try {
    const date = localStorage.getItem(DATE_KEY);
    const today = new Date().toDateString();
    if (date !== today) return "";
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setStoredRegion(region: string) {
  try {
    if (region) {
      localStorage.setItem(STORAGE_KEY, region);
      localStorage.setItem(DATE_KEY, new Date().toDateString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DATE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function MrWorkRegionSelector({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (region: string) => void;
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredRegion();
    if (stored && !value) onChange(stored);
  }, [onChange, value]);

  const handleChange = (region: string) => {
    setStoredRegion(region);
    onChange(region);
  };

  if (!mounted) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <Label className={`flex items-center gap-1.5 text-slate-700 dark:text-slate-200 ${compact ? "text-xs" : ""}`}>
        <MapPin className="h-3.5 w-3.5" />
        Region of work today
      </Label>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-3 text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80 ${compact ? "h-9 text-xs" : "h-11 text-sm"}`}
      >
        <option value="">Select region</option>
        {MR_REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

export { getStoredRegion, setStoredRegion };
