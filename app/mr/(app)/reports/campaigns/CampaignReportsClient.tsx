"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
import { Button } from "@/components/ui/button";
import { Megaphone, Target, Timer, Users } from "lucide-react";

const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#22c55e", "#f97316", "#e11d48"];

const campaignPerformanceByProduct = [
  { product: "Ulgicid 200ml", value: 480000, units: 960, campaigns: 18 },
  { product: "SwiftPain 400mg", value: 520000, units: 1300, campaigns: 22 },
  { product: "Peckers Cough Syrup", value: 300000, units: 750, campaigns: 16 },
  { product: "LiverGuard Forte", value: 210000, units: 420, campaigns: 11 },
];

const campaignByRegion = [
  { region: "Nairobi", value: 550000, visits: 160, hours: 470 },
  { region: "Mt Kenya West_meru", value: 210000, visits: 72, hours: 210 },
  { region: "Nakuru-Naivasha", value: 180000, visits: 60, hours: 190 },
  { region: "Nyanza", value: 160000, visits: 55, hours: 180 },
];

const mrPerformance = [
  { mr: "Grace", value: 260000, units: 520, visits: 32, hours: 98 },
  { mr: "Kevin", value: 230000, units: 460, visits: 30, hours: 92 },
  { mr: "Faith", value: 210000, units: 430, visits: 28, hours: 89 },
  { mr: "Brian", value: 190000, units: 380, visits: 25, hours: 84 },
];

const timeline = [
  { month: "Jan", value: 180000, visits: 80 },
  { month: "Feb", value: 220000, visits: 90 },
  { month: "Mar", value: 260000, visits: 96 },
  { month: "Apr", value: 290000, visits: 100 },
];

const lostSalesFromOos = [
  { product: "Ulgicid 200ml", lost: 120000 },
  { product: "SwiftPain 400mg", lost: 90000 },
  { product: "Peckers Cough Syrup", lost: 65000 },
];

export function CampaignReportsClient() {
  const totalValue = campaignPerformanceByProduct.reduce((s, r) => s + r.value, 0);
  const totalUnits = campaignPerformanceByProduct.reduce((s, r) => s + r.units, 0);
  const totalVisits = campaignByRegion.reduce((s, r) => s + r.visits, 0);
  const totalHours = campaignByRegion.reduce((s, r) => s + r.hours, 0);
  const avgHoursPerDay = Math.round((totalHours / 22) * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Campaign performance (dummy data)
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            High‑level view of sales campaigns by product, region and MR – this page is fully driven
            by mock data for design and validation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-2xl border-slate-300 text-xs dark:border-slate-700"
          >
            Export CSV (stub)
          </Button>
          <Button
            size="sm"
            className="rounded-2xl bg-blue-900 text-xs text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Download PDF (stub)
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Campaign sales value
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                KES {totalValue.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Last 3 months (dummy)
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Megaphone className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Units from campaigns
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {totalUnits.toLocaleString()} packs
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Across all key products
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              <Target className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Campaign visits
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {totalVisits}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Average {(totalVisits / mrPerformance.length).toFixed(1)} per MR
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Active time per MR / day
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {avgHoursPerDay} hrs
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Target: 6 hours
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Timer className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Campaign sales by product (dummy)
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
              Value vs units per key product – this is a static design driven by mock data.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={campaignPerformanceByProduct}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="product" tick={{ fontSize: 10 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                  }}
                  formatter={(value: number, key: string) =>
                    key === "value"
                      ? [`KES ${value.toLocaleString()}`, "Campaign sales"]
                      : [`${value.toLocaleString()} packs`, "Units"]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="value"
                  name="Value (KES)"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="units"
                  name="Units"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Campaign value by region (dummy)
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
              Compare total campaign value and number of visits per region.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={campaignByRegion}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                  }}
                  formatter={(value: number, key: string) =>
                    key === "value"
                      ? [`KES ${value.toLocaleString()}`, "Campaign sales"]
                      : [`${value}`, "Visits"]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="value"
                  name="Value (KES)"
                  fill={CHART_COLORS[2]}
                  radius={[0, 4, 4, 0]}
                />
                <Bar dataKey="visits" name="Visits" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              MR campaign scoreboard (dummy)
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
              Value, units and campaign visits per MR compared to a notional target.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-1">
            <Table className="min-w-[520px] text-xs">
              <TableHeader>
                <TableRow className="border-slate-200/80 dark:border-slate-700/80">
                  <TableHead className="w-32">MR</TableHead>
                  <TableHead>Campaign value (KES)</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Campaign visits</TableHead>
                  <TableHead>Hours in outlet</TableHead>
                  <TableHead>6h target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mrPerformance.map((row, idx) => {
                  const hoursPerDay = row.hours / 22;
                  const activePct = Math.round((hoursPerDay / 6) * 100);
                  return (
                    <TableRow
                      key={row.mr}
                      className="border-slate-100 even:bg-slate-50/40 dark:border-slate-800 dark:even:bg-slate-900/40"
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                        {idx + 1}. {row.mr}
                      </TableCell>
                      <TableCell>KES {row.value.toLocaleString()}</TableCell>
                      <TableCell>{row.units.toLocaleString()}</TableCell>
                      <TableCell>{row.visits}</TableCell>
                      <TableCell>{row.hours} hrs</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                activePct >= 100 ? "bg-emerald-500" : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(100, activePct)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            {hoursPerDay.toFixed(1)}h / 6h
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Lost sales from stock‑outs (dummy)
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
              Approximate value the team has surfaced through campaign visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-60 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lostSalesFromOos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="product" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                  }}
                  formatter={(value: number) => [
                    `KES ${value.toLocaleString()}`,
                    "Estimated lost sales",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="lost"
                  stroke={CHART_COLORS[4]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Campaign value and visits over time (dummy)
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
            Trend of campaign value and number of campaign visits – static data for layout only.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  borderColor: "#e5e7eb",
                }}
                formatter={(value: number, key: string) =>
                  key === "value"
                    ? [`KES ${value.toLocaleString()}`, "Campaign value"]
                    : [`${value}`, "Campaign visits"]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                name="Value (KES)"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="visits"
                name="Visits"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

