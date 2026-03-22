"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogProduct } from "./ProductCombobox";
import { ProductCombobox } from "./ProductCombobox";
import { QuantityStepper } from "./QuantityStepper";

export type SaleLine = {
  id: string;
  productId: string;
  quantityOrdered: number;
  bonusQuantity: number;
  unitPrice: number;
};

export type LineFieldErrors = {
  product?: string;
  quantity?: string;
  price?: string;
};

export function SaleLineCard({
  line,
  catalog,
  index,
  errors,
  onProductChange,
  onQuantityChange,
  onBonusChange,
  onUnitPriceChange,
  onRemove,
}: {
  line: SaleLine;
  catalog: CatalogProduct[];
  index: number;
  errors: LineFieldErrors;
  onProductChange: (productId: string, defaultPrice: number) => void;
  onQuantityChange: (n: number) => void;
  onBonusChange: (n: number) => void;
  onUnitPriceChange: (value: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = line.quantityOrdered * (Number.isFinite(line.unitPrice) ? line.unitPrice : 0);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-none dark:ring-white/[0.04]",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Sale {index + 1}
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Line item</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          aria-label="Remove sale line"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="sm:col-span-2 lg:col-span-5">
          <Label className="mb-1.5 text-xs text-slate-600 dark:text-slate-400">Product</Label>
          <ProductCombobox
            products={catalog}
            value={line.productId}
            onChange={onProductChange}
            error={errors.product}
          />
        </div>
        <div className="lg:col-span-2">
          <QuantityStepper label="Quantity" value={line.quantityOrdered} onChange={onQuantityChange} />
          {errors.quantity ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.quantity}</p>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <QuantityStepper label="Bonus qty" value={line.bonusQuantity} onChange={onBonusChange} />
        </div>
        <div className="lg:col-span-2">
          <Label className="mb-1.5 text-xs text-slate-600 dark:text-slate-400">Unit price (KES)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={line.unitPrice}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              onUnitPriceChange(Number.isNaN(n) ? 0 : Math.max(0, n));
            }}
            className={cn(
              "h-11 rounded-xl border-slate-200/90 text-sm tabular-nums shadow-sm dark:border-slate-700",
              errors.price && "border-red-300 dark:border-red-900",
            )}
          />
          {errors.price ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.price}</p>
          ) : null}
        </div>
        <div className="flex flex-col justify-end rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/50 lg:col-span-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total
          </p>
          <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {line.productId ? `KES ${lineTotal.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
