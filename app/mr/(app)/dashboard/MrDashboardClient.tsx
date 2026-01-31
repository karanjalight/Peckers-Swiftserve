"use client";

import { useState } from "react";
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
  AreaChart,
  Area,
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
  CardAction,
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
  ExternalLink,
  Clock,
  Building2,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Vibrant, unique palette for charts
const CHART_COLORS = [
  "#0ea5e9", // sky
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#f97316", // orange
  "#ec4899", // pink
  "#eab308", // amber
  "#22c55e", // emerald
  "#f43f5e", // rose
];
const AREA_GRADIENT_COLOR = "#0ea5e9";
const LINE_CHART_COLOR = "#8b5cf6";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
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

export function MrDashboardClient({
  kpis,
  chartData,
  visitsTable,
}: {
  kpis: {
    totalVisits: number;
    stockOuts: number;
    substitutionRate: number;
    avgDuration: number;
    uniquePharmacies: number;
    totalPharmacies: number;
    totalProductAudits: number;
    competitorCount: number;
  };
  chartData: {
    byRegion: { name: string; value: number }[];
    bySubRegion: { name: string; value: number }[];
    byProduct: { name: string; value: number }[];
    byMonth: { name: string; visits: number }[];
    byWeek: { name: string; visits: number }[];
    byObjective: { name: string; value: number }[];
    byPharmacy: { name: string; value: number }[];
  };
  visitsTable: { id: string; checkIn: string; region?: string }[];
}) {
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const filteredVisits =
    regionFilter === "all"
      ? visitsTable
      : visitsTable.filter((v) => v.region === regionFilter);

  const regions = Array.from(
    new Set(visitsTable.map((v) => v.region).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          MR Field Intelligence Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Field visit analytics, performance metrics, and insights. Read-only.
        </p>
      </div>

      {/* KPI cards - 2 rows */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Visits
            </CardTitle>
            <div className="rounded-lg bg-slate-100 p-2">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.totalVisits}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stock-outs
            </CardTitle>
            <div className="rounded-lg bg-amber-100 p-2">
              <Package className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">
              {kpis.stockOuts}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Substitution Rate
            </CardTitle>
            <div className="rounded-lg bg-emerald-100 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.substitutionRate}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Visit Duration
            </CardTitle>
            <div className="rounded-lg bg-blue-100 p-2">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.avgDuration} min
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pharmacies Visited
            </CardTitle>
            <div className="rounded-lg bg-violet-100 p-2">
              <Building2 className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.uniquePharmacies}
              <span className="ml-1 text-sm font-normal text-slate-500">
                / {kpis.totalPharmacies}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Product Audits
            </CardTitle>
            <div className="rounded-lg bg-rose-100 p-2">
              <BarChart3 className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.totalProductAudits}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Competitor Notes
            </CardTitle>
            <div className="rounded-lg bg-teal-100 p-2">
              <Target className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.competitorCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Visit Activity
            </CardTitle>
            <div className="rounded-lg bg-indigo-100 p-2">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {kpis.totalVisits > 0
                ? ((kpis.uniquePharmacies / kpis.totalVisits) * 100).toFixed(0)
                : 0}
              <span className="ml-1 text-sm font-normal text-slate-500">
                % coverage
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 - Visits over time + Objectives pie */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Visits Over Time</CardTitle>
            <CardDescription>Submitted visits by month</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byMonth.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No visit data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.byMonth}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="visitsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={AREA_GRADIENT_COLOR} stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor={AREA_GRADIENT_COLOR} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke={AREA_GRADIENT_COLOR}
                      fill="url(#visitsGradient)"
                      name="Visits"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Visit Objectives</CardTitle>
            <CardDescription>Breakdown by objective type</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byObjective.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.byObjective}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={64}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${percent != null ? (percent * 100).toFixed(0) : ""}%`
                      }
                    >
                      {chartData.byObjective.map((_, i) => (
                        <Cell
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

      {/* Charts row 2 - Region bar + Products bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Visits per Region</CardTitle>
            <CardDescription>Submitted visits by region</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byRegion.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No region data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.byRegion}
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
                    <Bar
                      dataKey="value"
                      name="Visits"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.byRegion.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Products Discussed</CardTitle>
            <CardDescription>Audit frequency by product</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byProduct.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No product data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.byProduct}
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 40, bottom: 0 }}
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
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Audits"
                      radius={[0, 4, 4, 0]}
                    >
                      {chartData.byProduct.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3 - Weekly trend + Top pharmacies */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Weekly Trend</CardTitle>
            <CardDescription>Last 12 weeks of visit activity</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byWeek.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No weekly data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData.byWeek}
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
                      dot={{ fill: LINE_CHART_COLOR, strokeWidth: 2 }}
                      activeDot={{ fill: "#a78bfa", stroke: LINE_CHART_COLOR, strokeWidth: 2 }}
                      name="Visits"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Top Pharmacies by Visits</CardTitle>
            <CardDescription>Most frequently visited</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byPharmacy.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No pharmacy data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.byPharmacy}
                    margin={{ top: 8, right: 8, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#64748b" }}
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
                      name="Visits"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.byPharmacy.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent visits table */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Visits</CardTitle>
            <CardDescription>Latest submitted visits</CardDescription>
          </div>
          <CardAction>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 w-[180px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20 focus:ring-offset-1"
            >
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {filteredVisits.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
              No visits yet
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur hover:bg-slate-50/95">
                      <TableHead className="text-slate-600">Check-in</TableHead>
                      <TableHead className="text-slate-600">Region</TableHead>
                      <TableHead className="text-slate-600 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((v) => (
                      <TableRow
                        key={v.id}
                        className="transition-colors hover:bg-slate-50/50"
                      >
                        <TableCell className="text-slate-700">
                          {new Date(v.checkIn).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {v.region || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/mr/visit/${v.id}`}>
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Link>
                          </Button>
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
