"use client";

import { useState } from "react";
import Link from "next/link";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  ExternalLink,
  Clock,
  Building2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CHART_COLORS = [
  "#1e3a5f", // dark blue
  "#2563eb", // blue
  "#0ea5e9", // sky
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#f97316", // orange
  "#ec4899", // pink
  "#eab308", // amber
];
const DONUT_COLORS = ["#1e3a5f", "#2563eb", "#0ea5e9"];
const AREA_GRADIENT_COLOR = "#2563eb";

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
  recentPharmacies = [],
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
  recentPharmacies?: { name: string; value: number }[];
}) {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const filteredVisits =
    regionFilter === "all"
      ? visitsTable
      : visitsTable.filter((v) => v.region === regionFilter);

  const regions = Array.from(
    new Set(visitsTable.map((v) => v.region).filter(Boolean))
  ).sort() as string[];

  const calendarDays = (() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const total = startPad + daysInMonth;
    const rows = Math.ceil(total / 7);
    const out: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length < rows * 7) out.push(null);
    return out;
  })();

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Row 1: CTA card + Demographic (donut) */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {/* CTA – quick action to pharmacies */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:from-slate-800 dark:to-slate-800 dark:ring-1 dark:ring-slate-700">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white/70 p-4 dark:bg-slate-700/50">
              <ClipboardList className="h-12 w-12 text-slate-800 dark:text-slate-200" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Start a pharmacy visit
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Log pharmacy visits, product audits, and competitor insights.
                Select a pharmacy to check in and record your visit.
              </p>
              <Button
                asChild
                className="mt-4 rounded-full border-2 border-slate-900 bg-white px-5 font-medium text-slate-900 hover:bg-slate-50 hover:text-slate-900"
              >
                <Link href="/mr/pharmacies">
                  <MapPin className="mr-2 h-4 w-4" />
                  Go to Pharmacies
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visit demographic – donut + quick action */}
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Visit demographic
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                By region · submitted visits
              </CardDescription>
            </div>
            <CardAction>
              <Button asChild size="sm" className="rounded-lg bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500">
                <Link href="/mr/pharmacies">View Pharmacies</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {chartData.byRegion.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No visit data yet. Start a visit from Pharmacies.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.byRegion}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {chartData.byRegion.map((_, i) => (
                          <Cell
                            key={i}
                            fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
                  {chartData.byRegion.map((r, i) => (
                    <span
                      key={r.name}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                      {r.name} ({chartData.byRegion.length > 0
                        ? Math.round(
                            (r.value /
                              chartData.byRegion.reduce((a, x) => a + x.value, 0)) *
                              100
                          )
                        : 0}
                      %)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top pharmacies list + Calendar */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {/* Top pharmacies / See more */}
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Top pharmacies by visits
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Most frequently visited
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPharmacies.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                <MapPin className="mb-2 h-8 w-8 text-slate-500 dark:text-slate-400" />
                No pharmacy visits yet
              </div>
            ) : (
              <ul className="space-y-3">
                {recentPharmacies.slice(0, 4).map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-medium text-slate-800 dark:bg-slate-600 dark:text-slate-200">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                      <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                        {p.value} visit{p.value !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" className="mt-3 w-full text-slate-700 dark:text-slate-300">
              <Link href="/mr/pharmacies">
                See more →
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              {calendarMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                  )
                }
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                  )
                }
              >
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekDays.map((d) => (
                <div key={d} className="font-medium text-slate-600 dark:text-slate-400">
                  {d}
                </div>
              ))}
              {calendarDays.map((d, i) =>
                d === null ? (
                  <div key={`e-${i}`} className="h-8" />
                ) : (
                  <div
                    key={d}
                    className="flex h-8 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {d}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI cards – compact grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total visits
            </CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
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
            <Package className="h-4 w-4 text-amber-500" />
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
              Avg duration
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
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
              Pharmacies
            </CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
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
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">Visits over time</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Submitted visits by month</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byMonth.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
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
                        <stop offset="0%" stopColor={AREA_GRADIENT_COLOR} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={AREA_GRADIENT_COLOR} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="visits" stroke={AREA_GRADIENT_COLOR} fill="url(#visitsGradient)" name="Visits" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Visit objectives</CardTitle>
            <CardDescription>By type</CardDescription>
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
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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

      {/* Recent visits table */}
      <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-white">Recent visits</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Latest submitted visits</CardDescription>
          </div>
          <CardAction>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
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
                      <TableHead className="text-slate-600 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((v) => (
                      <TableRow key={v.id} className="transition-colors hover:bg-slate-50/50">
                        <TableCell className="text-slate-700">
                          {new Date(v.checkIn).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">{v.region || "—"}</TableCell>
                        <TableCell className="text-right">
                          {v.id ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/mr/visit/${v.id}`}>
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
