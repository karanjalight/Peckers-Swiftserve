import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { buildSubstitutionReport } from "@/lib/mr/field-reports-builders";
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
  MR_VISIT_TABLE_INNER_MAX_400,
  MR_VISIT_TABLE_INNER_SCROLL,
  MR_VISIT_TABLE_SHELL,
} from "@/components/mr/mr-visit-table-classes";

export default async function SubstitutionReportPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const [compRes, prodRes] = await Promise.all([
    fetchAllByRange((from, to) =>
      supabase
        .from("mr_competitor_audits")
        .select("competitor_name, substitution_reason")
        .range(from, to)
    ),
    fetchAllByRange((from, to) =>
      supabase.from("mr_product_audits").select("id").range(from, to)
    ),
  ]);

  if (compRes.error) console.error("Substitution report competitor_audits:", compRes.error);
  if (prodRes.error) console.error("Substitution report product_audits:", prodRes.error);

  const competitorRows =
    (compRes.data ?? []) as Array<{
      competitor_name?: string | null;
      substitution_reason?: string | null;
    }>;
  const totalProductAudits = (prodRes.data ?? []).length;

  const data = buildSubstitutionReport(competitorRows, totalProductAudits);

  const rivalsCsvRows = data.topRivals.map((r) => [r.name, r.count]);
  const reasonCsvRows = data.byReason.map((r) => [
    r.reason,
    r.count,
    r.percentOfSubstitutions,
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
              Substitution report
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Top competitor brands recorded on substitution, reasons cited, and
              overall substitution rate (competitor rows ÷ product audit rows).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-600 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Substitution rate
              </p>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {data.overallSubstitutionRatePercent}%
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {data.totalCompetitorRows} competitor rows /{" "}
                {data.totalProductAudits} product audit lines
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Main rivals (top 3)
              </h3>
              <ReportCsvDownloadButton
                filename="mr-report-substitution-top-rivals.csv"
                headers={["Competitor", "Substitution mentions"]}
                rows={rivalsCsvRows}
                disabled={data.topRivals.length === 0}
              />
            </div>
            <div className={MR_VISIT_TABLE_SHELL}>
              <div className={MR_VISIT_TABLE_INNER_SCROLL}>
                <Table className="rounded-b-2xl">
                  <TableHeader>
                    <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                      <TableHead className={`${MR_VISIT_TABLE_HEAD} pl-3`}>Rank</TableHead>
                      <TableHead className={MR_VISIT_TABLE_HEAD}>Competitor</TableHead>
                      <TableHead className={`${MR_VISIT_TABLE_HEAD} pr-3 text-right`}>Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topRivals.length === 0 ? (
                      <TableRow className={MR_VISIT_TABLE_BODY_ROW}>
                        <TableCell colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No competitor substitution data yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.topRivals.map((r, i) => (
                        <TableRow key={r.name} className={MR_VISIT_TABLE_BODY_ROW}>
                          <TableCell className="py-4 pl-3 tabular-nums">{i + 1}</TableCell>
                          <TableCell className="py-4 font-medium text-slate-900 dark:text-slate-100">
                            {r.name}
                          </TableCell>
                          <TableCell className="py-4 pr-3 text-right tabular-nums">{r.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Reasons &amp; substitution share
              </h3>
              <ReportCsvDownloadButton
                filename="mr-report-substitution-reasons.csv"
                headers={["Reason", "Count", "Share %"]}
                rows={reasonCsvRows}
                disabled={data.byReason.length === 0}
              />
            </div>
            <div className={MR_VISIT_TABLE_SHELL}>
              <div className={MR_VISIT_TABLE_INNER_MAX_400}>
                <Table className="rounded-b-2xl">
                  <TableHeader>
                    <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                      <TableHead className={`${MR_VISIT_TABLE_HEAD} pl-3`}>Reason</TableHead>
                      <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Count</TableHead>
                      <TableHead className={`${MR_VISIT_TABLE_HEAD} pr-3 text-right`}>
                        Share of substitutions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byReason.length === 0 ? (
                      <TableRow className={MR_VISIT_TABLE_BODY_ROW}>
                        <TableCell colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No reasons recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.byReason.map((r) => (
                        <TableRow key={r.reason} className={MR_VISIT_TABLE_BODY_ROW}>
                          <TableCell className="max-w-[min(480px,50vw)] py-4 pl-3 text-slate-900 dark:text-slate-100">
                            {r.reason}
                          </TableCell>
                          <TableCell className="py-4 text-right tabular-nums">{r.count}</TableCell>
                          <TableCell className="py-4 pr-3 text-right tabular-nums">
                            {r.percentOfSubstitutions}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
