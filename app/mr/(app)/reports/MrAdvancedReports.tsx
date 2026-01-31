"use client";

import { useState, useEffect } from "react";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingDown, AlertTriangle, BarChart3, Users, Megaphone, DollarSign, RefreshCw, Truck, ArrowLeftRight } from "lucide-react";

const CHART_COLORS = ["#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899", "#eab308", "#22c55e", "#f43f5e"];

type ReportData = {
  lostSales: Array<{
    pharmacy: string;
    region: string;
    product: string;
    daysOos: number;
    patientsPerDay: number;
    basketValue: number;
    lostRevenue: number;
  }>;
  substitutionThreat: Array<{ reason: string; count: number; topCompetitor: string }>;
  shareOfVoice: Array<{ product: string; prescribed: number; share: number }>;
  mrProductivity: Array<{ mr: string; pharmacy: string; checkIn: string; duration: number }>;
  topDoctors: Array<{ doctor: string; location: string; region?: string; totalRx: number; productCount: number }>;
  marketingByCompetitor: Record<string, Array<{ activity: string; reason: string }>>;
  comparativePricing: Array<{
    product: string;
    region: string;
    avgAuditPrice: number | null;
    avgCompetitorPrice: number | null;
    difference: number | null;
  }>;
  substitutionRateReport: Array<{
    product: string;
    prescribed: number;
    substituted: number;
    rate: number;
    mainRival: string;
  }>;
  supplyChainAttribution: Array<{ name: string; value: number }>;
};

export function MrAdvancedReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mr/reports");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load reports");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error) {
    return (
      <Card className="border-amber-200">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Advanced Reports</h2>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <Tabs defaultValue="lost-sales">
        <TabsList className="grid w-full grid-cols-3 gap-1 overflow-x-auto lg:grid-cols-5">
          <TabsTrigger value="lost-sales" className="gap-1 text-xs">
            <TrendingDown className="h-3.5 w-3.5" />
            Lost Sales
          </TabsTrigger>
          <TabsTrigger value="substitution-threat" className="gap-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Substitution Threat
          </TabsTrigger>
          <TabsTrigger value="share-of-voice" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Share of Voice
          </TabsTrigger>
          <TabsTrigger value="mr-productivity" className="gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            MR Productivity
          </TabsTrigger>
          <TabsTrigger value="doctors" className="gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            Doctors
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-1 text-xs">
            <Megaphone className="h-3.5 w-3.5" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1 text-xs">
            <DollarSign className="h-3.5 w-3.5" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="substitution-rate" className="gap-1 text-xs">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Substitution Rate
          </TabsTrigger>
          <TabsTrigger value="supply-chain" className="gap-1 text-xs">
            <Truck className="h-3.5 w-3.5" />
            Supply Chain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lost-sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>A. Lost Sales Opportunity</CardTitle>
              <CardDescription>
                Revenue left on the table when product was out of stock. Use to convince procurement to increase order size.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.lostSales.length === 0 ? (
                <p className="text-sm text-slate-500">No OOS data with patients/day and basket value yet.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pharmacy</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Days OOS</TableHead>
                        <TableHead>Patients/day</TableHead>
                        <TableHead>Basket (KES)</TableHead>
                        <TableHead className="text-right">Lost Revenue (KES)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lostSales.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.pharmacy}</TableCell>
                          <TableCell>{r.region}</TableCell>
                          <TableCell>{r.product}</TableCell>
                          <TableCell>{r.daysOos}</TableCell>
                          <TableCell>{r.patientsPerDay}</TableCell>
                          <TableCell>{r.basketValue}</TableCell>
                          <TableCell className="text-right font-medium">{r.lostRevenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="substitution-threat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>B. Substitution Threat Index</CardTitle>
              <CardDescription>
                Ranks why competitors are winning. Price = pricing issue; Activity = relationship issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.substitutionThreat.length === 0 ? (
                <p className="text-sm text-slate-500">No substitution data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Top Competitor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.substitutionThreat.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.reason}</TableCell>
                        <TableCell>{r.count}</TableCell>
                        <TableCell>{r.topCompetitor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share-of-voice" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>C. Share of Voice / Prescription Share</CardTitle>
              <CardDescription>
                Product prescribed vs witnessed share. Correlate Dr prescriptions with actual sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.shareOfVoice.length === 0 ? (
                <p className="text-sm text-slate-500">No prescription data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Prescribed (Rx)</TableHead>
                      <TableHead>Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.shareOfVoice.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.product}</TableCell>
                        <TableCell>{r.prescribed}</TableCell>
                        <TableCell>{r.share}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mr-productivity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>D. MR Productivity & Efficiency</CardTitle>
              <CardDescription>
                Active detailing time per visit. Short visits with full audits may indicate data quality issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.mrProductivity.length === 0 ? (
                <p className="text-sm text-slate-500">No visit duration data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MR</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead className="text-right">Duration (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.mrProductivity.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.mr}</TableCell>
                        <TableCell>{r.pharmacy}</TableCell>
                        <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-right">{Math.round(r.duration)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>E. Doctors Report</CardTitle>
              <CardDescription>
                Key prescribers by region. Reallocate marketing toward highest Rx volume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.topDoctors.length === 0 ? (
                <p className="text-sm text-slate-500">No prescription data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Total Rx</TableHead>
                      <TableHead>Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topDoctors.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.doctor}</TableCell>
                        <TableCell>{r.location}</TableCell>
                        <TableCell>{r.region ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.totalRx}</TableCell>
                        <TableCell>{r.productCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>F. Marketing Insights</CardTitle>
              <CardDescription>
                Competitor activities and why they work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(data.marketingByCompetitor).length === 0 ? (
                <p className="text-sm text-slate-500">No competitor marketing data yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.marketingByCompetitor).map(([comp, activities]) => (
                    <div key={comp} className="rounded border p-4">
                      <h4 className="font-medium">{comp}</h4>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {activities.map((a, i) => (
                          <li key={i}>
                            • {a.activity}
                            {a.reason && ` — ${a.reason}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>G. Comparative Pricing</CardTitle>
              <CardDescription>
                Average price per product per region. Positive difference = audit product more expensive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.comparativePricing.length === 0 ? (
                <p className="text-sm text-slate-500">No price data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Avg Audit (KES)</TableHead>
                      <TableHead className="text-right">Avg Competitor (KES)</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.comparativePricing.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.product}</TableCell>
                        <TableCell>{r.region}</TableCell>
                        <TableCell className="text-right">{r.avgAuditPrice?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.avgCompetitorPrice?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {r.difference != null ? `${r.difference >= 0 ? "+" : ""}${r.difference.toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="substitution-rate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>H. Substitution Rate Report</CardTitle>
              <CardDescription>
                Prescribed vs substituted. Main rival gaining share.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.substitutionRateReport.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Prescribed</TableHead>
                      <TableHead className="text-right">Substituted</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Main Rival</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.substitutionRateReport.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.product}</TableCell>
                        <TableCell className="text-right">{r.prescribed}</TableCell>
                        <TableCell className="text-right">{r.substituted}</TableCell>
                        <TableCell className="text-right">{r.rate}%</TableCell>
                        <TableCell>{r.mainRival}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supply-chain" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>I. Supply Chain Attribution</CardTitle>
              <CardDescription>
                Reason for OOS. Use to hold logistics partners accountable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.supplyChainAttribution.length === 0 ? (
                <p className="text-sm text-slate-500">No OOS reason data yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.supplyChainAttribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(props) => {
                          const name = "name" in props ? String(props.name) : "";
                          const percent = "percent" in props ? Number(props.percent) : 0;
                          return `${name} ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {data.supplyChainAttribution.map((_, i) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
