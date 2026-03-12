"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  Download,
  Filter,
  LineChart,
  MapPin,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from "recharts";
import type { ProductIntelligenceData } from "./page";

type ProductOverview = {
  id: string;
  name: string;
  sku?: string | null;
  owned_by?: string | null;
};

export function MrProductIntelligenceClient({
  product,
  data,
}: {
  product: ProductOverview;
  data: ProductIntelligenceData;
}) {
  const [activeTab, setActiveTab] = useState<string>("overview");

  function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const value = row[h];
            const s =
              value == null
                ? ""
                : typeof value === "string"
                ? value
                : String(value);
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Back + premium hero */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mr/products" className="gap-1.5 -ml-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-xl ring-1 ring-blue-800/60">
          <div className="px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Product Intelligence Dashboard
                </div>
                <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-blue-100/90">
                  {product.sku && (
                    <span className="inline-flex items-center rounded-full bg-blue-900/50 px-3 py-1">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.owned_by && (
                    <span className="inline-flex items-center rounded-full bg-blue-900/50 px-3 py-1">
                      Owned by {product.owned_by}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-blue-900/30 px-3 py-1">
                    MR field insights & analytics
                  </span>
                </div>
                <p className="max-w-2xl text-xs text-blue-100/80 sm:text-sm">
                  Deep view of doctor adoption, competitor pressure, stock
                  issues, and field feedback for this product, based on MR
                  visits.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-xs font-semibold text-blue-50 hover:bg-white/20 hover:text-white"
                  onClick={() => {
                    downloadCsv("product-intelligence-overview.csv", [
                      {
                        product: product.name,
                        total_visits: data.kpis.totalVisits,
                        doctors_prescribing: data.kpis.doctorsPrescribing,
                        competitor_mentions: data.kpis.competitorMentions,
                        total_days_oos: data.kpis.totalDaysOos,
                        market_sentiment: data.kpis.marketSentiment,
                      },
                    ]);
                  }}
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Export current view
                </Button>
                <div className="flex flex-wrap gap-2 text-xs text-blue-100/80">
                  <span className="inline-flex items-center rounded-full bg-blue-900/50 px-3 py-1">
                    Last 90 days
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-900/40 px-3 py-1">
                    Based on MR visit data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global filters */}
      <div className="flex hidden flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Calendar className="h-3.5 w-3.5" />
            Last 90 days
          </Button>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <MapPin className="h-3.5 w-3.5" />
            All territories
          </Button>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Users className="h-3.5 w-3.5" />
            All MRs
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Quick search in product insights"
              className="h-9 rounded-full bg-slate-50 text-xs md:text-sm dark:bg-slate-900/60"
            />
          </div>
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total MR visits"
          value={String(data.kpis.totalVisits)}
          helper="Unique visits including this product"
        />
        <KpiCard
          label="Doctors prescribing"
          value={String(data.kpis.doctorsPrescribing)}
          helper="Distinct doctors with Rx/month captured"
        />
        <KpiCard
          label="Total days out of stock"
          value={String(data.kpis.totalDaysOos)}
          helper="Across all audited pharmacies"
          tone={data.kpis.totalDaysOos > 0 ? "danger" : "positive"}
        />
        <KpiCard
          label="Competitor mentions"
          value={String(data.kpis.competitorMentions)}
          helper="From competitor audits"
          tone={data.kpis.competitorMentions > 0 ? "warning" : undefined}
        />
        <KpiCard
          label="Market sentiment"
          value={data.kpis.marketSentiment}
          helper="Heuristic from substitution & stock-outs"
          tone={
            data.kpis.marketSentiment === "Positive"
              ? "positive"
              : data.kpis.marketSentiment === "Neutral"
              ? undefined
              : "danger"
          }
        />
      </div>

      {/* Tabs + main layout */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-900/60">
            <TabsTrigger
              value="overview"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="prescribers"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Doctor prescribing
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Competitor activity
            </TabsTrigger>
            <TabsTrigger
              value="competitors"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Competitors
            </TabsTrigger>
            <TabsTrigger
              value="stock"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Stock insights
            </TabsTrigger>
            {/* <TabsTrigger
              value="reports"
              className="rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Reports
            </TabsTrigger> */}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full border-slate-00 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 sm:inline-flex"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Export reports 
          </Button>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Doctor prescribing summary */}
              <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                      Doctor prescribing trends
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                      Prescriptions per month and doctor adoption segments.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                    {data.charts.rxByMonth.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No prescription data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.charts.rxByMonth.map((d) => ({
                            ...d,
                            label: formatMonthLabel(d.name),
                          }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="rxGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#0ea5e9"
                                stopOpacity={0.5}
                              />
                              <stop
                                offset="100%"
                                stopColor="#0ea5e9"
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            formatter={(value) => [`${value} Rx/month`, "Rx"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="prescriptions"
                            stroke="#0284c7"
                            fill="url(#rxGradient)"
                            strokeWidth={2}
                            name="Prescriptions"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniSegmentCard
                      label="High prescribers"
                      value="18"
                      helper="≥ 20 Rx / month"
                    />
                    <MiniSegmentCard
                      label="Declining prescribers"
                      value="7"
                      helper="Drop vs last period"
                      tone="warning"
                    />
                    <MiniSegmentCard
                      label="New adopters"
                      value="12"
                      helper="First Rx in last 90 days"
                      tone="positive"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visit feedback timeline */}
              <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                    Latest visit reviews & feedback
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    MR conversations, concerns, and praise captured for this
                    product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-slate-200 text-[11px] font-medium dark:border-slate-700"
                    >
                      All sentiments
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    >
                      Positive
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      Neutral
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-rose-200 bg-rose-50 text-[11px] font-medium text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
                    >
                      Negative
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {data.feedback.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No visit notes captured for this product in the selected
                        period. Add notes on visits to see qualitative feedback
                        here.
                      </p>
                    ) : (
                      data.feedback.slice(0, 5).map((fb, idx) => (
                        <div
                          key={`${fb.mrName ?? "mr"}-${idx}`}
                          className="relative flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40 sm:p-4 sm:text-sm"
                        >
                          <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[11px] font-semibold text-white shadow-sm sm:text-xs">
                            <div className="flex h-full items-center justify-center">
                              MR
                            </div>
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-slate-50">
                                {fb.mrName ?? "MR"}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                visited{" "}
                                <span className="font-medium">
                                  {fb.doctorName ?? "Doctor not captured"}
                                </span>
                              </span>
                              <span className="ml-auto text-[11px] text-slate-500">
                                {fb.visitDate
                                  ? new Date(
                                      fb.visitDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200">
                              {fb.notes}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`rounded-full text-[11px] font-medium ${
                                  fb.sentiment === "Positive"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                                    : fb.sentiment === "Negative"
                                    ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
                                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                                }`}
                              >
                                {fb.sentiment}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 text-[11px] font-medium dark:border-slate-700"
                              >
                                Visit notes
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: competitors + stock + activity */}
            <div className="space-y-6">
              <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-900 dark:text-slate-50">
                    Competitor pressure
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Top molecules doctors mention instead of this product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-28 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Bar chart placeholder – competitor mentions (
                      {data.competitors.length} rows)
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                    {data.competitors.length === 0 ? (
                      <li className="text-slate-500 dark:text-slate-400">
                        No competitor audits captured for this product in the
                        selected period.
                      </li>
                    ) : (
                      data.competitors.slice(0, 3).map((c) => (
                        <li
                          key={c.competitorName}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {c.competitorName}
                            {c.supplier ? ` (${c.supplier})` : ""}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              c.pressure === "High"
                                ? "bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100"
                                : c.pressure === "Medium"
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                            }`}
                          >
                            {c.pressure} pressure
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-900 dark:text-slate-50">
                    Stock availability
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Stock-outs reported across pharmacies where this product is
                    audited.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Timeline placeholder – days out of stock
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                    <li className="flex items-center justify-between gap-2">
                      <span>Highest OOS region</span>
                      <span>
                        {data.stock.mostAffectedRegion ?? "No stock-outs"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span>Doctors reporting OOS</span>
                      <span>{data.stock.doctorsReportingOos}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm text-slate-900 dark:text-slate-50">
                    <span>Competitor activity feed</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Last 90 days
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {data.activities.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No competitor marketing activities linked to visits for
                      this product in the selected period.
                    </p>
                  ) : (
                    data.activities.slice(0, 5).map((a, idx) => (
                      <ActivityEvent
                        key={`${a.label}-${idx}`}
                        label={a.label}
                        detail={a.detail}
                        meta={a.meta}
                        tone={a.tone}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* PRESCRIBERS TAB */}
        <TabsContent value="prescribers" className="space-y-4">
          <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                    Doctor prescribing insights
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Who is prescribing, at what frequency, and where.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Search doctor or hospital"
                    className="h-9 w-44 rounded-full bg-slate-50 text-xs md:w-56 md:text-sm dark:bg-slate-900/60"
                  />
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                    onClick={() => {
                      const rows = data.prescribers.map((p) => ({
                        doctor_name: p.doctorName,
                        hospital: p.hospital,
                        rx_per_month: p.rxPerMonth ?? "",
                        last_visit: p.lastVisit ?? "",
                        mr: p.mrName ?? "",
                      }));
                      downloadCsv("product-prescribers.csv", rows);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 dark:bg-slate-900/40">
                      <TableHead className="text-xs font-semibold">
                        Doctor
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Specialty
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Hospital / Clinic
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Rx / month
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Last visit
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        MR
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Segment
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.prescribers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-xs text-slate-500 dark:text-slate-400"
                        >
                          No prescription audits captured for this product in
                          the selected period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.prescribers.map((row) => {
                        const segment =
                          (row.rxPerMonth ?? 0) >= 20
                            ? "High prescriber"
                            : (row.rxPerMonth ?? 0) >= 5
                            ? "New adopter"
                            : "Declining";
                        return (
                          <TableRow
                            key={`${row.doctorName}-${row.hospital}-${row.lastVisit}`}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/60"
                          >
                            <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-50">
                              {row.doctorName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {row.specialty ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {row.hospital}
                            </TableCell>
                            <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                              {row.rxPerMonth ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {row.lastVisit
                                ? new Date(
                                    row.lastVisit
                                  ).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {row.mrName ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              {segment === "High prescriber" && (
                                <Badge className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                                  High prescriber
                                </Badge>
                              )}
                              {segment === "New adopter" && (
                                <Badge className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                  New adopter
                                </Badge>
                              )}
                              {segment === "Declining" && (
                                <Badge className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                                  Declining
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPETITOR ACTIVITY TAB */}
        <TabsContent value="feedback">
          <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                  Competitor activity (detailed)
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  All competitor marketing actions captured on visits where this
                  product was discussed.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  onClick={() => {
                    // Simple printable view for PDF export via browser
                    const w = window.open("", "_blank");
                    if (!w) return;
                    const rows = data.activities;
                    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Competitor activity – ${product.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #0f172a; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Competitor activity – ${product.name}</h1>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Competitor</th>
        <th>Activity</th>
        <th>MR</th>
        <th>Pharmacy</th>
        <th>Region</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map((a) => {
          const d = a.date ? new Date(a.date).toLocaleDateString() : "—";
          return `<tr>
            <td>${d}</td>
            <td>${a.label}</td>
            <td>${a.detail}</td>
            <td>${a.mrName ?? ""}</td>
            <td>${a.pharmacy ?? ""}</td>
            <td>${a.region ?? ""}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                    w.print();
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  onClick={() => {
                    const rows = data.activities.map((a) => ({
                      date: a.date ?? "",
                      competitor: a.label,
                      activity: a.detail,
                      mr: a.mrName ?? "",
                      pharmacy: a.pharmacy ?? "",
                      region: a.region ?? "",
                    }));
                    downloadCsv("competitor-activity.csv", rows);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activities.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No competitor marketing activities linked to visits for this
                  product in the selected period.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.activities.map((a, idx) => (
                    <div
                      key={`${a.label}-${idx}`}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40 sm:p-4 sm:text-sm"
                    >
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-slate-700 sm:text-xs">
                        {a.label.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {a.label}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {a.pharmacy ?? "Unknown pharmacy"}
                            {a.region ? ` · ${a.region}` : ""}
                          </span>
                          <span className="ml-auto text-[11px] text-slate-500">
                            {a.date
                              ? new Date(a.date).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200">
                          {a.detail}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {a.mrName
                            ? `Reported by ${a.mrName}`
                            : "Reporting MR not captured"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                    Competitor analysis
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Products mentioned in visits where this product was
                    discussed.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 sm:inline-flex"
                  onClick={() => {
                    const rows = data.competitors.map((c) => ({
                      competitor_name: c.competitorName,
                      supplier: c.supplier ?? "",
                      mentions: c.mentions,
                      avg_price_per_pack: c.avgPricePerPack ?? "",
                      pressure: c.pressure,
                      marketing_events: c.marketingEvents,
                      notes_sample: c.notesSample ?? "",
                    }));
                    downloadCsv("product-competitors.csv", rows);
                  }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-900/40">
                        <TableHead className="text-xs font-semibold">
                          Competitor product
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Manufacturer
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Doctors mentioning
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          MR notes
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Pressure
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.competitors.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-xs text-slate-500 dark:text-slate-400"
                          >
                            No competitor audits captured for this product in
                            the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.competitors.map((c) => (
                          <TableRow
                            key={c.competitorName}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/60"
                          >
                            <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-50">
                              {c.competitorName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {c.supplier ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                              {c.mentions}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                              {c.notesSample ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              <Badge
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  c.pressure === "High"
                                    ? "bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100"
                                    : c.pressure === "Medium"
                                    ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
                                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                                }`}
                              >
                                {c.pressure}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <CardHeader>
                <CardTitle className="text-sm text-slate-900 dark:text-slate-50">
                  Mentions over time
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  How often each competitor is mentioned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                  {data.charts.competitorMentionsByMonth.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No competitor mentions yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.charts.competitorMentionsByMonth.map((d) => ({
                          ...d,
                          label: formatMonthLabel(d.name),
                        }))}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip formatter={(value) => [`${value}`, "Mentions"]} />
                        <Bar
                          dataKey="mentions"
                          name="Mentions"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STOCK TAB */}
        <TabsContent value="stock" className="space-y-4">
          <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                Stock availability insights
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                Out-of-stock patterns from MR field reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniSegmentCard
                  label="Total days OOS"
                  value={String(data.stock.totalDaysOos)}
                  helper="Across all pharmacies"
                />
                <MiniSegmentCard
                  label="Most affected region"
                  value={data.stock.mostAffectedRegion ?? "—"}
                  helper="Region with highest OOS days"
                />
                <MiniSegmentCard
                  label="Total lost sales"
                  value={(() => {
                    const total = data.stock.locationsWithOos.reduce(
                      (sum, loc) => sum + (loc.revenueLoss || 0),
                      0
                    );
                    return `KES ${Math.round(total).toLocaleString()}`;
                  })()}
                  helper="Estimated revenue loss (last 90 days)"
                  tone="warning"
                />
              </div>

              {/* Lost sales by pharmacy table */}
              <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm text-slate-900 dark:text-slate-50">
                      Lost sales estimate by pharmacy (this product)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                      Uses days out of stock, quantity sold in a good month, and
                      price per pack to estimate revenue loss.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                    onClick={() => {
                      const rows = data.stock.locationsWithOos.map((loc) => ({
                        pharmacy: loc.pharmacyName,
                        region: loc.region,
                        days_oos: loc.totalDaysOos,
                        avg_qty_good_month:
                          loc.avgQtyGoodMonth != null
                            ? Math.round(loc.avgQtyGoodMonth)
                            : "",
                        avg_price_per_pack:
                          loc.avgPricePerPack != null
                            ? Math.round(loc.avgPricePerPack)
                            : "",
                        volume_loss: Math.round(loc.volumeLoss),
                        revenue_loss: Math.round(loc.revenueLoss),
                      }));
                      downloadCsv("product-stock-lost-sales-by-pharmacy.csv", rows);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export table
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {data.stock.locationsWithOos.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400 sm:px-6">
                      No out-of-stock events with sales baselines recorded for
                      this product in the selected period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 dark:bg-slate-900/40">
                            <TableHead className="text-xs font-semibold">
                              Pharmacy
                            </TableHead>
                            <TableHead className="text-xs font-semibold">
                              Region
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-right">
                              Days OOS
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-right">
                              Qty sold (good month)
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-right">
                              Price/pack (KES)
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-right">
                              Volume loss (packs)
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-right">
                              Revenue loss (KES)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.stock.locationsWithOos.map((loc) => (
                            <TableRow
                              key={`${loc.pharmacyName}-${loc.region}-lost`}
                              className="hover:bg-slate-50 dark:hover:bg-slate-900/60"
                            >
                              <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-50">
                                {loc.pharmacyName}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                                {loc.region}
                              </TableCell>
                              <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                                {loc.totalDaysOos}
                              </TableCell>
                              <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                                {loc.avgQtyGoodMonth != null
                                  ? Math.round(loc.avgQtyGoodMonth)
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                                {loc.avgPricePerPack != null
                                  ? Math.round(loc.avgPricePerPack).toLocaleString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-xs text-right text-slate-900 dark:text-slate-50">
                                {Math.round(loc.volumeLoss).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-right font-semibold text-amber-700 dark:text-amber-300">
                                {Math.round(loc.revenueLoss).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports">
          <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                Product insight reports
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                Generate shareable reports for this product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Date range
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Territory
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                >
                  <Users className="h-3.5 w-3.5" />
                  MR
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ReportCard
                  title="Doctor prescribing report"
                  description="Doctor-level prescribing patterns, frequency, and adoption trends."
                />
                <ReportCard
                  title="Product performance report"
                  description="Overall performance, visits, feedback, and sentiment."
                />
                <ReportCard
                  title="Competitor analysis report"
                  description="Competitor mentions, pricing, and pressure indicators."
                />
                <ReportCard
                  title="Stock availability report"
                  description="Out-of-stock trends, locations impacted, and lost opportunity."
                />
                <ReportCard
                  title="MR visit feedback report"
                  description="Narrative feedback from MR visits for this product."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reports are generated using MR visits that include this
                  product in product audits or prescriptions.
                </p>
                <Button
                  size="sm"
                  className="h-8 gap-2 rounded-full bg-slate-900 text-[11px] font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Generate all reports (PDF bundle)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  trend,
  trendValue,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  trend?: "up" | "down";
  trendValue?: string;
  tone?: "positive" | "warning" | "danger";
}) {
  const toneClasses =
    tone === "positive"
      ? "from-emerald-50 to-emerald-100 border-emerald-100 text-emerald-900 dark:from-emerald-900/20 dark:to-emerald-900/40 dark:border-emerald-800/60"
      : tone === "warning"
      ? "from-amber-50 to-amber-100 border-amber-100 text-amber-900 dark:from-amber-900/20 dark:to-amber-900/40 dark:border-amber-800/60"
      : tone === "danger"
      ? "from-rose-50 to-rose-100 border-rose-100 text-rose-900 dark:from-rose-900/20 dark:to-rose-900/40 dark:border-rose-800/60"
      : "from-slate-50 to-slate-100 border-slate-200 text-slate-900 dark:from-slate-900/10 dark:to-slate-900/40 dark:border-slate-700";

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${toneClasses}`}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardDescription className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500/90 dark:text-slate-300/80">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0 text-[11px] text-slate-600 dark:text-slate-300">
        <span>{helper}</span>
        {trend && trendValue && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              trend === "up"
                ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-rose-100/80 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trendValue}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function MiniSegmentCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "positive" | "warning";
}) {
  const badgeTone =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
      : "bg-slate-50 text-slate-800 dark:bg-slate-900/40 dark:text-slate-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/50 sm:p-3.5 sm:text-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper && (
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      )}
      <div className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold">
        <span className={badgeTone}>Segment</span>
      </div>
    </div>
  );
}

function ActivityEvent({
  label,
  detail,
  meta,
  tone,
}: {
  label: string;
  detail: string;
  meta: string;
  tone?: "warning" | "info" | "danger";
}) {
  const iconColor =
    tone === "warning"
      ? "text-amber-500"
      : tone === "danger"
      ? "text-rose-500"
      : "text-blue-500";

  const badgeClasses =
    tone === "warning"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
      : tone === "danger"
      ? "bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100"
      : "bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100";

  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm dark:bg-slate-900">
        <Activity className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {label}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClasses}`}
          >
            Competitor activity
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-200">{detail}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{meta}</p>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/60 sm:p-5 sm:text-sm">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
          <FileText className="h-3.5 w-3.5" />
          Report
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
        >
          <FileText className="h-3.5 w-3.5" />
          PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </Button>
      </div>
    </div>
  );
}

