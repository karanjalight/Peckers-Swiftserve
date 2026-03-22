import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import {
  buildOutOfStockReportRows,
} from "@/lib/mr/field-reports-builders";
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

export default async function OutOfStockReportPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const oosRes = await fetchAllByRange((from, to) =>
    supabase
      .from("mr_product_audits")
      .select(
        `
        reason_for_oos,
        days_oos,
        mr_products(name),
        mr_visits(check_in_time, mr_pharmacies(name, region))
      `
      )
      .eq("quantity_in_stock", 0)
      .range(from, to)
  );

  if (oosRes.error) console.error("Out of stock report:", oosRes.error);

  const rows = buildOutOfStockReportRows((oosRes.data ?? []) as Parameters<
    typeof buildOutOfStockReportRows
  >[0]);

  const csvRows = rows.map((r) => [
    r.productName,
    r.pharmacyName,
    r.region,
    r.reason,
    r.daysOos ?? "",
    r.checkIn ? new Date(r.checkIn).toLocaleString() : "",
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
              Out of stock report
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Products marked out of stock in audits, with attributed reasons and
              days OOS when captured.
            </CardDescription>
          </div>
          <ReportCsvDownloadButton
            filename="mr-report-out-of-stock-reasons.csv"
            headers={[
              "Product",
              "Pharmacy",
              "Region",
              "Reason",
              "Days OOS",
              "Visit",
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
                    <TableHead className={MR_VISIT_TABLE_HEAD}>Pharmacy</TableHead>
                    <TableHead className={MR_VISIT_TABLE_HEAD}>Region</TableHead>
                    <TableHead className={MR_VISIT_TABLE_HEAD}>Reason</TableHead>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Days OOS</TableHead>
                    <TableHead className={`${MR_VISIT_TABLE_HEAD} pr-3 text-right`}>Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow className={MR_VISIT_TABLE_BODY_ROW}>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No out-of-stock audit lines yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, i) => (
                      <TableRow
                        key={`${r.productName}-${r.pharmacyName}-${i}`}
                        className={MR_VISIT_TABLE_BODY_ROW}
                      >
                        <TableCell className="py-4 pl-3 font-medium text-slate-900 dark:text-slate-100">
                          {r.productName}
                        </TableCell>
                        <TableCell className="py-4">{r.pharmacyName}</TableCell>
                        <TableCell className="py-4">{r.region}</TableCell>
                        <TableCell className="max-w-[min(320px,40vw)] py-4 text-sm">
                          {r.reason}
                        </TableCell>
                        <TableCell className="py-4 text-right tabular-nums">
                          {r.daysOos ?? "—"}
                        </TableCell>
                        <TableCell className="py-4 pr-3 text-right text-xs text-slate-600 dark:text-slate-400">
                          {r.checkIn
                            ? new Date(r.checkIn).toLocaleDateString()
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
