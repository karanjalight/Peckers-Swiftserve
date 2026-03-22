"use client";

import { motion } from "framer-motion";
import { CircleDollarSign, Package, Percent, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function LogSalesSummaryPanel({
  totalAmount,
  productCount,
  lineCount,
  estimatedCommission,
  submitting,
  onSubmit,
  onSaveDraft,
  className,
}: {
  totalAmount: number;
  productCount: number;
  lineCount: number;
  estimatedCommission: number;
  submitting: boolean;
  onSubmit: () => void;
  onSaveDraft: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={cn(
        "flex flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-950/80 dark:ring-white/[0.05]",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Summary
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">This submission</h2>

      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50/90 px-4 py-3 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <CircleDollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium">Total sales</span>
          </div>
          <span className="text-right text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            KES {totalAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Package className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Products</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">{productCount}</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{lineCount} line{lineCount === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100/90">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">Est. commission</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
              KES {estimatedCommission.toLocaleString()}
            </span>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/70">Policy rate (demo)</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 bg-slate-200/80 dark:bg-slate-800" />

      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="h-11 rounded-xl bg-emerald-600 text-sm font-semibold shadow-md shadow-emerald-900/15 transition hover:bg-emerald-700"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {submitting ? "Submitting…" : "Submit sales"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          className="h-11 rounded-xl border-slate-200/90 text-sm font-medium dark:border-slate-700"
        >
          Save draft
        </Button>
      </div>
    </motion.div>
  );
}
