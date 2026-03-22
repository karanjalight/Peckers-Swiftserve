"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  MR_VISIT_TABLE_INNER_SCROLL,
  MR_VISIT_TABLE_SHELL,
} from "@/components/mr/mr-visit-table-classes";
import type { TopPrescribersPerPharmacyRow } from "@/lib/mr/presentation-reports-advanced";

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

export function TopPrescribersPerChemistPanel({
  blocks,
}: {
  blocks: TopPrescribersPerPharmacyRow[];
}) {
  const csv = useMemo(() => {
    const headers = ["Pharmacy", "Doctor", "Location", "Rx/month"];
    const rows: unknown[][] = [];
    for (const block of blocks) {
      for (const pr of block.prescribers) {
        rows.push([
          block.pharmacyName,
          pr.doctorName,
          pr.doctorLocation,
          pr.rxPerMonth,
        ]);
      }
    }
    return { headers, rows };
  }, [blocks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Up to five doctors by summed Rx/month per pharmacy, from prescription
          capture on submitted AUDIT visits.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
          disabled={csv.rows.length === 0}
          onClick={() =>
            downloadCsv(
              "mr-report-top-prescribers-per-pharmacy.csv",
              csv.headers,
              csv.rows
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Excel (CSV)
        </Button>
      </div>

      <div className="space-y-6">
        {blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-600 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
            No prescription data on AUDIT visits yet. Capture prescriptions with
            doctors and Rx/month on visits to see top prescribers per chemist.
          </p>
        ) : (
          blocks.map((block) => (
            <div key={block.pharmacyId} className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {block.pharmacyName}
              </p>
              <div className={MR_VISIT_TABLE_SHELL}>
                <div className={MR_VISIT_TABLE_INNER_SCROLL}>
                  <Table className="rounded-b-2xl">
                    <TableHeader>
                      <TableRow className={MR_VISIT_TABLE_HEADER_ROW}>
                        <TableHead className={`${MR_VISIT_TABLE_HEAD} pl-3`}>Doctor</TableHead>
                        <TableHead className={MR_VISIT_TABLE_HEAD}>Location</TableHead>
                        <TableHead className={`${MR_VISIT_TABLE_HEAD} pr-3 text-right`}>
                          Rx/month
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.prescribers.map((pr, i) => (
                        <TableRow key={`${block.pharmacyId}-pr-${i}`} className={MR_VISIT_TABLE_BODY_ROW}>
                          <TableCell className="py-4 pl-3 font-medium text-slate-900 dark:text-slate-100">
                            {pr.doctorName}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700 dark:text-slate-300">
                            {pr.doctorLocation || "—"}
                          </TableCell>
                          <TableCell className="py-4 pr-3 text-right text-sm tabular-nums">
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
    </div>
  );
}
