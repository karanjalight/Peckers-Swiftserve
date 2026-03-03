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

export type ManagerKpis = {
  totalVisits: number;
  stockOuts: number;
  substitutionRate: number;
  totalProductAudits: number;
  competitorCount: number;
  uniquePharmacies: number;
};

type MrKpis = {
  totalVisits: number;
  uniquePharmacies: number;
};

export type ManagerChartData = {
  byRegion: { name: string; value: number }[];
  byObjective: { name: string; value: number }[];
  byPharmacy: { name: string; value: number }[];
  byMonth: { name: string; visits: number }[];
  byProduct: { name: string; value: number }[];
};

type MrChartData = {
  byMonth: { name: string; visits: number }[];
  byObjective: { name: string; value: number }[];
  byPharmacy: { name: string; value: number }[];
};

export type RecentVisit = {
  id: string;
  checkIn: string;
  pharmacy: string;
  region?: string;
  objective?: string;
  canEdit?: boolean;
};

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
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {isManager ? "MR Reports" : "My Reports"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager
              ? "Enterprise-grade analytics across medical rep activity and field intelligence."
              : "A focused summary of your visit activity and performance."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* <Button
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-xl border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-xl border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {isManager && (
            <Button className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-50 shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400">
              <FilePlus2 className="h-4 w-4" />
              Create Report
            </Button>
          )} */}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Total Visits
            </CardTitle>
            <div className="rounded-xl bg-slate-900/5 p-2">
              <MapPin className="h-4 w-4 text-slate-900" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.totalVisits}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Pharmacies Visited
            </CardTitle>
            <div className="rounded-xl bg-violet-500/10 p-2">
              <Building2 className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.uniquePharmacies}
            </p>
          </CardContent>
        </Card>
        {isManager && (
          <>
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Stock-outs
                </CardTitle>
                <div className="rounded-xl bg-amber-500/10 p-2">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-amber-600">
                  {managerKpis.stockOuts}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Substitution Rate
                </CardTitle>
                <div className="rounded-xl bg-emerald-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">
                  {managerKpis.substitutionRate}%
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Visits Over Time
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {visitsPerDay.length
                ? "Daily submitted visits (recent period)"
                : isManager
                  ? "All submitted visits by month"
                  : "Your visits by month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lineSeries.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-500">
                No visit data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineSeries}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke={LINE_CHART_COLOR}
                      strokeWidth={2}
                      dot={{ fill: LINE_CHART_COLOR }}
                      activeDot={{ fill: "#a78bfa", stroke: LINE_CHART_COLOR }}
                      name="Visits"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Visit Objectives
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Breakdown by objective type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isManager ? managerChartData.byObjective : mrChartData.byObjective)
              .length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-500">
                No data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        isManager
                          ? managerChartData.byObjective
                          : mrChartData.byObjective
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({
                        name,
                        percent,
                      }: {
                        name?: string;
                        percent?: number;
                      }) =>
                        `${name ?? ""} ${
                          percent != null ? (percent * 100).toFixed(0) : ""
                        }%`
                      }
                    >
                      {(isManager
                        ? managerChartData.byObjective
                        : mrChartData.byObjective
                      ).map((_, i) => (
                        <Cell
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Region / Pharmacy charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isManager && managerChartData.byRegion?.length > 0 && (
          <Card className="border-slate-200 rounded-2xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Visits by Region
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Submitted visits per region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={managerChartData.byRegion}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Visits"
                      radius={[4, 4, 0, 0]}
                    >
                      {managerChartData.byRegion.map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 rounded-2xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900">
              {isManager ? "Top Pharmacies" : "My Top Pharmacies"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {isManager ? "Most frequently visited" : "Your most visited pharmacies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isManager
              ? managerChartData.byPharmacy
              : mrChartData.byPharmacy
            ).length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-500">
                No pharmacy data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      isManager
                        ? managerChartData.byPharmacy
                        : mrChartData.byPharmacy
                    }
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 60, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Visits"
                      radius={[0, 4, 4, 0]}
                    >
                      {(isManager
                        ? managerChartData.byPharmacy
                        : mrChartData.byPharmacy
                      ).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Cell
                          key={i}
                          fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {isManager && managerChartData.byProduct?.length > 0 && (
          <Card className="border-slate-200 lg:col-span-2 rounded-2xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Products Discussed
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Audit frequency by product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={managerChartData.byProduct}
                    margin={{ top: 8, right: 8, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Audits"
                      radius={[4, 4, 0, 0]}
                    >
                      {managerChartData.byProduct.map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Cell
                          key={i}
                          fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent visits table */}
      <Card className="border-slate-200 rounded-2xl bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">
              Recent Visits
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Latest submitted visits across your territory.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 items-center gap-1.5 rounded-full border-slate-200 px-3 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
              asChild
            >
              <Link href={isManager ? "/mr/dashboard" : "/mr/history"}>
                <span>{isManager ? "View Dashboard" : "View all"}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentVisits.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-500">
              <Eye className="mb-2 h-6 w-6 text-slate-400" />
              <p className="font-medium text-slate-700">No visits yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Once visits are submitted, they will appear here with quick access.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Pharmacy
                      </TableHead>
                      {isManager && (
                        <>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Region
                          </TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Objective
                          </TableHead>
                        </>
                      )}
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Check-in
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVisits.map((v) => (
                      <TableRow
                        key={v.id}
                        className="transition-colors duration-150 hover:bg-slate-50"
                      >
                        <TableCell className="text-sm font-medium text-slate-900">
                          {v.pharmacy}
                        </TableCell>
                        {isManager && (
                          <>
                            <TableCell className="text-sm text-slate-600">
                              {v.region ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.objective ? (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  {v.objective}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-sm text-slate-600">
                          {new Date(v.checkIn).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              asChild
                            >
                              <Link href={`/mr/visit/${v.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {mode === "mr" && v.canEdit ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                asChild
                                aria-label="Edit visit"
                              >
                                <Link href={`/mr/visit/${v.id}/edit`}>
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-not-allowed rounded-full text-slate-300 hover:bg-slate-50"
                                disabled
                                aria-label="Edit not available"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 cursor-not-allowed rounded-full text-slate-300 hover:bg-slate-50"
                              disabled
                              aria-label="Delete (coming soon)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
