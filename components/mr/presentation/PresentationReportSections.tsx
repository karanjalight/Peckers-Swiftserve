"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
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
import type { PresentationReportsProps } from "@/lib/mr/presentation-reports-props";
import {
  MR_VISIT_TABLE_BODY_ROW,
  MR_VISIT_TABLE_HEAD,
  MR_VISIT_TABLE_HEADER_ROW,
  MR_VISIT_TABLE_INNER_MAX_360,
  MR_VISIT_TABLE_INNER_MAX_420,
  MR_VISIT_TABLE_INNER_SCROLL,
  MR_VISIT_TABLE_SHELL,
} from "@/components/mr/mr-visit-table-classes";

function escapeCsvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) => r.map(escapeCsvCell).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RegionsAuditedReportCard({
  regionalAuditSummary,
}: Pick<PresentationReportsProps, "regionalAuditSummary">) {
  const regionalCsv = useMemo(
    () => ({
      headers: ["Region", "Pharmacies audited", "Equitable %"],
      rows: regionalAuditSummary.map((r) => [
        r.region,
        r.pharmaciesAudited,
        r.equitablePercent,
      ]),
    }),
    [regionalAuditSummary]
  );

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            Regions audited &amp; equitable share
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Distinct pharmacies audited per region; equitable % is each region&apos;s share of
            all audited pharmacies (sums to 100%).
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={regionalAuditSummary.length === 0}
          onClick={() =>
            downloadCsv("mr-report-regions-audited.csv", regionalCsv.headers, regionalCsv.rows)
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className={MR_VISIT_TABLE_SHELL}>
          <div className={MR_VISIT_TABLE_INNER_SCROLL}>
            <Table className="rounded-b-2xl">
              <TableHeader>
                <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Region</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>
                    Pharmacies audited
                  </TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Equitable %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionalAuditSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-slate-500">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  regionalAuditSummary.map((r) => (
                    <TableRow key={r.region} className={MR_VISIT_TABLE_BODY_ROW}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {r.region}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.pharmaciesAudited}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.equitablePercent}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PharmaciesAuditedDetailReportCard({
  auditedPharmaciesDetail,
}: Pick<PresentationReportsProps, "auditedPharmaciesDetail">) {
  const auditedCsv = useMemo(
    () => ({
      headers: [
        "Pharmacy",
        "Region",
        "Location",
        "Business value (KES / month)",
        "Basket value (KES / patient)",
        "Patient flow (per day)",
        "Last audit",
      ],
      rows: auditedPharmaciesDetail.map((r) => [
        r.pharmacyName,
        r.region,
        r.location,
        r.businessValueMonthlyKes ?? "",
        r.basketValuePerPatientKes ?? "",
        r.patientsPerDay ?? "",
        new Date(r.lastAuditAt).toLocaleString(),
      ]),
    }),
    [auditedPharmaciesDetail]
  );

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            Pharmacies audited (detail)
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Latest audit metrics per pharmacy: location, estimated business value from pharmacy
            profile, basket value and patient flow from the visit.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={auditedPharmaciesDetail.length === 0}
          onClick={() =>
            downloadCsv("mr-report-pharmacies-audited.csv", auditedCsv.headers, auditedCsv.rows)
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className={MR_VISIT_TABLE_SHELL}>
          <div className={MR_VISIT_TABLE_INNER_MAX_420}>
            <Table className="rounded-b-2xl">
              <TableHeader>
                <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Pharmacy</TableHead>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Region</TableHead>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Location</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Business (KES/mo)</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Basket (KES/pt)</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Patients/day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditedPharmaciesDetail.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-slate-500">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  auditedPharmaciesDetail.map((r) => (
                    <TableRow key={`${r.pharmacyName}-${r.region}`} className={MR_VISIT_TABLE_BODY_ROW}>
                    <TableCell className="max-w-[140px] font-medium text-slate-900 dark:text-slate-100">
                      {r.pharmacyName}
                    </TableCell>
                    <TableCell>{r.region}</TableCell>
                    <TableCell className="max-w-[180px] text-sm text-slate-700 dark:text-slate-300">
                      {r.location}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {r.businessValueMonthlyKes != null
                        ? r.businessValueMonthlyKes.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {r.basketValuePerPatientKes != null
                        ? r.basketValuePerPatientKes.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {r.patientsPerDay ?? "—"}
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
  );
}

export function OosByPharmacyProductReportCard({
  outOfStockDetail,
}: Pick<PresentationReportsProps, "outOfStockDetail">) {
  const oosCsv = useMemo(
    () => ({
      headers: ["Pharmacy", "Region", "Location", "Product out of stock", "Days OOS"],
      rows: outOfStockDetail.map((r) => [
        r.pharmacyName,
        r.region,
        r.location,
        r.productName,
        r.daysOos ?? "",
      ]),
    }),
    [outOfStockDetail]
  );

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            Out of stock by pharmacy &amp; product
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            From AUDIT visit product audits where quantity in stock is zero.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={outOfStockDetail.length === 0}
          onClick={() => downloadCsv("mr-report-out-of-stock.csv", oosCsv.headers, oosCsv.rows)}
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className={MR_VISIT_TABLE_SHELL}>
          <div className={MR_VISIT_TABLE_INNER_MAX_420}>
            <Table className="rounded-b-2xl">
              <TableHeader>
                <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Pharmacy</TableHead>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Region</TableHead>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Location</TableHead>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Product</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Days OOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outOfStockDetail.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-slate-500">
                      No out-of-stock lines recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  outOfStockDetail.map((r, i) => (
                    <TableRow
                      key={`${r.pharmacyName}-${r.productName}-${i}`}
                      className={MR_VISIT_TABLE_BODY_ROW}
                    >
                      <TableCell className="max-w-[140px] font-medium text-slate-900 dark:text-slate-100">
                        {r.pharmacyName}
                      </TableCell>
                      <TableCell>{r.region}</TableCell>
                      <TableCell className="max-w-[160px] text-sm text-slate-700 dark:text-slate-300">
                        {r.location}
                      </TableCell>
                      <TableCell className="text-sm">{r.productName}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {r.daysOos ?? "—"}
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
  );
}

export function OosRatioByProductReportCard({
  oosRatioPerProduct,
}: Pick<PresentationReportsProps, "oosRatioPerProduct">) {
  const oosRatioCsv = useMemo(
    () => ({
      headers: ["Product", "Pharmacies audited", "Pharmacies OOS", "OOS ratio %"],
      rows: oosRatioPerProduct.map((r) => [
        r.productName,
        r.pharmaciesAudited,
        r.pharmaciesOutOfStock,
        r.ratioPercent,
      ]),
    }),
    [oosRatioPerProduct]
  );

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            OOS ratio vs pharmacies audited (per product)
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Among distinct pharmacies where each product was audited, the share where the product
            was out of stock at least once.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={oosRatioPerProduct.length === 0}
          onClick={() =>
            downloadCsv(
              "mr-report-oos-ratio-by-product.csv",
              oosRatioCsv.headers,
              oosRatioCsv.rows
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className={MR_VISIT_TABLE_SHELL}>
          <div className={MR_VISIT_TABLE_INNER_MAX_360}>
            <Table className="rounded-b-2xl">
              <TableHeader>
                <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Product</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Pharmacies audited</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Pharmacies OOS</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>OOS ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oosRatioPerProduct.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-slate-500">
                      No product audit data in AUDIT visits
                    </TableCell>
                  </TableRow>
                ) : (
                  oosRatioPerProduct.map((r) => (
                    <TableRow key={r.productName} className={MR_VISIT_TABLE_BODY_ROW}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {r.productName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.pharmaciesAudited}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.pharmaciesOutOfStock}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.ratioPercent}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PharmacyMarketShareReportCard({
  pharmacyMarketShareEstimate,
}: Pick<PresentationReportsProps, "pharmacyMarketShareEstimate">) {
  const marketShareCsv = useMemo(
    () => ({
      headers: ["Pharmacy", "Total Rx/mo (captured)", "Company Rx/mo", "Share %"],
      rows: pharmacyMarketShareEstimate.map((r) => [
        r.pharmacyName,
        r.totalRxPerMonth,
        r.companyRxPerMonth,
        r.sharePercent,
      ]),
    }),
    [pharmacyMarketShareEstimate]
  );

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            Pharmacy market share (Rx estimate)
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Share of captured prescription volume (Rx/month) attributed to company catalogue
            products vs all products recorded per visit.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={pharmacyMarketShareEstimate.length === 0}
          onClick={() =>
            downloadCsv(
              "mr-report-pharmacy-market-share.csv",
              marketShareCsv.headers,
              marketShareCsv.rows
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className={MR_VISIT_TABLE_SHELL}>
          <div className={MR_VISIT_TABLE_INNER_MAX_360}>
            <Table className="rounded-b-2xl">
              <TableHeader>
                <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                  <TableHead className={MR_VISIT_TABLE_HEAD}>Pharmacy</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Total Rx/mo</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Company Rx/mo</TableHead>
                  <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacyMarketShareEstimate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-slate-500">
                      No prescription lines with Rx or no catalogue match
                    </TableCell>
                  </TableRow>
                ) : (
                  pharmacyMarketShareEstimate.map((r) => (
                    <TableRow key={r.pharmacyId} className={MR_VISIT_TABLE_BODY_ROW}>
                      <TableCell className="max-w-[200px] font-medium text-slate-900 dark:text-slate-100">
                        {r.pharmacyName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {r.totalRxPerMonth.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {r.companyRxPerMonth.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{r.sharePercent}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopPrescribersByProductReportCard({
  topPrescribersPerProduct,
}: Pick<PresentationReportsProps, "topPrescribersPerProduct">) {
  const prescribersProductCsv = useMemo(() => {
    const headers = ["Product", "Doctor", "Location", "Rx/month"];
    const rows: unknown[][] = [];
    for (const block of topPrescribersPerProduct) {
      for (const pr of block.prescribers) {
        rows.push([block.productName, pr.doctorName, pr.doctorLocation, pr.rxPerMonth]);
      }
    }
    return { headers, rows };
  }, [topPrescribersPerProduct]);

  return (
    <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            Top prescribers per product
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Up to five doctors by summed Rx/month per product name in prescription capture. For
            prescribers per chemist, see{" "}
            <Link
              href="/mr/reports/top-prescribers-per-chemist"
              className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Top prescribers per chemist
            </Link>
            .
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={prescribersProductCsv.rows.length === 0}
          onClick={() =>
            downloadCsv(
              "mr-report-top-prescribers-per-product.csv",
              prescribersProductCsv.headers,
              prescribersProductCsv.rows
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topPrescribersPerProduct.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-600 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
              No prescription data
            </p>
          ) : (
            topPrescribersPerProduct.map((block, bi) => (
              <div key={`${bi}-${block.productName}`} className="space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {block.productName}
                </p>
                <div className={MR_VISIT_TABLE_SHELL}>
                  <div className={MR_VISIT_TABLE_INNER_SCROLL}>
                    <Table className="rounded-b-2xl">
                      <TableHeader>
                        <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                          <TableHead className={MR_VISIT_TABLE_HEAD}>Doctor</TableHead>
                          <TableHead className={MR_VISIT_TABLE_HEAD}>Location</TableHead>
                          <TableHead className={`${MR_VISIT_TABLE_HEAD} text-right`}>Rx/month</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {block.prescribers.map((pr, i) => (
                          <TableRow key={`${block.productName}-pr-${i}`} className={MR_VISIT_TABLE_BODY_ROW}>
                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                              {pr.doctorName}
                            </TableCell>
                            <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                              {pr.doctorLocation || "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {pr.rxPerMonth.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
