"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 999_999,
  disabled,
  label,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
      ) : null}
      <div className="flex h-10 items-stretch overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || value <= min}
          onClick={dec}
          className="h-full w-10 shrink-0 rounded-none border-r border-slate-200/80 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={min}
          max={max}
          disabled={disabled}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = parseInt(raw, 10);
            if (Number.isNaN(n)) return;
            onChange(Math.min(max, Math.max(min, n)));
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || value >= max}
          onClick={inc}
          className="h-full w-10 shrink-0 rounded-none border-l border-slate-200/80 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
