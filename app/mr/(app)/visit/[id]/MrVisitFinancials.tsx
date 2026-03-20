"use client";

import { useState, useEffect, useMemo } from "react";
import { getVisitAudits } from "@/app/mr/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, Loader2, TrendingDown } from "lucide-react";

type ProductAuditRow = {
  id: string;
  product_id: string;
  quantity_in_stock?: number | null;
  quantity_sold_good_month?: number | null;
  price_per_pack?: number | null;
  days_oos?: number | null;
  mr_products?: { id: string; name: string } | { id: string; name: string }[] | null;
};

function calculateDaysCoverage(currentStock: number, qtyGoodMonth: number): number {
  if (!currentStock || !qtyGoodMonth) return 0;
  const daily = qtyGoodMonth / 30;
  if (!daily) return 0;
  return Math.round((currentStock / daily) * 10) / 10;
}

function calculateLostRevenue(daysOos: number, qtyGoodMonth: number, pricePerPack: number): number {
  if (!daysOos || !qtyGoodMonth || !pricePerPack) return 0;
  const daily = qtyGoodMonth / 30;
  return Math.round(daily * daysOos * pricePerPack);
}

function calculateRecommendedOrder(currentStock: number, qtyGoodMonth: number, targetDays = 45): number {
  if (!qtyGoodMonth) return 0;
  const daily = qtyGoodMonth / 30;
  if (!daily) return 0;
  const targetQty = daily * targetDays;
  const additional = targetQty - currentStock;
  return Math.max(0, Math.round(additional));
}

export function MrVisitFinancials({
  visitId,
  pharmacyName,
}: {
  visitId: string;
  pharmacyName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<ProductAuditRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getVisitAudits(visitId);
      if (res.success && res.data?.productAudits) {
        setAudits((res.data.productAudits ?? []) as ProductAuditRow[]);
      } else {
        setAudits([]);
      }
      setLoading(false);
    })();
  }, [visitId]);

  const metrics = useMemo(() => {
    const rows = audits.map((a) => {
      const currentStock = a.quantity_in_stock ?? 0;
      const qtyGoodMonth = a.quantity_sold_good_month ?? 0;
      const pricePerPack = a.price_per_pack ?? 0;
      const daysOos = a.days_oos ?? 0;
      const mp = Array.isArray(a.mr_products) ? a.mr_products[0] : a.mr_products;
      const name = mp?.name ?? "Product";
      return {
        productId: a.product_id,
        name,
        currentStock,
        qtyGoodMonth,
        pricePerPack,
        daysOos,
        coverageDays: calculateDaysCoverage(currentStock, qtyGoodMonth),
        lostRevenue: calculateLostRevenue(daysOos, qtyGoodMonth, pricePerPack),
        recOrder: calculateRecommendedOrder(currentStock, qtyGoodMonth),
      };
    });
    const totalLostRevenue = rows.reduce((s, r) => s + r.lostRevenue, 0);
    return { rows, totalLostRevenue };
  }, [audits]);

  const financialStory = useMemo(() => {
    const highlight = metrics.rows.find((r) => r.lostRevenue > 0) ?? metrics.rows[0];
    if (!highlight) return "";
    if (!highlight.lostRevenue && metrics.rows.every((r) => r.lostRevenue === 0)) {
      return "Fill in days out of stock, quantity sold in a good month and price per pack in the key products section to see an impact story you can share with the outlet.";
    }
    return `I noticed ${highlight.name} has been out of stock for about ${highlight.daysOos} days at ${pharmacyName}. Based on your average sales, that means you may have lost around KES ${highlight.lostRevenue.toLocaleString()} in revenue. Let's increase your order slightly so you don't lose that opportunity again.`;
  }, [metrics.rows, pharmacyName]);

  if (loading) {
    return (
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-50">
          <CircleDollarSign className="h-4 w-4" />
          Financial impact &amp; lost sales
        </CardTitle>
        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
          Use this to demonstrate revenue impact from stock-outs before moving to the order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {metrics.totalLostRevenue > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50">
              <TrendingDown className="h-4 w-4" />
              Estimated lost sales (OOS): ~KES {metrics.totalLostRevenue.toLocaleString()}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-700/80">
          <p className="font-medium text-slate-700 dark:text-slate-200">Story you can tell the outlet</p>
          <p className="mt-1.5 text-slate-600 dark:text-slate-300">
            {financialStory}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
