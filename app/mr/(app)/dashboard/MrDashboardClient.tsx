"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Coins,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MrCalendarWidget } from "@/components/mr/MrCalendarWidget";
import type { RetailHealthMetrics } from "@/lib/mr/retail-health-metrics";

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
    <div className="rounded-lg border border-slate-600 bg-white px-3 py-2 shadow-md">
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
  retailHealthMetrics,
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
  retailHealthMetrics: RetailHealthMetrics;
}) {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const filteredVisits =
    regionFilter === "all"
      ? visitsTable
      : visitsTable.filter((v) => v.region === regionFilter);

  const regions = Array.from(
    new Set(visitsTable.map((v) => v.region).filter(Boolean))
  ).sort() as string[];

  const totalRegionVisits = chartData.byRegion.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Row 1: CTA card + Demographic (donut) */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-12">
        
        {/* CTA – product-focused pharmacy visit banner */}
        <div className="lg:col-span-8 space-y-4 col-span-12">
          <div className=" overflow-hidden rounded-3xl bg-gradient-to-br from-blue-200 via-blue-500/70 to-blue-600 dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-900 p-6 sm:p-8 lg:p-10 border border-transparent dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div className="space-y-4 sm:space-y-6 max-w-md">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
                  Plan your next pharmacy visit
                </h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                  Quickly log pharmacy visits, product audits, stock checks, and competitor
                  insights. Open your pharmacy list to check in and capture everything from a
                  single, focused workspace.
                </p>
                <Button
                  asChild
                  size="lg"
                
                  className="rounded-full py-8 flex items-center justify-center border-2 border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-200 dark:hover:text-gray-900 px-6 sm:px-8 h-10 sm:h-12 font-medium"
                >
                  <Link href="/mr/visit/create">
                    <MapPin className="mr-2 h-4 w-4" />
                    Start Visit
                  </Link>
                </Button>
              </div>

              {/* Right Illustration */}
              <div className="flex justify-center lg:justify-end mt-6 lg:mt-0">
                <div className="relative w-full max-w-xs sm:max-w-sm h-48 sm:h-56 lg:h-60">
                  <Image
                    src="https://kochi.figma.site/_assets/v11/4abacce8a2fca6d0db987825f87ec79ca967f6ef.png"
                    alt="Professional assessment for assistive technology - schedule your appointment"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>          
          </div>
          {/* Retail health — basket value & patient flow from AUDIT visits */}
          <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900 dark:text-white">
                Retail health metrics
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Basket value and patient volume from submitted AUDIT visits (when
                captured at check-out).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retailHealthMetrics.totalAuditVisits === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-600 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                  No AUDIT visits yet. Finish visits with objective AUDIT and submit
                  audit metrics to see retail health averages.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex gap-4 rounded-2xl border border-slate-600 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/80">
                      <Coins className="h-6 w-6 text-blue-800 dark:text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Basket value (KES / patient)
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                        {retailHealthMetrics.avgBasketValueKes != null
                          ? `KES ${retailHealthMetrics.avgBasketValueKes.toLocaleString()}`
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {retailHealthMetrics.visitsWithBasketValue > 0
                          ? `Average across ${retailHealthMetrics.visitsWithBasketValue} visit${retailHealthMetrics.visitsWithBasketValue !== 1 ? "s" : ""} with data`
                          : "Not captured yet — add basket value when finishing AUDIT visits"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-2xl border border-slate-600 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/80">
                      <Users className="h-6 w-6 text-teal-800 dark:text-teal-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Patients per day
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                        {retailHealthMetrics.avgPatientsPerDay != null
                          ? retailHealthMetrics.avgPatientsPerDay.toLocaleString()
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {retailHealthMetrics.visitsWithPatients > 0
                          ? `Average across ${retailHealthMetrics.visitsWithPatients} visit${retailHealthMetrics.visitsWithPatients !== 1 ? "s" : ""} with data`
                          : "Not captured yet — add patients per day when finishing AUDIT visits"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* {retailHealthMetrics.totalAuditVisits > 0 ? (
                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Based on {retailHealthMetrics.totalAuditVisits} submitted AUDIT
                  visit{retailHealthMetrics.totalAuditVisits !== 1 ? "s" : ""} in
                  scope.
                </p>
              ) : null} */}
            </CardContent>
          </Card>
        </div>
        {/* Visit demographic – revamped UI */}
        <Card className="rounded-3xl lg:col-span-4 col-span-12 border-2 border-gray-400 bg-white shadow-sm dark:border-gray-600 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 sm:pb-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Visit demographics
              </CardTitle>
              <CardDescription className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-400">
                By region · submitted visits
              </CardDescription>
            </div>
            <CardAction>
              <Button
                asChild
                size="sm"
                className="rounded-full !bg-[#0b1b53] hover:!bg-[#0b1b53]/90 dark:!bg-blue-600 dark:hover:!bg-blue-600/90 !text-white px-4 sm:px-6 h-9 sm:h-10 text-[13px] sm:text-[14px] font-medium"
              >
                <Link href="/mr/pharmacies">View pharmacies</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {chartData.byRegion.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-50/50 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                No visit data yet. Start a visit from pharmacies to see region insights.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 lg:items-center">
                {/* Donut chart with center metric */}
                <div className="relative flex items-center justify-center">
                  <div className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.byRegion}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={82}
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
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                      {totalRegionVisits}
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300">
                      Visits by region
                    </p>
                  </div>
                </div>

                {/* Legend – pill style badges */}
                <div className="flex flex-1 flex-wrap justify-center gap-2 sm:gap-3 text-sm lg:justify-center">
                  {chartData.byRegion.map((r, i) => (
                    <span
                      key={r.name}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-400 px-3 py-1.5 sm:px-4 sm:py-2 text-[12px] sm:text-[13px] font-medium text-slate-900 dark:text-slate-50 dark:border-slate-600"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                      <span className="whitespace-nowrap">
                        {r.name}{" "}
                        ({totalRegionVisits > 0
                          ? Math.round((r.value / totalRegionVisits) * 100)
                          : 0}
                        %)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Field metrics — gradient stat cards */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/60 dark:border-slate-600 dark:bg-slate-900 dark:shadow-none">
        <CardHeader className="pb-2 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Field performance
            </CardTitle>
            <CardDescription className="text-[13px] text-slate-600 dark:text-slate-400">
              Key metrics from submitted visits — select a metric to open the related report or list.
            </CardDescription>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-2 shrink-0 rounded-full border-2 border-[#0b1b53] bg-white text-[13px] font-medium text-slate-900 hover:bg-[#0b1b53] hover:text-white dark:border-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-200 dark:hover:text-slate-900 sm:mt-0"
          >
            <Link href="/mr/reports">
              All reports
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pb-6 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/mr/history"
              title="Open visit history"
              className="group flex min-h-[200px] flex-col rounded-xl border border-slate-200/90 bg-gradient-to-br from-amber-50 via-orange-50/80 to-stone-100/60 p-4 shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2 dark:border-slate-600 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <MapPin
                  className="h-5 w-5 shrink-0 text-slate-900 dark:text-slate-100"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <TrendingUp
                  className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400"
                  aria-hidden
                />
              </div>
              <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Total visits
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {kpis.totalVisits.toLocaleString()}
              </p>
              <p className="mt-auto pt-3 text-[13px] font-medium text-blue-600 dark:text-sky-400">
                All-time recorded
              </p>
            </Link>

            <Link
              href="/mr/reports/out-of-stock"
              title="Open out-of-stock report"
              className="group flex min-h-[200px] flex-col rounded-xl border border-slate-200/90 bg-gradient-to-br from-violet-100/90 via-purple-50/80 to-indigo-50/70 p-4 shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2 dark:border-slate-600 dark:from-slate-800 dark:via-violet-950/40 dark:to-slate-900 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <Package
                  className="h-5 w-5 shrink-0 text-slate-900 dark:text-slate-100"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <TrendingUp
                  className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400"
                  aria-hidden
                />
              </div>
              <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Stock-outs
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-amber-900 dark:text-amber-200">
                {kpis.stockOuts.toLocaleString()}
              </p>
              <p className="mt-auto pt-3 text-[13px] font-medium text-blue-600 dark:text-sky-400">
                From product audits
              </p>
            </Link>

            <Link
              href="/mr/history"
              title="Open visit history (duration per visit)"
              className="group flex min-h-[200px] flex-col rounded-xl border border-slate-200/90 bg-gradient-to-br from-rose-100/80 via-orange-50/70 to-amber-50/60 p-4 shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2 dark:border-slate-600 dark:from-slate-800 dark:via-rose-950/30 dark:to-slate-900 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <Clock
                  className="h-5 w-5 shrink-0 text-slate-900 dark:text-slate-100"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <TrendingUp
                  className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400"
                  aria-hidden
                />
              </div>
              <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Avg duration
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {kpis.avgDuration} min
              </p>
              <p className="mt-auto pt-3 text-[13px] font-medium text-blue-600 dark:text-sky-400">
                Per completed visit
              </p>
            </Link>

            <div className="flex min-h-[200px] flex-col rounded-xl border border-slate-200/90 bg-gradient-to-br from-sky-100/90 via-blue-50/80 to-cyan-50/70 p-4 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:via-sky-950/35 dark:to-slate-900">
              <Link
                href="/mr/pharmacies"
                title="Open pharmacy list and coverage"
                className="group flex min-h-0 flex-1 flex-col rounded-lg outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <Building2
                    className="h-5 w-5 shrink-0 text-slate-900 dark:text-slate-100"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <Clock
                    className="h-4 w-4 shrink-0 text-slate-900 dark:text-slate-100"
                    aria-hidden
                  />
                </div>
                <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  Pharmacies
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {kpis.uniquePharmacies.toLocaleString()}
                  <span className="ml-1 text-xl font-semibold text-slate-500 dark:text-slate-400">
                    / {kpis.totalPharmacies.toLocaleString()}
                  </span>
                </p>
                <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                  {kpis.totalPharmacies > 0
                    ? `${Math.round((kpis.uniquePharmacies / kpis.totalPharmacies) * 100)}% of network visited`
                    : "Network coverage"}
                </p>
              </Link>
              <Button
                asChild
                className="mt-3 w-full rounded-lg bg-[#0b1b53] text-[13px] font-semibold text-white hover:bg-[#152a6b] dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                <Link href="/mr/dashboard#dashboard-calendar">View Calendar</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Top pharmacies list + Calendar */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-12">
        {/* Calendar */}
        <div className="lg:col-span-8 col-span-12 scroll-mt-24" id="dashboard-calendar">
          <MrCalendarWidget visits={visitsTable} />
        </div>
        {/* Top pharmacies / See more */}
        
        <div className="lg:col-span-4 col-span-12">
        <Card className="border-slate-600">
          <CardHeader>
            <CardTitle className="text-base">Visit objectives</CardTitle>
            <CardDescription>By type</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byObjective.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-50/50 text-center text-sm text-slate-500">
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
      </div>


      {/* Charts row */}
      <div className="grid gap-6 hidden lg:grid-cols-3">
        <Card className="border-slate-600 bg-white dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">Visits over time</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Submitted visits by month</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byMonth.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-100 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
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
        <Card className="border-slate-600">
          <CardHeader>
            <CardTitle className="text-base">Visit objectives</CardTitle>
            <CardDescription>By type</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.byObjective.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-50/50 text-center text-sm text-slate-500">
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
      <Card className="border-slate-600 bg-white dark:border-slate-700 dark:bg-slate-900 hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base text-slate-900 dark:text-white">Recent visits</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Latest submitted visits</CardDescription>
          </div>
          <CardAction>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 w-[180px] rounded-lg border border-slate-600 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
            <div className="flex h-48 flex-col  items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-50/50 text-center text-sm text-slate-500">
              No visits yet
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-600">
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
