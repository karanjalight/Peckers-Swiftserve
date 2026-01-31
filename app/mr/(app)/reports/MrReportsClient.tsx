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
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Vibrant palette matching dashboard
const CHART_COLORS = [
  "#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899",
  "#eab308", "#22c55e", "#f43f5e",
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

type ManagerKpis = {
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

type ManagerChartData = {
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

type RecentVisit = {
  id: string;
  checkIn: string;
  pharmacy: string;
  region?: string;
  objective?: string;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isManager ? "Field Intelligence Reports" : "My Reports"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isManager
            ? "Comprehensive analytics and performance metrics across all MR activity"
            : "Your visit activity and performance summary"}
        </p>
      </div>

      {/* KPI cards */}
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
              Pharmacies Visited
            </CardTitle>
            <div className="rounded-lg bg-violet-100 p-2">
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
                  {managerKpis.stockOuts}
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
                  {managerKpis.substitutionRate}%
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Visits Over Time</CardTitle>
            <CardDescription>
              {isManager ? "All submitted visits by month" : "Your visits by month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isManager ? managerChartData.byMonth : mrChartData.byMonth).length ===
            0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
                No visit data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      isManager ? managerChartData.byMonth : mrChartData.byMonth
                    }
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

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Visit Objectives</CardTitle>
            <CardDescription>Breakdown by objective type</CardDescription>
          </CardHeader>
          <CardContent>
            {(isManager ? managerChartData.byObjective : mrChartData.byObjective)
              .length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
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
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${percent != null ? (percent * 100).toFixed(0) : ""}%`
                      }
                    >
                      {(isManager
                        ? managerChartData.byObjective
                        : mrChartData.byObjective
                      ).map((_, i) => (
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

      {/* Region / Pharmacy charts - manager only or MR pharmacy chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isManager && managerChartData.byRegion?.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Visits by Region</CardTitle>
              <CardDescription>Submitted visits per region</CardDescription>
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
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">
              {isManager ? "Top Pharmacies" : "My Top Pharmacies"}
            </CardTitle>
            <CardDescription>
              {isManager ? "Most frequently visited" : "Your most visited pharmacies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isManager
              ? managerChartData.byPharmacy
              : mrChartData.byPharmacy
            ).length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
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
                      {(isManager ? managerChartData.byPharmacy : mrChartData.byPharmacy).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {isManager && managerChartData.byProduct?.length > 0 && (
          <Card className="border-slate-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Products Discussed</CardTitle>
              <CardDescription>Audit frequency by product</CardDescription>
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
                        <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
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
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Visits</CardTitle>
            <CardDescription>Latest submitted visits</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={isManager ? "/mr/dashboard" : "/mr/history"}>
              {isManager ? "View Dashboard" : "View all"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentVisits.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center text-sm text-slate-500">
              No visits yet
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur hover:bg-slate-50/95">
                      <TableHead className="text-slate-600">Pharmacy</TableHead>
                      {isManager && (
                        <>
                          <TableHead className="text-slate-600">Region</TableHead>
                          <TableHead className="text-slate-600">Objective</TableHead>
                        </>
                      )}
                      <TableHead className="text-slate-600">Check-in</TableHead>
                      <TableHead className="text-slate-600 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVisits.map((v) => (
                      <TableRow key={v.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          {v.pharmacy}
                        </TableCell>
                        {isManager && (
                          <>
                            <TableCell className="text-slate-600">
                              {v.region ?? "—"}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {v.objective ?? "—"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-slate-600">
                          {new Date(v.checkIn).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/mr/visit/${v.id}`}>View</Link>
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
