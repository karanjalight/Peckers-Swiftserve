"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
  MapPin,
  Package,
  TrendingUp,
  Building2,
  Download,
  Filter,
  FilePlus2,
  ArrowUpRight,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Palette for charts
const CHART_COLORS = [
  "#0ea5e9",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
  "#eab308",
  "#22c55e",
  "#f43f5e",
];
const LINE_CHART_COLOR = "#8b5cf6";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">
        {payload[0]?.value ?? 0}
      </p>
    </div>
  );
};

import type {
  ManagerKpis,
  MrKpis,
  ManagerChartData,
  MrChartData,
  RecentVisit,
} from "./MrReportsTypes";

export function MrReportsClient({
  mode,
  kpis,
  chartData,
  recentVisits,
}: {
  mode: "mr" | "manager";
  kpis: ManagerKpis | MrKpis;
  chartData: ManagerChartData | MrChartData;
  recentVisits: RecentVisit[];
}) {
  const isManager = mode === "manager";
  const managerKpis = kpis as ManagerKpis;
  const managerChartData = chartData as ManagerChartData;
  const mrChartData = chartData as MrChartData;

  // Derive visits-per-day series from recent visits (no backend changes)
  const visitsPerDay = (() => {
    const counts: Record<string, number> = {};
    for (const v of recentVisits) {
      const d = new Date(v.checkIn);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, visits]) => ({ name, visits }));
  })();

  const handleExport = () => {
    if (!recentVisits.length) return;

    const header = ["id", "pharmacy", "region", "objective", "checkIn"];
    const rows = recentVisits.map((v) => [
      v.id,
      v.pharmacy,
      v.region ?? "",
      v.objective ?? "",
      new Date(v.checkIn).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((c) => {
            const value = String(c ?? "");
            return /[",\n]/.test(value)
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = isManager ? "mr-visits-manager.csv" : "mr-visits.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lineSeries =
    visitsPerDay.length > 0
      ? visitsPerDay
      : isManager
        ? managerChartData.byMonth
        : mrChartData.byMonth;

  return (
    <div className="spacey-10">
      {/* Page header */}
      
    </div>
  );
}
