"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function escapeCsvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ReportCsvDownloadButton({
  filename,
  headers,
  rows,
  label = "Excel (CSV)",
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: unknown[][];
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 rounded-full border-slate-400 dark:border-slate-600"
      disabled={disabled ?? rows.length === 0}
      onClick={() => {
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
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
