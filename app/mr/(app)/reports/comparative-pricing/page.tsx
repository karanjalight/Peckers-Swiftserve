import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { buildComparativePricingRows } from "@/lib/mr/field-reports-builders";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { ReportCsvDownloadButton } from "@/components/mr/ReportCsvDownloadButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MR_VISIT_TABLE_BODY_ROW,
  MR_VISIT_TABLE_HEAD,
  MR_VISIT_TABLE_HEADER_ROW,
  MR_VISIT_TABLE_INNER_MAX_520,
  MR_VISIT_TABLE_SHELL,
} from "@/components/mr/mr-visit-table-classes";

export default async function ComparativePricingReportPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const [paRes, caRes] = await Promise.all([
    fetchAllByRange((from, to) =>
      supabase
        .from("mr_product_audits")
        .select(
          "price_per_pack, mr_products(name), mr_visits(mr_pharmacies(region))"
        )
        .range(from, to)
    ),
    fetchAllByRange((from, to) =>
      supabase
        .from("mr_competitor_audits")
        .select(
          "price_per_pack, mr_product_audits(mr_products(name), mr_visits(mr_pharmacies(region)))"
        )
        .range(from, to)
    ),
  ]);

  if (paRes.error) console.error("Comparative pricing product_audits:", paRes.error);
  if (caRes.error) console.error("Comparative pricing competitor_audits:", caRes.error);

  const rows = buildComparativePricingRows(
    (paRes.data ?? []) as Parameters<typeof buildComparativePricingRows>[0],
    (caRes.data ?? []) as Parameters<typeof buildComparativePricingRows>[1]
  );

  const csvRows = rows.map((r) => [
    r.product,
    r.region,
    r.avgAuditPriceKes ?? "",
    r.avgCompetitorPriceKes ?? "",
    r.differenceKes ?? "",
  ]);

  return (
    <div className="w-full space-y-6">
      <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
        <Link href="/mr/reports" className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </Button>

      <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl text-slate-900 dark:text-white">
              Comparative pricing
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Average your price per pack vs average competitor price per pack by
              product and region (from audit captures). Difference = your average
              minus competitor average (KES).
            </CardDescription>
          </div>
          <ReportCsvDownloadButton
            filename="mr-report-comparative-pricing.csv"
            headers={[
              "Product",
              "Region",
              "Avg your price (KES)",
              "Avg competitor price (KES)",
              "Difference (KES)",
            ]}
            rows={csvRows}
            disabled={rows.length === 0}
          />
        </CardHeader>
        <CardContent>
          <div className={MR_VISIT_TABLE_SHELL}>
            <div className={MR_VISIT_TABLE_INNER_MAX_520}>
              <Table className="rounded-b-2xl">
                <TableHeader>
                  <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} pl-3`}>Product</TableHead>
                    <TableHead className={MR_VISIT_TABLE_HEAD}>Region</TableHead>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>
                      Avg your (KES)
                    </TableHead>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>
                      Avg competitor (KES)
                    </TableHead>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} pr-3 text-right`}>
                      Difference (KES)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow className={MR_VISIT_TABLE_BODY_ROW}>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No overlapping price data yet. Capture price per pack on
                        product and competitor lines in visits.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={`${r.product}-${r.region}`} className={MR_VISIT_TABLE_BODY_ROW}>
                        <TableCell className="py-4 pl-3 font-medium text-slate-900 dark:text-slate-100">
                          {r.product}
                        </TableCell>
                        <TableCell className="py-4">{r.region}</TableCell>
                        <TableCell className="py-4 text-right tabular-nums">
                          {r.avgAuditPriceKes != null
                            ? r.avgAuditPriceKes.toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="py-4 text-right tabular-nums">
                          {r.avgCompetitorPriceKes != null
                            ? r.avgCompetitorPriceKes.toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="py-4 pr-3 text-right tabular-nums">
                          {r.differenceKes != null
                            ? r.differenceKes.toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
