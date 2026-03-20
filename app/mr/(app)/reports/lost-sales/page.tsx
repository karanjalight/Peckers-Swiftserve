import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MR_SUPABASE_IN_CHUNK } from "@/lib/mr/supabase-limits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, TrendingDown, Lightbulb, Package } from "lucide-react";

export default async function MrLostSalesReportPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const isManager = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManager) {
    return (
      <div className="mx-auto bg-black  space-y-4">
        <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
          <Link href="/mr/reports" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              This report is available to managers and admins only.
            </p>
            <Button asChild className="mt-4">
              <Link href="/mr/reports">Go to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { supabase } = auth;

  const productAuditsResult = await fetchAllByRange((rangeFrom, rangeTo) =>
    supabase
      .from("mr_product_audits")
      .select(`
      id,
      visit_id,
      days_oos,
      quantity_sold_good_month,
      price_per_pack,
      mr_products (name)
    `)
      .not("days_oos", "is", null)
      .gte("days_oos", 0)
      .order("id", { ascending: true })
      .range(rangeFrom, rangeTo)
  );
  const productAuditsData = productAuditsResult.data;
  const productAuditsError = productAuditsResult.error;

  if (productAuditsError) {
    return (
      <div className="mx-auto space-y-4">
        <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
          <Link href="/mr/reports" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Failed to load report</CardTitle>
            <CardDescription>
              The lost-sales data could not be loaded. This may be due to a missing database column or permissions.
              {productAuditsError.message ? ` Error: ${productAuditsError.message}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/mr/reports">Back to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const list = (productAuditsData ?? []) as Array<{
    id: string;
    visit_id: string;
    days_oos: number | null;
    quantity_sold_good_month: number | null;
    price_per_pack: number | null;
    mr_products: { name: string } | { name: string }[] | null;
  }>;

  const visitIds = [...new Set(list.map((r) => r.visit_id))].filter(Boolean);
  const pharmacyByVisitId: Record<string, string> = {};
  if (visitIds.length > 0) {
    for (let i = 0; i < visitIds.length; i += MR_SUPABASE_IN_CHUNK) {
      const batch = visitIds.slice(i, i + MR_SUPABASE_IN_CHUNK);
      const { data: visitsData, error: visitsError } = await supabase
        .from("mr_visits")
        .select("id, mr_pharmacies(name)")
        .in("id", batch);
      if (visitsError) {
        return (
          <div className="mx-auto space-y-4">
            <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
              <Link href="/mr/reports" className="gap-1.5">
                <ChevronLeft className="h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">Failed to load pharmacy names</CardTitle>
                <CardDescription>{visitsError.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/mr/reports">Back to Reports</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }
      const visits = (visitsData ?? []) as Array<{
        id: string;
        mr_pharmacies: { name: string } | { name: string }[] | null;
      }>;
      for (const v of visits) {
        const ph = v.mr_pharmacies;
        const name = (Array.isArray(ph) ? ph[0] : ph)?.name ?? "—";
        pharmacyByVisitId[v.id] = name;
      }
    }
  }

  type Row = {
    id: string;
    visitId: string;
    productName: string;
    pharmacyName: string;
    daysOos: number;
    qtySoldGoodMonth: number;
    pricePerPack: number | null;
    volumeLoss: number;
    revenueLoss: number;
  };

  const reportRows: Row[] = list
    .map((r) => {
      const daysOos = Number(r.days_oos) || 0;
      const qtySoldGoodMonth = Number(r.quantity_sold_good_month) ?? 0;
      const pricePerPack = r.price_per_pack != null ? Number(r.price_per_pack) : null;
      const product = r.mr_products;
      const productName = (Array.isArray(product) ? product[0] : product)?.name ?? "—";
      const pharmacyName = pharmacyByVisitId[r.visit_id] ?? "—";

      const volumeLoss = (daysOos / 30) * qtySoldGoodMonth;
      const revenueLoss = pricePerPack != null ? volumeLoss * pricePerPack : 0;

      return {
        id: r.id,
        visitId: r.visit_id,
        productName,
        pharmacyName,
        daysOos,
        qtySoldGoodMonth,
        pricePerPack,
        volumeLoss,
        revenueLoss,
      };
    })
    .filter((r) => r.daysOos > 0 && r.qtySoldGoodMonth > 0)
    .sort((a, b) => b.revenueLoss - a.revenueLoss);

  const totalRevenueLoss = reportRows.reduce((sum, r) => sum + r.revenueLoss, 0);
  const totalVolumeLoss = reportRows.reduce((sum, r) => sum + r.volumeLoss, 0);

  return (
    <div className="mx-auto   space-y-6">
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
          <Link href="/mr/reports" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Lost Sales Opportunity Report
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Revenue left on the table when products were out of stock. Use this to convince procurement to increase order sizes.
          </p>
        </div>
      </div>

      {/* How it's calculated */}
      <Card className="border-slate-200/80 dark:border-slate-700/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingDown className="h-4 w-4 text-slate-500" />
            How we calculate it
          </CardTitle>
          <CardDescription className="text-sm">
            <strong>Volume Loss</strong> = (Days Out of Stock ÷ 30) × Qty Sold in a Good Month
            <br />
            <strong>Revenue Loss</strong> = Volume Loss × Pharmacy Unit Price (per pack)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-700/80">
          <CardHeader className="bg-amber-50/80 pb-2 dark:bg-amber-950/20">
            <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100">
              Total revenue lost
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              Estimated value not captured due to out-of-stock
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              KES {Math.round(totalRevenueLoss).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-700/80">
          <CardHeader className="bg-slate-50 pb-2 dark:bg-slate-800/50">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Total volume loss
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Packs that could have been sold
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {Math.round(totalVolumeLoss).toLocaleString()} packs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* The insight */}
      <Card className="border-blue-200/80 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-900 dark:text-blue-100">
            <Lightbulb className="h-4 w-4" />
            The insight
          </CardTitle>
          <CardDescription className="text-blue-800 dark:text-blue-200">
            Use this to show a procurement officer: &ldquo;You lost <strong>KES {Math.round(totalRevenueLoss).toLocaleString()}</strong> in
            sales because of out-of-stock days across these products. Ordering more packs would have captured that profit.&rdquo;
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-700/80">
        <CardHeader className="border-b bg-slate-50/80 px-4 py-4 sm:px-6 dark:bg-slate-900/40 dark:border-slate-700/80">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Package className="h-5 w-5 text-slate-500" />
            By product & pharmacy
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Rows with days OOS and quantity sold in a good month. Sorted by revenue loss (highest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reportRows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6">
              No lost-sales data yet. Record &ldquo;Days out of stock&rdquo; and &ldquo;Quantity sold in a good month&rdquo; in visit product
              audits to see estimates here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">Pharmacy</TableHead>
                    <TableHead className="font-semibold text-right">Days OOS</TableHead>
                    <TableHead className="font-semibold text-right">Sold (good mo)</TableHead>
                    <TableHead className="font-semibold text-right">Price/pack (KES)</TableHead>
                    <TableHead className="font-semibold text-right">Volume loss</TableHead>
                    <TableHead className="font-semibold text-right">Revenue loss (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell className="font-medium">{r.productName}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{r.pharmacyName}</TableCell>
                      <TableCell className="text-right">{r.daysOos}</TableCell>
                      <TableCell className="text-right">{r.qtySoldGoodMonth}</TableCell>
                      <TableCell className="text-right">
                        {r.pricePerPack != null ? r.pricePerPack.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">{Math.round(r.volumeLoss).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">
                        {Math.round(r.revenueLoss).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
