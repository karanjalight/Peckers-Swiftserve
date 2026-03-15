"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
  LabelList,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
  Megaphone,
  DollarSign,
  RefreshCw,
  Truck,
  ArrowLeftRight,
  LayoutDashboard,
  Activity,
  PackageSearch,
  ShieldAlert,
  UserCheck,
  Files,
  MapPin,
  Building2,
  Download,
  ExternalLink,
  Filter,
  Clock,
  Target,
  CalendarCheck,
} from "lucide-react";
import type { ManagerChartData, ManagerKpis, RecentVisit } from "./MrReportsTypes";

const CHART_COLORS = ["#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899", "#eab308", "#22c55e", "#f43f5e"];

type ReportData = {
  lostSales: Array<{
    pharmacy: string;
    pharmacyId: string | null;
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
  topDoctors: Array<{ doctor: string; location: string; region?: string; totalRx: number; productCount: number; products: string[] }>;
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
  regionCoverage: Array<{
    region: string;
    visits: number;
    pharmacies: string[];
  }>;
  stockOutPharmacies: Array<{
    pharmacy: string;
    pharmacyId: string | null;
    region: string;
    oosAudits: number;
    distinctProducts: number;
    totalDaysOos: number;
  }>;
  vulnerableProducts: Array<{
    product: string;
    prescribed: number;
    substituted: number;
    rate: number;
    mainRival: string;
  }>;
  pharmacyValuesFromMaster?: Array<{
    pharmacyId: string;
    pharmacy: string;
    region: string;
    avgAttendantsPerDay: number;
    avgOrderValue: number;
    estimatedMonthlyValue: number;
  }>;
  regionOptions?: string[];
  mrOptions?: Array<{ id: string; full_name: string }>;
};

type TimeRange = "30d" | "90d" | "12m" | "all";

export function MrAdvancedReports({
  kpis,
  chartData,
  recentVisits,
}: {
  kpis: ManagerKpis;
  chartData: ManagerChartData;
  recentVisits: RecentVisit[];
}) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("executive-summary");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string | "all">("all");
  const [objectiveFilter, setObjectiveFilter] = useState<string | "all">("all");
  const [exporting, setExporting] = useState(false);
  const [reportPdfLoading, setReportPdfLoading] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  // Visit History–aligned filters for Visits per MR (same as /mr/history)
  const [visitStatus, setVisitStatus] = useState<string>("");
  const [visitDateFrom, setVisitDateFrom] = useState<string>("");
  const [visitDateTo, setVisitDateTo] = useState<string>("");
  const [visitRegion, setVisitRegion] = useState<string>("");
  const [visitMrId, setVisitMrId] = useState<string>("");

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

  const headlineStockOuts = useMemo(() => {
    if (!data) return kpis.stockOuts;
    return data.stockOutPharmacies.length;
  }, [data, kpis.stockOuts]);

  const headlineSubstitutionRate = useMemo(() => {
    if (!data) return kpis.substitutionRate;
    if (!data.substitutionRateReport.length) return 0;

    let weightedSum = 0;
    let totalRx = 0;
    for (const row of data.substitutionRateReport) {
      const prescribed = row.prescribed ?? 0;
      // row.rate is already a percentage; weight by prescriptions
      weightedSum += row.rate * prescribed;
      totalRx += prescribed;
    }
    if (!totalRx) return 0;
    return Math.round((weightedSum / totalRx) * 10) / 10;
  }, [data, kpis.substitutionRate]);

  async function generateReportPdf(reportKey: string) {
    if (!data) return null;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const footerHeight = 18;
    const contentBottom = pageHeight - footerHeight;
    let y = margin;

    // Premium theme – high contrast for visibility
    const HEADER_BLUE = [30, 64, 175] as [number, number, number];
    const BORDER = [200, 212, 227] as [number, number, number];
    const ROW_WHITE = [255, 255, 255] as [number, number, number];
    const ROW_ALT = [241, 245, 249] as [number, number, number];
    const FOOTER_GRAY = [100, 116, 139] as [number, number, number];
    const TEXT_BODY = [15, 23, 42] as [number, number, number];
    const ACCENT_BLUE = [30, 64, 175] as [number, number, number];
    const ROW_HEIGHT = 7;
    const HEADER_ROW_HEIGHT = 9;

    const addFooter = () => {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(margin, contentBottom - 2, pageWidth - margin, contentBottom - 2);
      doc.setFontSize(8);
      doc.setTextColor(FOOTER_GRAY[0], FOOTER_GRAY[1], FOOTER_GRAY[2]);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Peckers Swiftserve Ltd", pageWidth / 2, contentBottom + 4, { align: "center" });
      doc.setTextColor(0, 0, 0);
    };

    const pushPage = () => {
      addFooter();
      doc.addPage();
      y = margin;
    };

    const line = (height = 6) => {
      y += height;
      if (y > contentBottom) pushPage();
    };

    const reportTitle = (text: string) => {
      const headerHeight = 32;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.line(0, headerHeight, pageWidth, headerHeight);

      y = 10;
      doc.setFontSize(9);
      doc.setTextColor(FOOTER_GRAY[0], FOOTER_GRAY[1], FOOTER_GRAY[2]);
      doc.setFont("helvetica", "normal");
      doc.text("Peckers Swiftserve Ltd", margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(ACCENT_BLUE[0], ACCENT_BLUE[1], ACCENT_BLUE[2]);
      doc.text(" · MR Intelligence", margin + 42, y);
      doc.setTextColor(0, 0, 0);

      y = 18;
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(TEXT_BODY[0], TEXT_BODY[1], TEXT_BODY[2]);
      doc.text(text, margin, y);

      doc.setDrawColor(...ACCENT_BLUE);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 2, margin + 45, y + 2);

      y = 26;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(FOOTER_GRAY[0], FOOTER_GRAY[1], FOOTER_GRAY[2]);
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`,
        margin,
        y
      );
      y = headerHeight + 10;
    };

    const drawStyledTable = (
      headers: string[],
      rows: string[][],
      colWidths: number[],
      opts?: { maxRows?: number; tableLabel?: string }
    ) => {
      const maxRows = opts?.maxRows ?? rows.length;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      if (opts?.tableLabel) {
        line(4);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(TEXT_BODY[0], TEXT_BODY[1], TEXT_BODY[2]);
        doc.text(opts.tableLabel, margin, y);
        line(6);
      }

      const drawHeader = () => {
        doc.setFillColor(...HEADER_BLUE);
        doc.rect(margin, y, tableWidth, HEADER_ROW_HEIGHT, "F");
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, HEADER_ROW_HEIGHT, "S");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        let x = margin + 3;
        headers.forEach((h, i) => {
          doc.text(h.slice(0, 28), x, y + 6);
          x += colWidths[i] ?? 40;
        });
        y += HEADER_ROW_HEIGHT;
      };

      const drawRow = (cells: string[], isAlt: boolean) => {
        if (y + ROW_HEIGHT > contentBottom) {
          pushPage();
          drawHeader();
        }
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        let x = margin;
        cells.forEach((cell, i) => {
          const w = colWidths[i] ?? 40;
          doc.setFillColor(...(isAlt ? ROW_ALT : ROW_WHITE));
          doc.rect(x, y, w, ROW_HEIGHT, "FD");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(TEXT_BODY[0], TEXT_BODY[1], TEXT_BODY[2]);
          doc.text(String(cell).slice(0, 32), x + 3, y + 5);
          x += w;
        });
        y += ROW_HEIGHT;
      };

      drawHeader();
      rows.slice(0, maxRows).forEach((row, i) => drawRow(row, i % 2 === 1));
      line(6);
    };

    const drawBarChart = (
      items: { label: string; value: number }[],
      opts: { title?: string; barColor?: [number, number, number]; maxBars?: number }
    ) => {
      const { title, barColor = [30, 64, 175], maxBars = 10 } = opts;
      if (items.length === 0) return;
      const chartHeight = 48;
      const chartWidth = pageWidth - margin * 2;
      const maxVal = Math.max(...items.map((d) => d.value), 1);
      const barMaxHeight = chartHeight - 18;
      const topN = items.slice(0, maxBars);

      if (title) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(TEXT_BODY[0], TEXT_BODY[1], TEXT_BODY[2]);
        doc.text(title, margin, y);
        y += 7;
      }
      if (y + chartHeight > contentBottom) pushPage();

      const barW = (chartWidth - (topN.length - 1) * 3) / topN.length;
      const barGap = 3;
      topN.forEach((d, i) => {
        const x = margin + i * (barW + barGap);
        const h = (d.value / maxVal) * barMaxHeight;
        doc.setFillColor(...barColor);
        doc.rect(x, y + barMaxHeight - h + 12, barW, Math.max(h, 1), "F");
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(x, y + barMaxHeight - h + 12, barW, Math.max(h, 1), "S");
      });
      const labelGap = 8;
      y += barMaxHeight + 12 + labelGap;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(TEXT_BODY[0], TEXT_BODY[1], TEXT_BODY[2]);
      topN.forEach((d, i) => {
        const x = margin + i * (barW + barGap);
        const lbl = String(d.label).slice(0, 10);
        doc.text(lbl, x + barW / 2, y, { align: "center" });
      });
      y += 8;
      if (y > contentBottom) pushPage();
    };

    const reportTitles: Record<string, string> = {
      lostSales: "Lost Sales Opportunity",
      substitutionThreat: "Substitution Threat Index",
      shareOfVoice: "Share of Voice",
      mrProductivity: "MR Productivity",
      doctors: "Doctors Report",
      marketing: "Marketing Insights",
      pricing: "Comparative Pricing",
      substitutionRate: "Substitution Rate",
      supplyChain: "Supply Chain Attribution",
      regionCoverage: "Region Coverage by Pharmacy",
      stockOutPharmacies: "Stock-out Pharmacies",
      vulnerableProducts: "Most Vulnerable Products",
    };
    reportTitle(reportTitles[reportKey] ?? reportKey);

    switch (reportKey) {
      case "lostSales": {
        const sorted = [...data.lostSales].sort((a, b) => b.lostRevenue - a.lostRevenue);
        drawBarChart(
          sorted.slice(0, 10).map((r) => ({ label: r.pharmacy, value: r.lostRevenue })),
          { title: "Top 10 by lost revenue (KES)", barColor: [185, 28, 28] }
        );
        drawStyledTable(
          ["Pharmacy", "Region", "Product", "Days OOS", "Lost Revenue"],
          sorted.slice(0, 50).map((r) => [
            r.pharmacy,
            r.region,
            r.product,
            String(r.daysOos),
            `KES ${Math.round(r.lostRevenue).toLocaleString()}`,
          ]),
          [38, 22, 32, 18, 38],
          { tableLabel: "Lost sales by pharmacy" }
        );
        break;
      }
      case "substitutionThreat": {
        drawBarChart(
          data.substitutionThreat.slice(0, 10).map((r) => ({ label: r.reason.slice(0, 12), value: r.count })),
          { title: "Substitution reasons", barColor: [194, 65, 12] }
        );
        drawStyledTable(
          ["Reason", "Count", "Top Competitor"],
          data.substitutionThreat.map((r) => [r.reason, String(r.count), r.topCompetitor]),
          [58, 22, 85],
          { tableLabel: "Substitution threat detail" }
        );
        break;
      }
      case "shareOfVoice": {
        drawBarChart(
          data.shareOfVoice.slice(0, 10).map((r) => ({ label: r.product.slice(0, 12), value: r.share })),
          { title: "Share of voice (%)" }
        );
        drawStyledTable(
          ["Product", "Prescribed", "Share %"],
          data.shareOfVoice.map((r) => [r.product, String(r.prescribed), `${r.share}%`]),
          [62, 38, 28],
          { tableLabel: "Share of voice by product" }
        );
        break;
      }
      case "mrProductivity": {
        const visitsPerMr = data.mrProductivity.reduce<Record<string, number>>(
          (acc, r) => {
            acc[r.mr] = (acc[r.mr] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        const mrChartData: { label: string; value: number }[] = Object.entries(visitsPerMr)
          .map(([mr, value]) => ({ label: mr.slice(0, 12), value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        drawBarChart(mrChartData, { title: "Visits per MR" });
        drawStyledTable(
          ["MR", "Pharmacy", "Check-in", "Duration (min)"],
          data.mrProductivity.map((r) => [
            r.mr,
            r.pharmacy,
            r.checkIn ? new Date(r.checkIn).toLocaleString() : "—",
            String(Math.round(r.duration)),
          ]),
          [42, 48, 48, 28],
          { tableLabel: "MR productivity detail" }
        );
        break;
      }
      case "doctors": {
        drawBarChart(
          data.topDoctors.slice(0, 10).map((d) => ({ label: d.doctor.slice(0, 12), value: d.totalRx })),
          { title: "Top 10 doctors by Rx" }
        );
        drawStyledTable(
          ["Doctor", "Location", "Total Rx"],
          data.topDoctors.map((r) => [r.doctor, r.location, String(r.totalRx)]),
          [52, 52, 36],
          { tableLabel: "Doctors by prescription volume" }
        );
        break;
      }
      case "marketing": {
        Object.entries(data.marketingByCompetitor).forEach(([competitor, activities]) => {
          if (y + 20 > contentBottom) pushPage();
          doc.setFillColor(...HEADER_BLUE);
          doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(competitor, margin + 3, y + 5.5);
          doc.setTextColor(0, 0, 0);
          y += 10;
          activities.forEach((a) => {
            if (y + 6 > contentBottom) pushPage();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`• ${a.activity}`, margin + 4, y + 5);
            y += 5;
            if (a.reason) {
              doc.setFontSize(8);
              doc.setTextColor(FOOTER_GRAY[0], FOOTER_GRAY[1], FOOTER_GRAY[2]);
              doc.text(a.reason, margin + 6, y + 4);
              doc.setTextColor(0, 0, 0);
              y += 5;
            }
          });
          y += 4;
        });
        break;
      }
      case "pricing":
        drawStyledTable(
          ["Product", "Region", "Avg Audit", "Avg Comp", "Difference"],
          data.comparativePricing.slice(0, 40).map((r) => [
            r.product,
            r.region,
            r.avgAuditPrice != null ? String(Math.round(r.avgAuditPrice)) : "—",
            r.avgCompetitorPrice != null ? String(Math.round(r.avgCompetitorPrice)) : "—",
            r.difference != null ? String(Math.round(r.difference)) : "—",
          ]),
          [36, 26, 28, 28, 30],
          { tableLabel: "Comparative pricing by product and region" }
        );
        break;
      case "substitutionRate": {
        drawBarChart(
          data.substitutionRateReport.slice(0, 10).map((r) => ({ label: r.product.slice(0, 12), value: r.rate })),
          { title: "Substitution rate (%)", barColor: [147, 51, 234] }
        );
        drawStyledTable(
          ["Product", "Prescribed", "Substituted", "Rate %", "Main Rival"],
          data.substitutionRateReport.map((r) => [
            r.product,
            String(r.prescribed),
            String(r.substituted),
            `${r.rate}%`,
            r.mainRival,
          ]),
          [36, 26, 30, 20, 53],
          { tableLabel: "Substitution rate by product" }
        );
        break;
      }
      case "supplyChain": {
        drawBarChart(
          data.supplyChainAttribution.slice(0, 10).map((r) => ({ label: r.name.slice(0, 14), value: r.value })),
          { title: "OOS reasons (count)" }
        );
        drawStyledTable(
          ["Reason", "Count"],
          data.supplyChainAttribution.map((r) => [r.name, String(r.value)]),
          [125, 35],
          { tableLabel: "Supply chain attribution" }
        );
        break;
      }
      case "regionCoverage": {
        drawBarChart(
          data.regionCoverage
            .slice()
            .sort((a, b) => b.visits - a.visits)
            .map((r) => ({ label: r.region.slice(0, 12), value: r.visits })),
          { title: "Visits per region", barColor: [30, 64, 175] }
        );
        drawStyledTable(
          ["Region", "Visits", "Pharmacies"],
          data.regionCoverage.map((r) => [
            r.region,
            String(r.visits),
            String(r.pharmacies.length),
          ]),
          [50, 30, 80],
          { tableLabel: "Regions covered and pharmacies in each region" }
        );
        break;
      }
      case "stockOutPharmacies": {
        const sorted = [...data.stockOutPharmacies].sort(
          (a, b) => b.oosAudits - a.oosAudits
        );
        drawBarChart(
          sorted.map((r) => ({ label: r.pharmacy.slice(0, 14), value: r.oosAudits })),
          { title: "Stock-out audits per pharmacy", barColor: [217, 119, 6] }
        );
        drawStyledTable(
          ["Pharmacy", "Region", "OOS audits", "Distinct products", "Total days OOS"],
          sorted.map((r) => [
            r.pharmacy,
            r.region,
            String(r.oosAudits),
            String(r.distinctProducts),
            String(r.totalDaysOos),
          ]),
          [46, 32, 26, 32, 37],
          { tableLabel: "Stock-out pharmacy list" }
        );
        break;
      }
      case "vulnerableProducts": {
        const sorted = [...data.vulnerableProducts].sort(
          (a, b) => b.rate - a.rate
        );
        drawBarChart(
          sorted.map((r) => ({ label: r.product.slice(0, 12), value: r.rate })),
          { title: "Most vulnerable products (substitution rate %)", barColor: [185, 28, 28] }
        );
        drawStyledTable(
          ["Product", "Prescribed", "Substituted", "Rate %", "Main rival"],
          sorted.map((r) => [
            r.product,
            String(r.prescribed),
            String(r.substituted),
            `${r.rate}%`,
            r.mainRival,
          ]),
          [40, 28, 30, 20, 49],
          { tableLabel: "Most vulnerable products to substitution" }
        );
        break;
      }
      default:
        doc.setFont("helvetica", "normal");
        doc.text("No data for this report.", margin, y);
    }

    addFooter();
    return doc;
  }

  async function handleReportDownload(reportKey: string) {
    if (reportPdfLoading || !data) return;
    setReportPdfLoading(reportKey);
    try {
      const doc = await generateReportPdf(reportKey);
      if (doc) {
        const titles: Record<string, string> = {
          lostSales: "Lost-Sales-Opportunity",
          substitutionThreat: "Substitution-Threat-Index",
          shareOfVoice: "Share-of-Voice",
          mrProductivity: "MR-Productivity",
          doctors: "Doctors-Report",
          marketing: "Marketing-Insights",
          pricing: "Comparative-Pricing",
          substitutionRate: "Substitution-Rate",
          supplyChain: "Supply-Chain-Attribution",
          regionCoverage: "Region-Coverage-by-Pharmacy",
          stockOutPharmacies: "Stock-out-Pharmacies",
          vulnerableProducts: "Most-Vulnerable-Products",
        };
        doc.save(`${titles[reportKey] ?? reportKey}-${Date.now()}.pdf`);
      }
    } catch (e) {
      console.error("Failed to generate report PDF", e);
    } finally {
      setReportPdfLoading(null);
    }
  }

  async function handleReportOpen(reportKey: string) {
    if (reportPdfLoading || !data) return;
    setReportPdfLoading(reportKey);
    try {
      const doc = await generateReportPdf(reportKey);
      if (doc) {
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      console.error("Failed to open report PDF", e);
    } finally {
      setReportPdfLoading(null);
    }
  }

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (visitStatus) params.set("status", visitStatus);
      if (visitDateFrom) params.set("dateFrom", visitDateFrom);
      if (visitDateTo) params.set("dateTo", visitDateTo);
      if (visitRegion) params.set("region", visitRegion);
      if (visitMrId) params.set("mrId", visitMrId);
      const qs = params.toString();
      const res = await fetch(`/api/mr/reports${qs ? `?${qs}` : ""}`);
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

  const filteredRecentVisits = useMemo(() => {
    const now = new Date();
    const cutoff =
      timeRange === "all"
        ? null
        : (() => {
            const d = new Date(now);
            if (timeRange === "30d") d.setDate(d.getDate() - 30);
            else if (timeRange === "90d") d.setDate(d.getDate() - 90);
            else d.setMonth(d.getMonth() - 12);
            return d;
          })();

    return recentVisits.filter((v) => {
      const visitDate = new Date(v.checkIn);
      if (cutoff && visitDate < cutoff) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!v.pharmacy.toLowerCase().includes(q) && !(v.region ?? "").toLowerCase().includes(q)) {
          return false;
        }
      }

      if (regionFilter !== "all" && v.region !== regionFilter) return false;
      if (objectiveFilter !== "all" && v.objective !== objectiveFilter) return false;

      return true;
    });
  }, [recentVisits, searchTerm, regionFilter, objectiveFilter, timeRange]);

  const regions = useMemo(
    () => Array.from(new Set(recentVisits.map((v) => v.region).filter(Boolean))) as string[],
    [recentVisits]
  );
  const objectives = useMemo(
    () => Array.from(new Set(recentVisits.map((v) => v.objective).filter(Boolean))) as string[],
    [recentVisits]
  );

  const totalLostRevenue = useMemo(
    () => data?.lostSales.reduce((sum, r) => sum + r.lostRevenue, 0) ?? 0,
    [data]
  );

  const totalSupplyChain = useMemo(
    () => data?.supplyChainAttribution.reduce((sum, r) => sum + r.value, 0) ?? 0,
    [data]
  );

  const riskLevel = useMemo(() => {
    if (totalLostRevenue === 0) return { label: "Low risk", color: "bg-emerald-400 text-emerald-700" };
    if (totalLostRevenue < 500000) return { label: "Moderate risk", color: "bg-amber-400 text-amber-700" };
    return { label: "High risk", color: "bg-red-400 text-red-700" };
  }, [totalLostRevenue]);

  const DAYS_OPEN_PER_MONTH = 26;

  const pharmacyValueList = useMemo(() => {
    if (!data?.lostSales.length) return [];
    const byKey: Record<
      string,
      { pharmacy: string; pharmacyId: string | null; region: string; patientsPerDay: number; basketValue: number; totalLostRevenue: number }
    > = {};
    for (const r of data.lostSales) {
      const key = `${r.pharmacy}::${r.region}`;
      if (!byKey[key]) {
        byKey[key] = {
          pharmacy: r.pharmacy,
          pharmacyId: r.pharmacyId ?? null,
          region: r.region,
          patientsPerDay: r.patientsPerDay,
          basketValue: r.basketValue,
          totalLostRevenue: 0,
        };
      }
      byKey[key].totalLostRevenue += r.lostRevenue;
    }
    return Object.values(byKey).map((row) => ({
      ...row,
      estimatedMonthlyValue: row.patientsPerDay * row.basketValue * DAYS_OPEN_PER_MONTH,
    }));
  }, [data?.lostSales]);

  const productValueList = useMemo(() => {
    if (!data?.lostSales.length) return [];
    const byProduct: Record<string, { product: string; totalLostRevenue: number; affectedPharmacies: number }> = {};
    const pharmacySetByProduct: Record<string, Set<string>> = {};
    for (const r of data.lostSales) {
      const key = r.product;
      if (!byProduct[key]) {
        byProduct[key] = { product: key, totalLostRevenue: 0, affectedPharmacies: 0 };
        pharmacySetByProduct[key] = new Set();
      }
      byProduct[key].totalLostRevenue += r.lostRevenue;
      pharmacySetByProduct[key].add(`${r.pharmacy}::${r.region}`);
    }
    return Object.values(byProduct).map((row) => ({
      ...row,
      affectedPharmacies: pharmacySetByProduct[row.product]?.size ?? 0,
    })).sort((a, b) => b.totalLostRevenue - a.totalLostRevenue);
  }, [data?.lostSales]);

  const totalPharmacyValue = useMemo(
    () => pharmacyValueList.reduce((sum, p) => sum + p.estimatedMonthlyValue, 0),
    [pharmacyValueList]
  );

  const pharmacyValuesFromMaster = data?.pharmacyValuesFromMaster ?? [];
  const totalPharmacyValueFromMaster = useMemo(
    () => pharmacyValuesFromMaster.reduce((sum, p) => sum + p.estimatedMonthlyValue, 0),
    [pharmacyValuesFromMaster]
  );

  const pharmacyValuesWithTier = useMemo(() => {
    if (pharmacyValuesFromMaster.length === 0) return [];
    const sorted = [...pharmacyValuesFromMaster].sort(
      (a, b) => b.estimatedMonthlyValue - a.estimatedMonthlyValue
    );
    const n = sorted.length;
    const highCut = Math.max(1, Math.ceil(n * 0.2));
    const mediumCut = Math.max(highCut + 1, Math.ceil(n * 0.5));
    return sorted.map((row, i) => ({
      ...row,
      tier: i < highCut ? "High" as const : i < mediumCut ? "Medium" as const : "Low" as const,
    }));
  }, [pharmacyValuesFromMaster]);

  const handleExportPdf = async () => {
    if (!workspaceRef.current || exporting) return;
    try {
      setExporting(true);

      // Temporarily silence noisy html2canvas color warnings (e.g. unsupported lab())
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        if (
          typeof args[0] === "string" &&
          args[0].includes('Attempting to parse an unsupported color function "lab"')
        ) {
          return;
        }
        originalConsoleError(...args);
      };

      // Dynamic imports to ensure this only runs on the client
      const [html2canvasModule, jsPdfModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas =
        // html2canvas v1 exports default
        (html2canvasModule as { default: typeof import("html2canvas")["default"] })
          .default ?? (html2canvasModule as any);
      const JsPDF =
        // jsPDF v2+ usually exports named jsPDF
        (jsPdfModule as any).jsPDF ?? (jsPdfModule as any).default;

      const element = workspaceRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new JsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      // Scale the screenshot to fit on a single page while preserving aspect ratio.
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const scaleFactor = Math.min(availableHeight / imgHeight, 1);
      const finalWidth = imgWidth * scaleFactor;
      const finalHeight = imgHeight * scaleFactor;

      const offsetX = (pageWidth - finalWidth) / 2;
      const offsetY = (pageHeight - finalHeight) / 2;

      pdf.addImage(
        imgData,
        "PNG",
        offsetX,
        offsetY,
        finalWidth,
        finalHeight,
        undefined,
        "FAST",
      );

      pdf.save("mr-advanced-reports.pdf");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to export PDF", e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error) {
    return (
      <Card className="border-amber-200 bg-white dark:border-amber-400/50 dark:bg-slate-800/90">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-2 text-slate-700 dark:text-slate-200">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-amber-500/70 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white  transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/70"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div
      ref={workspaceRef}
      className="space-y-6 lg:-mt-10 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
    >
      {/* Page header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white px-4 py-8 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div>
          <h2 className="text-2xl font-bold  text-slate-900 dark:text-slate-50">
            Report Management Workspace
          </h2>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-300">
            Structured MR intelligence for leadership, field teams, and product strategy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="h-12 min-w-[11rem] rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-base font-medium text-slate-800 transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          {/* <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex h-12 items-center gap-2.5 rounded-xl border-2 border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 transition-all hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-700"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-600 dark:text-slate-300" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5 shrink-0" />
                <span>Export PDF</span>
              </>
            )}
          </button> */}
          <button
            type="button"
            onClick={fetchReports}
            className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <RefreshCw className="h-5 w-5 shrink-0" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Workspace tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="sticky top-0 z-20 mt-5 -mx-4 border-b border-slate-400 bg-white/85 px-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:-mx-6 lg:px-6">
          <TabsList className="flex w-full max-w-7xl items-end gap-2 border-b border-transparent bg-transparent p-0">
            <TabsTrigger
              value="executive-summary"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="truncate">Executive Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="field-activity"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <Activity className="h-4 w-4" />
              <span className="truncate">Field Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="product-insights"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <PackageSearch className="h-4 w-4" />
              <span className="truncate">Product Insights</span>
            </TabsTrigger>
            <TabsTrigger
              value="risk-revenue"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="truncate">Risk &amp; Revenue</span>
            </TabsTrigger>
            <TabsTrigger
              value="mr-performance"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <UserCheck className="h-4 w-4" />
              <span className="truncate">MR Performance</span>
            </TabsTrigger>
            <TabsTrigger
              value="report-library"
              className="relative flex items-center gap-2 border-b-2 border-transparent px-2 py-6 text-lg font-medium text-slate-800 transition-all duration-200 hover:text-slate-900 data-[state=active]:border-blue-900 data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-slate-50"
            >
              <Files className="h-4 w-4" />
              <span className="truncate">Report Library</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="executive-summary"
          forceMount
          className="space-y-6 data-[state=inactive]:hidden"
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="rounded-2xl border-0 bg-gradient-to-br from-sky-300 via-sky-300 to-cyan-200  dark:from-sky-900 dark:via-slate-900 dark:to-slate-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  Total Visits
                </CardTitle>
                <div className="rounded-xl bg-sky-100 p-2 dark:bg-sky-900/60">
                  <MapPin className="h-4 w-4 text-sky-700 dark:text-sky-200" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-sky-950 dark:text-sky-50">
                  {kpis.totalVisits}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-400 via-teal-400 to-teal-200  dark:border-emerald-500/40 dark:from-emerald-900 dark:via-slate-900 dark:to-slate-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Pharmacies Visited
                </CardTitle>
                <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/60">
                  <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-100" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-950 dark:text-emerald-50">
                  {kpis.uniquePharmacies}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-amber-500/60 bg-gradient-to-br from-amber-500 via-orange-300 to-yellow-200  dark:border-amber-400/50 dark:from-amber-900 dark:via-slate-900 dark:to-slate-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Stock-outs
                </CardTitle>
                <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/60">
                  <PackageSearch className="h-4 w-4 text-amber-700 dark:text-amber-100" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-900 dark:text-amber-50">
                  {headlineStockOuts}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-indigo-500/60 bg-gradient-to-br from-indigo-500 via-violet-400 to-purple-300  dark:border-indigo-400/60 dark:from-indigo-900 dark:via-slate-900 dark:to-slate-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Substitution Rate
                </CardTitle>
                <div className="rounded-xl bg-violet-100 p-2 dark:bg-violet-900/60">
                  <TrendingUp className="h-4 w-4 text-violet-700 dark:text-violet-100" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-violet-950 dark:text-violet-50">
                  {headlineSubstitutionRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl v hidden border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  Visits Over Time
                </CardTitle>
                <CardDescription className="text-slate-800 dark:text-slate-300">
                  Monthly field visit volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.byMonth.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/60 text-md text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    No visit data yet
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.byMonth}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="visits"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#6366f1" }}
                          activeDot={{ r: 4, fill: "#4f46e5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Region Breakdown
                  </CardTitle>
                  <CardDescription className="text-slate-800 dark:text-slate-300">
                    Visits by region
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  {chartData.byRegion.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/60 text-md text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      No region data yet
                    </div>
                  ) : (
                    <div className="h-40">
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
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            fill="#0ea5e9"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl hidden border border-rose-100 bg-gradient-to-br from-blue-400 via-indigo-300 to-blue-300  dark:border-rose-300/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                  Total Lost Revenue
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-300">
                  From out-of-stock events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-rose-900 dark:text-rose-50">
                  KES {Math.round(totalLostRevenue).toLocaleString()}
                </p>
              </CardContent>
            </Card>


              <Card className="rounded-2xl border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Objective Breakdown
                  </CardTitle>
                  <CardDescription className="text-slate-800 dark:text-slate-300">
                    Visit mix by objective
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.byObjective.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/60 text-md text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      No objective data yet
                    </div>
                  ) : (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.byObjective}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
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
        </TabsContent>

        <TabsContent
          value="field-activity"
          forceMount
          className="space-y-6 data-[state=inactive]:hidden"
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  Visits by Region
                </CardTitle>
                <CardDescription className="text-slate-800 dark:text-slate-300">
                  Submitted visits per region
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.byRegion.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/60 text-md text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    No region data yet
                  </div>
                ) : (
                  <div className="h-48">
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
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                          fill="#22c55e"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  Top Pharmacies
                </CardTitle>
                <CardDescription className="text-slate-800 dark:text-slate-300">
                  Ranked by visit count
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chartData.byPharmacy.length === 0 ? (
                  <p className="text-md text-slate-800 dark:text-slate-300">
                    No pharmacy data yet.
                  </p>
                ) : (
                  chartData.byPharmacy.slice(0, 6).map((ph, idx) => {
                    const max = chartData.byPharmacy[0]?.value || 1;
                    const pct = (ph.value / max) * 100;
                    return (
                      <div key={ph.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-md">
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                            {idx + 1}. {ph.name}
                          </span>
                          <span className="text-slate-800 dark:text-slate-400">
                            {ph.value} visits
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white  dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Recent Visits
                  </CardTitle>
                  <CardDescription className="text-slate-800 dark:text-slate-300">
                    Search and filter field activity
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    placeholder="Search pharmacy or region"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 flex-1 min-w-[140px] rounded-full border border-slate-400 bg-white px-3 text-md text-slate-700  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value as string | "all")}
                    className="h-8 rounded-full border border-slate-400 bg-white px-2 text-md text-slate-700  dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All regions</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <select
                    value={objectiveFilter}
                    onChange={(e) => setObjectiveFilter(e.target.value as string | "all")}
                    className="h-8 rounded-full border border-slate-400 bg-white px-2 text-md text-slate-700  dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="all">All objectives</option>
                    {objectives.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRecentVisits.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/60 text-md text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                    No visits matching filters
                  </div>
                ) : (
                  <div className="max-h-60 space-y-2 overflow-auto pr-1">
                    {filteredRecentVisits.slice(0, 12).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-md hover:bg-white dark:border-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-700"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {v.pharmacy}
                          </p>
                          <p className="text-[11px] text-slate-800 dark:text-slate-400">
                            {(v.region ?? "—") + " • " + (v.objective ?? "—")}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-800 dark:text-slate-400">
                          {new Date(v.checkIn).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Regions covered & pharmacies list */}
            <Card className="lg:col-span-12 rounded-2xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  Regions Covered &amp; Pharmacies
                </CardTitle>
                <CardDescription className="text-slate-800 dark:text-slate-300">
                  Regions where you have submitted visits, and how many pharmacies you touch in each.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!data || data.regionCoverage.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No region coverage data yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/60">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-100/80 dark:bg-slate-900/60">
                          <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            Region
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            Pharmacies visited
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            Visits
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.regionCoverage
                          .slice()
                          .sort((a, b) => b.visits - a.visits)
                          .map((row) => (
                            <TableRow key={row.region}>
                              <TableCell className="text-sm text-slate-900 dark:text-slate-50">
                                {row.region}
                              </TableCell>
                              <TableCell className="text-sm text-slate-800 dark:text-slate-200">
                                {row.pharmacies.length}
                              </TableCell>
                              <TableCell className="text-sm text-slate-800 dark:text-slate-200">
                                {row.visits}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="product-insights"
          forceMount
          className="space-y-8 data-[state=inactive]:hidden"
        >
          {/* Section hero */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-5 py-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-900/50 dark:ring-white/5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400">
                  <PackageSearch className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                    Product Insights
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pricing, substitution, share of voice, and doctor-level prescribing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Product Discussion Frequency
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Audit frequency by product
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.byProduct.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                    <BarChart3 className="h-10 w-10 text-slate-400" />
                    No product data yet
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData.byProduct}
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
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                          fill="#8b5cf6"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Substitution Rate by Product
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Where competitors are winning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.substitutionRateReport.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                    <Activity className="h-10 w-10 text-slate-400" />
                    No substitution data yet.
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.substitutionRateReport}
                        margin={{ top: 8, right: 8, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="product"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="rate"
                          radius={[6, 6, 0, 0]}
                          fill="#f97316"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* G. Comparative Pricing - full width, scrollable table + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  G. Comparative Pricing
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Average price per product per region. Positive difference = audit product more expensive.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.comparativePricing.map((r) => ({
                    product: r.product,
                    region: r.region,
                    avg_audit_kes: r.avgAuditPrice != null ? Math.round(r.avgAuditPrice) : "",
                    avg_competitor_kes: r.avgCompetitorPrice != null ? Math.round(r.avgCompetitorPrice) : "",
                    difference: r.difference != null ? Math.round(r.difference) : "",
                  }));
                  downloadCsv("product-insights-comparative-pricing.csv", rows);
                }}
                disabled={!data.comparativePricing.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.comparativePricing.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <DollarSign className="h-10 w-10 text-slate-400" />
                  No comparative pricing data yet.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900/50 dark:ring-white/5">
                  <div className="min-w-[640px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Product</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Avg Audit (KES)</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Avg Competitor (KES)</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.comparativePricing.slice(0, 40).map((row, idx) => {
                          const diff = row.difference ?? 0;
                          const intensity =
                            diff > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : diff < 0 ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                          return (
                            <TableRow
                              key={idx}
                              className="border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="whitespace-nowrap py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{row.product}</TableCell>
                              <TableCell className="whitespace-nowrap py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{row.region}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-900 dark:text-slate-50">
                                {row.avgAuditPrice != null ? Math.round(row.avgAuditPrice).toLocaleString() : "—"}
                              </TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-900 dark:text-slate-50">
                                {row.avgCompetitorPrice != null ? Math.round(row.avgCompetitorPrice).toLocaleString() : "—"}
                              </TableCell>
                              <TableCell className="py-3.5 pr-5 text-right">
                                <span className={`inline-flex items-center justify-end rounded-full px-2.5 py-1 text-[11px] font-semibold ${intensity}`}>
                                  {row.difference != null
                                    ? `${row.difference >= 0 ? "+" : ""}${Math.round(row.difference).toLocaleString()}`
                                    : "—"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
              <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Most Vulnerable Product
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Highest substitution pressure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.substitutionRateReport.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-slate-600 dark:text-slate-400">
                      <AlertTriangle className="h-10 w-10 text-slate-400" />
                      No substitution data yet.
                    </div>
                  ) : (
                    (() => {
                      const top = [...data.substitutionRateReport].sort(
                        (a, b) => b.rate - a.rate
                      )[0];
                      return (
                        <div className="space-y-4">
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                            {top.product}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {top.rate}% substitution rate • Main rival:{" "}
                            <span className="font-medium text-slate-900 dark:text-slate-100">{top.mainRival}</span>
                          </p>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(top.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    F. Marketing Insights
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Competitor activities and why they work.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.keys(data.marketingByCompetitor).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-slate-600 dark:text-slate-400">
                      <Megaphone className="h-10 w-10 text-slate-400" />
                      No competitor marketing data yet.
                    </div>
                  ) : (
                    Object.entries(data.marketingByCompetitor)
                      .slice(0, 3)
                      .map(([comp, activities]) => (
                        <div
                          key={comp}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-700 dark:bg-slate-800/60"
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {comp}
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                            {activities.slice(0, 3).map((a, i) => (
                              <li key={i} className="leading-snug">
                                {a.activity}
                                {a.reason && <span className="text-slate-500 dark:text-slate-400"> — {a.reason}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>

          {/* B. Substitution Threat Index - full width, scrollable + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  B. Substitution Threat Index
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Ranks why competitors are winning. Price = pricing issue; Activity = relationship issue.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.substitutionThreat.map((r) => ({
                    reason: r.reason,
                    count: r.count,
                    top_competitor: r.topCompetitor,
                  }));
                  downloadCsv("product-insights-substitution-threat.csv", rows);
                }}
                disabled={!data.substitutionThreat.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.substitutionThreat.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <AlertTriangle className="h-10 w-10 text-slate-400" />
                  No substitution threat data yet.
                </div>
              ) : (
                <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 z-10 border-0 bg-slate-100/95 backdrop-blur dark:bg-slate-800/95">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Reason</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Count</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Top Competitor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.substitutionThreat.map((r, i) => (
                          <TableRow
                            key={i}
                            className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.reason}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.count}</TableCell>
                            <TableCell className="py-3.5 pr-5 text-sm text-slate-700 dark:text-slate-200">{r.topCompetitor}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* C. Share of Voice - full width, scrollable + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  C. Share of Voice / Prescription Share
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Product prescribed vs witnessed share. Correlate Dr prescriptions with actual sales.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.shareOfVoice.map((r) => ({
                    product: r.product,
                    prescribed_rx: r.prescribed,
                    share_pct: r.share,
                  }));
                  downloadCsv("product-insights-share-of-voice.csv", rows);
                }}
                disabled={!data.shareOfVoice.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.shareOfVoice.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <BarChart3 className="h-10 w-10 text-slate-400" />
                  No prescription share data yet.
                </div>
              ) : (
                <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[360px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 z-10 border-0 bg-slate-100/95 backdrop-blur dark:bg-slate-800/95">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Product</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Prescribed (Rx)</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Share</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.shareOfVoice.map((r, i) => (
                          <TableRow
                            key={i}
                            className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.product}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.prescribed}</TableCell>
                            <TableCell className="tabular-nums py-3.5 pr-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.share}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* H. Substitution Rate Report - full width, scrollable + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  H. Substitution Rate Report
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Prescribed vs substituted. Main rival gaining share.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.substitutionRateReport.map((r) => ({
                    product: r.product,
                    prescribed: r.prescribed,
                    substituted: r.substituted,
                    rate_pct: r.rate,
                    main_rival: r.mainRival,
                  }));
                  downloadCsv("product-insights-substitution-rate.csv", rows);
                }}
                disabled={!data.substitutionRateReport.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.substitutionRateReport.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <Activity className="h-10 w-10 text-slate-400" />
                  No substitution rate data yet.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[560px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 z-10 border-0 bg-slate-100/95 backdrop-blur dark:bg-slate-800/95">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Product</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Prescribed</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Substituted</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rate</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Main Rival</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.substitutionRateReport.map((r, i) => (
                          <TableRow
                            key={i}
                            className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="whitespace-nowrap py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.product}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{r.prescribed}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{r.substituted}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-medium text-slate-900 dark:text-slate-50">{r.rate}%</TableCell>
                            <TableCell className="py-3.5 pr-5 text-sm text-slate-700 dark:text-slate-200">{r.mainRival}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* E. Doctors Report - full width, scrollable + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800/90 dark:ring-white/5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  E. Doctors Report
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  All doctors and the products they prescribe. Reallocate marketing toward highest Rx volume.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.topDoctors.map((r) => ({
                    doctor: r.doctor,
                    location: r.location,
                    region: r.region ?? "",
                    total_rx: r.totalRx,
                  }));
                  downloadCsv("product-insights-doctors.csv", rows);
                }}
                disabled={!data.topDoctors.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.topDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <Users className="h-10 w-10 text-slate-400" />
                  No doctors data yet.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 z-10 border-0 bg-slate-100/95 backdrop-blur dark:bg-slate-800/95">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Doctor</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Location</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Total Rx</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topDoctors.map((r, i) => (
                          <TableRow
                            key={i}
                            className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="whitespace-nowrap py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.doctor}</TableCell>
                            <TableCell className="py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.location}</TableCell>
                            <TableCell className="py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.region ?? "—"}</TableCell>
                            <TableCell className="tabular-nums py-3.5 pr-5 text-right text-sm font-medium text-slate-900 dark:text-slate-50">{r.totalRx}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="risk-revenue"
          forceMount
          className="space-y-8 data-[state=inactive]:hidden"
        >
          {/* Hero */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 px-5 py-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-900/50 dark:ring-white/5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                    Risk &amp; Revenue
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Lost sales, pharmacy value, product impact, and supply chain. Finances in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Finance at a glance */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* <Card className="overflow-hidden rounded-2xl border border-rose-200/90 bg-white shadow-sm dark:border-rose-900/50 dark:bg-slate-800/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Total Lost Revenue
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  From OOS in period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-200 sm:text-3xl">
                  KES {Math.round(totalLostRevenue).toLocaleString()}
                </p>
              </CardContent>
            </Card> */}
            <Card className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-sm dark:border-emerald-900/50 dark:bg-slate-800/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Est. Pharmacy Value
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Monthly (26 days) from pharmacy data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-200 sm:text-3xl">
                  KES {Math.round(pharmacyValuesFromMaster.length > 0 ? totalPharmacyValueFromMaster : totalPharmacyValue).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  OOS Days (median)
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Per pharmacy–product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50 sm:text-3xl">
                  {data.lostSales.length
                    ? Math.round(
                        [...data.lostSales]
                          .sort((a, b) => a.daysOos - b.daysOos)[
                          Math.floor(data.lostSales.length / 2)
                        ].daysOos
                      )
                    : "—"}
                </p>
              </CardContent>
            </Card>
            {/* <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Risk Level
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Revenue at risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${riskLevel.color}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {riskLevel.label}
                </span>
              </CardContent>
            </Card> */}
          </div>

          {/* hidden Lost Sales – full detail + export */}
          <Card className="w-full hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Lost Sales Opportunity (full detail)
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Revenue left on the table when a product was out of stock. Each row = one pharmacy–product OOS. Use to convince procurement to increase order size.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.lostSales.map((r) => ({
                    pharmacy: r.pharmacy,
                    region: r.region,
                    product: r.product,
                    days_oos: r.daysOos,
                    patients_per_day: r.patientsPerDay,
                    basket_kes: Math.round(r.basketValue),
                    lost_revenue_kes: Math.round(r.lostRevenue),
                  }));
                  downloadCsv("risk-revenue-lost-sales.csv", rows);
                }}
                disabled={!data.lostSales.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.lostSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <TrendingDown className="h-10 w-10 text-slate-400" />
                  No OOS data with patients/day and basket value yet. Capture days out of stock and quantity/price in visit audits.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[720px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Pharmacy</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Product</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Days OOS</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Patients/day</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Basket (KES)</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Lost Revenue (KES)</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.lostSales.map((r, i) => (
                          <TableRow
                            key={i}
                            className="border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="whitespace-nowrap py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">
                              {r.pharmacyId ? (
                                <Link href={`/mr/pharmacies/${r.pharmacyId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                  {r.pharmacy}
                                </Link>
                              ) : (
                                r.pharmacy
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.region}</TableCell>
                            <TableCell className="whitespace-nowrap py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.product}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-900 dark:text-slate-50">{r.daysOos}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{r.patientsPerDay}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{Math.round(r.basketValue).toLocaleString()}</TableCell>
                            <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-semibold text-rose-700 dark:text-rose-300">{Math.round(r.lostRevenue).toLocaleString()}</TableCell>
                            <TableCell className="py-3.5 pr-5 text-center">
                              {r.pharmacyId ? (
                                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
                                  <Link href={`/mr/pharmacies/${r.pharmacyId}`}>
                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                    View
                                  </Link>
                                </Button>
                              ) : (
                                "—"
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

          {/* Pharmacy value + Product value side by side */}
          <div className="grid gap-6 lg:grid-cols-1">
            <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {pharmacyValuesWithTier.length > 0
                      ? "Pharmacy value (from master data)"
                      : "Pharmacy value"}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    {pharmacyValuesWithTier.length > 0
                      ? "People attended per day × average order value × 26 days. Categorised by value tier."
                      : pharmacyValueList.length > 0
                      ? "Estimated from lost-sales audit data. Fill in attendants & average order value on each pharmacy for tiers."
                      : "Fill in people attended per day and average order value on each pharmacy to see value and tiers."}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  onClick={() => {
                    const rows = pharmacyValuesWithTier.length > 0
                      ? pharmacyValuesWithTier.map((r) => ({
                          pharmacy: r.pharmacy,
                          region: r.region,
                          attendants_per_day: r.avgAttendantsPerDay,
                          avg_order_value_kes: Math.round(r.avgOrderValue),
                          est_monthly_value_kes: Math.round(r.estimatedMonthlyValue),
                          tier: r.tier,
                        }))
                      : pharmacyValueList.map((r) => ({
                          pharmacy: r.pharmacy,
                          region: r.region,
                          est_monthly_value_kes: Math.round(r.estimatedMonthlyValue),
                          total_lost_revenue_kes: Math.round(r.totalLostRevenue),
                        }));
                    downloadCsv("risk-revenue-pharmacy-value.csv", rows);
                  }}
                  disabled={pharmacyValuesWithTier.length === 0 && pharmacyValueList.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
                {pharmacyValuesWithTier.length > 0 ? (
                  <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="min-w-[640px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Pharmacy</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Attendants/day</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Avg order (KES)</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Est. monthly (KES)</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tier</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pharmacyValuesWithTier.map((r) => (
                            <TableRow
                              key={`${r.pharmacy}-${r.region}`}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">
                                <Link href={`/mr/pharmacies/${r.pharmacyId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                  {r.pharmacy}
                                </Link>
                              </TableCell>
                              <TableCell className="py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.region}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{r.avgAttendantsPerDay}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{Math.round(r.avgOrderValue).toLocaleString()}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-medium text-emerald-700 dark:text-emerald-300">{Math.round(r.estimatedMonthlyValue).toLocaleString()}</TableCell>
                              <TableCell className="py-3.5 px-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    r.tier === "High"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                      : r.tier === "Medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  {r.tier}
                                </span>
                              </TableCell>
                              <TableCell className="py-3.5 pr-5 text-center">
                                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
                                  <Link href={`/mr/pharmacies/${r.pharmacyId}`}>
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
                ) : pharmacyValueList.length > 0 ? (
                  <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="min-w-[420px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Pharmacy</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Est. monthly (KES)</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Lost revenue (KES)</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...pharmacyValueList]
                            .sort((a, b) => b.estimatedMonthlyValue - a.estimatedMonthlyValue)
                            .map((r) => (
                              <TableRow
                                key={`${r.pharmacy}-${r.region}`}
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                              >
                                <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">
                                  {r.pharmacyId ? (
                                    <Link href={`/mr/pharmacies/${r.pharmacyId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                      {r.pharmacy}
                                    </Link>
                                  ) : (
                                    r.pharmacy
                                  )}
                                </TableCell>
                                <TableCell className="py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{r.region}</TableCell>
                                <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-medium text-emerald-700 dark:text-emerald-300">{Math.round(r.estimatedMonthlyValue).toLocaleString()}</TableCell>
                                <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-rose-700 dark:text-rose-300">{Math.round(r.totalLostRevenue).toLocaleString()}</TableCell>
                                <TableCell className="py-3.5 pr-5 text-center">
                                  {r.pharmacyId ? (
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
                                      <Link href={`/mr/pharmacies/${r.pharmacyId}`}>
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        View
                                      </Link>
                                    </Button>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-600 dark:text-slate-400">
                    <Building2 className="h-10 w-10 text-slate-400" />
                    Fill in &quot;People attended per day&quot; and &quot;Average order value&quot; on each pharmacy to see value and tiers here.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="w-full hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Products by revenue at risk
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Total lost revenue by product. Focus on high-value products.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                  onClick={() => {
                    const rows = productValueList.map((r) => ({
                      product: r.product,
                      total_lost_revenue_kes: Math.round(r.totalLostRevenue),
                      affected_pharmacies: r.affectedPharmacies,
                    }));
                    downloadCsv("risk-revenue-products-by-value.csv", rows);
                  }}
                  disabled={!productValueList.length}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
                {productValueList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-slate-600 dark:text-slate-400">
                    <PackageSearch className="h-10 w-10 text-slate-400" />
                    No product value data. Lost-sales rows drive this view.
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="min-w-[360px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Product</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Lost revenue (KES)</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Pharmacies</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productValueList.map((r) => (
                            <TableRow
                              key={r.product}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.product}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-semibold text-rose-700 dark:text-rose-300">{Math.round(r.totalLostRevenue).toLocaleString()}</TableCell>
                              <TableCell className="tabular-nums py-3.5 pr-5 text-right text-sm text-slate-700 dark:text-slate-200">{r.affectedPharmacies}</TableCell>
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

          {/* Stock-out Pharmacies – full table, scrollable + export */}
          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Stock-out pharmacies
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Sites with at least one OOS audit in the period. Total OOS days and distinct products affected.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.stockOutPharmacies.map((r) => ({
                    pharmacy: r.pharmacy,
                    region: r.region,
                    oos_audits: r.oosAudits,
                    distinct_products: r.distinctProducts,
                    total_days_oos: r.totalDaysOos,
                  }));
                  downloadCsv("risk-revenue-stock-out-pharmacies.csv", rows);
                }}
                disabled={!data?.stockOutPharmacies?.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {!data || data.stockOutPharmacies.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <Building2 className="h-10 w-10 text-slate-400" />
                  No stock-out pharmacy data yet.
                </div>
              ) : (
                <div className="max-h-[360px] overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-[480px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Pharmacy</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Region</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">OOS audits</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Products</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total days OOS</TableHead>
                          <TableHead className="h-12 px-4 py-0 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...data.stockOutPharmacies]
                          .sort((a, b) => b.oosAudits - a.oosAudits)
                          .map((row) => (
                            <TableRow
                              key={`${row.pharmacy}-${row.region}`}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">
                                {row.pharmacyId ? (
                                  <Link href={`/mr/pharmacies/${row.pharmacyId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                    {row.pharmacy}
                                  </Link>
                                ) : (
                                  row.pharmacy
                                )}
                              </TableCell>
                              <TableCell className="py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200">{row.region}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-900 dark:text-slate-50">{row.oosAudits}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm text-slate-700 dark:text-slate-200">{row.distinctProducts}</TableCell>
                              <TableCell className="tabular-nums py-3.5 px-4 text-right text-sm font-medium text-amber-700 dark:text-amber-300">{row.totalDaysOos}</TableCell>
                              <TableCell className="py-3.5 pr-5 text-center">
                                {row.pharmacyId ? (
                                  <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" asChild>
                                    <Link href={`/mr/pharmacies/${row.pharmacyId}`}>
                                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                      View
                                    </Link>
                                  </Button>
                                ) : (
                                  "—"
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

          <Card className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Supply chain attribution
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Reasons behind out-of-stock events across the network
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                onClick={() => {
                  const rows = data.supplyChainAttribution.map((r) => ({
                    reason: r.name,
                    count: r.value,
                    share_pct: totalSupplyChain ? Math.round((r.value / totalSupplyChain) * 100) : 0,
                  }));
                  downloadCsv("risk-revenue-supply-chain-attribution.csv", rows);
                }}
                disabled={!data.supplyChainAttribution.length}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-6 sm:pb-6 sm:pt-0">
              {data.supplyChainAttribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-14 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                  <Truck className="h-10 w-10 text-slate-400" />
                  No OOS reason data yet.
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="h-64 lg:col-span-7">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.supplyChainAttribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
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
                  <div className="lg:col-span-5">
                    <div className="max-h-64 overflow-auto rounded-2xl border border-slate-200/90 dark:border-slate-700 dark:bg-slate-900/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 bg-slate-100/90 dark:bg-slate-800/90">
                            <TableHead className="h-12 px-4 py-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:pl-5 dark:text-slate-400">Reason</TableHead>
                            <TableHead className="h-12 px-4 py-0 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 last:pr-5 dark:text-slate-400">Share</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.supplyChainAttribution.map((r, i) => (
                            <TableRow key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/50">
                              <TableCell className="py-3.5 pl-5 text-sm font-medium text-slate-900 dark:text-slate-50">{r.name}</TableCell>
                              <TableCell className="tabular-nums py-3.5 pr-5 text-right text-sm text-slate-700 dark:text-slate-200">
                                {totalSupplyChain ? `${((r.value / totalSupplyChain) * 100).toFixed(0)}%` : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="mr-performance"
          forceMount
          className="space-y-8 data-[state=inactive]:hidden"
        >
          {/* Section intro */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              MR Productivity &amp; Performance
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              See how many visits each rep has completed, compare to trends over time, and drill into visit-level detail. Use filters below to match the same data as the Visit History page.
            </p>
          </div>

          {/* Filters — same logic as Visit History */}
          <Card className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800/90 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Filter visits
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Same options as Visit History — counts will match when you apply the same filters.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
                  <select
                    value={visitStatus}
                    onChange={(e) => setVisitStatus(e.target.value)}
                    className="h-9 w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm transition-colors focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">SUBMITTED (default)</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ALL">All statuses</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date from</label>
                  <input
                    type="date"
                    value={visitDateFrom}
                    onChange={(e) => setVisitDateFrom(e.target.value)}
                    className="h-9 w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date to</label>
                  <input
                    type="date"
                    value={visitDateTo}
                    onChange={(e) => setVisitDateTo(e.target.value)}
                    className="h-9 w-[140px] rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Region</label>
                  <select
                    value={visitRegion}
                    onChange={(e) => setVisitRegion(e.target.value)}
                    className="h-9 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">All regions</option>
                    {(data?.regionOptions ?? []).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">MR</label>
                  <select
                    value={visitMrId}
                    onChange={(e) => setVisitMrId(e.target.value)}
                    className="h-9 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">All MRs</option>
                    {(data?.mrOptions ?? []).map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <Button onClick={() => fetchReports()} size="sm" className="bg-sky-600 hover:bg-sky-700">
                    Apply filters
                  </Button>
                  {(visitStatus || visitDateFrom || visitDateTo || visitRegion || visitMrId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      onClick={() => {
                        setVisitStatus("");
                        setVisitDateFrom("");
                        setVisitDateTo("");
                        setVisitRegion("");
                        setVisitMrId("");
                        setTimeout(() => fetchReports(), 0);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total visits
                    </CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    {data?.mrProductivity?.length ?? kpis.totalVisits}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {visitStatus || visitDateFrom || visitDateTo || visitRegion || visitMrId
                      ? "In current filter"
                      : "All submitted"}
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Active MRs
                    </CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    {new Set(data?.mrProductivity?.map((r) => r.mr) ?? []).size}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    With at least one visit
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Avg duration
                    </CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    {data?.mrProductivity?.length
                      ? Math.round(
                          data.mrProductivity.reduce((s, r) => s + r.duration, 0) / data.mrProductivity.length
                        )
                      : 0}
                    <span className="ml-0.5 text-lg font-normal text-slate-500 dark:text-slate-400">min</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Per visit
                  </p>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Visit goal
                    </CardTitle>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                      <Target className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const visitsPerMr: Record<string, number> = {};
                    for (const r of data?.mrProductivity ?? []) {
                      visitsPerMr[r.mr] = (visitsPerMr[r.mr] ?? 0) + 1;
                    }
                    const numReps = Object.keys(visitsPerMr).length || 1;
                    const totalGoal = numReps * 30;
                    const totalActual = Object.values(visitsPerMr).reduce((s, v) => s + v, 0);
                    const progress = Math.min(totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0, 100);
                    return (
                      <>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                          {progress.toFixed(0)}%
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          of 30 visits/MR target
                        </p>
                      </>
                    );
                  })()}
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Visits per MR + Visit Trend side by side on large screens */}
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      Visits per MR
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-slate-600 dark:text-slate-400">
                      How many visits each rep has completed
                    </CardDescription>
                  </div>
                  {data?.mrProductivity?.length ? (
                    <div className="rounded-lg bg-sky-100 px-3 py-1.5 text-sm font-semibold tabular-nums text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                      {data.mrProductivity.reduce((s, r) => s + 1, 0)} total visits
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {!data?.mrProductivity?.length ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 dark:border-slate-700 dark:bg-slate-900/30">
                    <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">No visit data yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Apply filters or wait for submitted visits.</p>
                  </div>
                ) : (
                  (() => {
                    const visitsByMr = data.mrProductivity.reduce<Record<string, number>>(
                      (acc, r) => {
                        acc[r.mr] = (acc[r.mr] ?? 0) + 1;
                        return acc;
                      },
                      {}
                    );
                    const visitsChartData = Object.entries(visitsByMr).map(([mr, value]) => ({ mr, value }));
                    const maxVisits = visitsChartData.length ? Math.max(...visitsChartData.map((d) => d.value)) : 0;
                    const totalBarVisits = visitsChartData.reduce((s, d) => s + d.value, 0);
                    return (
                      <div className="space-y-6">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={visitsChartData}
                              margin={{ top: 12, right: 12, left: 0, bottom: 48 }}
                            >
                              <defs>
                                <linearGradient id="visitsBarGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-40" />
                              <XAxis
                                dataKey="mr"
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                angle={-35}
                                textAnchor="end"
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                domain={[0, maxVisits || 1]}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                axisLine={false}
                                tickLine={false}
                                width={28}
                              />
                              <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                                formatter={(value: number) => [`${Number(value)} visit${Number(value) === 1 ? "" : "s"}`, "Visits"]}
                                labelFormatter={(label) => label}
                              />
                              <Bar
                                dataKey="value"
                                name="Visits"
                                radius={[6, 6, 0, 0]}
                                fill="url(#visitsBarGradient)"
                                minPointSize={4}
                              >
                                <LabelList dataKey="value" position="top" fontSize={12} fontWeight={600} fill="#475569" formatter={(v: unknown) => String(Number(v))} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Visits by rep</span>
                            <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">{totalBarVisits} total</span>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-200/80 hover:bg-transparent dark:border-slate-700/80">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">MR</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Visits</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...visitsChartData]
                                .sort((a, b) => b.value - a.value)
                                .map((row, i) => (
                                  <TableRow
                                    key={i}
                                    className="border-slate-100 dark:border-slate-700/50 even:bg-white/60 dark:even:bg-slate-800/30"
                                  >
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{row.mr}</TableCell>
                                    <TableCell className="text-right tabular-nums font-medium text-slate-700 dark:text-slate-300">{row.value}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Visit trend
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Visits over time (all submitted)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {!chartData.byMonth.length ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 dark:border-slate-700 dark:bg-slate-900/30">
                    <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">No trend data yet</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.byMonth}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-40" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="visits"
                          stroke="#22c55e"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visit-level detail */}
          <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Visit detail
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    MR, pharmacy, check-in time and duration. First 50 visits (most recent). Short visits with full audits may need a quality check.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.mrProductivity?.length ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">No visit data yet</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 z-10 border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-800/95">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">MR</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Pharmacy</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Check-in</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.mrProductivity.slice(0, 50).map((r, i) => (
                        <TableRow
                          key={i}
                          className="border-slate-100 dark:border-slate-700/50 even:bg-slate-50/30 dark:even:bg-slate-800/20"
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{r.mr}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">{r.pharmacy}</TableCell>
                          <TableCell className="tabular-nums text-slate-600 dark:text-slate-400">
                            {r.checkIn ? new Date(r.checkIn).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-slate-700 dark:text-slate-300">
                            {Math.round(r.duration)} min
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="report-library"
          forceMount
          className="space-y-6 data-[state=inactive]:hidden"
        >
          <Card className="overflow-hidden rounded-2xl border border-slate-400/80 bg-gradient-to-br from-slate-50 via-white to-slate-50/50  dark:border-slate-700 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Report Library
              </CardTitle>
              <CardDescription className="text-slate-800 dark:text-slate-400">
                Quick access to detailed analytics reports. Open in app or download as PDF.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                key: "lostSales",
                icon: TrendingDown,
                title: "Lost Sales Opportunity",
                description:
                  "Quantify revenue left on the table when products were out of stock.",
                targetTab: "risk-revenue",
              },
              {
                key: "substitutionThreat",
                icon: AlertTriangle,
                title: "Substitution Threat Index",
                description:
                  "Understand why competitors are winning and where brand loyalty is fragile.",
                targetTab: "product-insights",
              },
              {
                key: "shareOfVoice",
                icon: BarChart3,
                title: "Share of Voice",
                description:
                  "Compare prescription share vs. observed activity by product.",
                targetTab: "product-insights",
              },
              {
                key: "mrProductivity",
                icon: Users,
                title: "MR Productivity",
                description:
                  "Drill into visit duration, coverage, and rep-level efficiency.",
                targetTab: "mr-performance",
              },
              {
                key: "doctors",
                icon: Users,
                title: "Doctors Report",
                description:
                  "All doctors and the products they prescribe. Focus engagement on high-Rx prescribers.",
                targetTab: "product-insights",
              },
              {
                key: "marketing",
                icon: Megaphone,
                title: "Marketing Insights",
                description:
                  "Track competitor activities and on-the-ground marketing signals.",
                targetTab: "product-insights",
              },
              {
                key: "pricing",
                icon: DollarSign,
                title: "Comparative Pricing",
                description:
                  "See pricing deltas by product and region vs. key competitors.",
                targetTab: "product-insights",
              },
              {
                key: "substitutionRate",
                icon: ArrowLeftRight,
                title: "Substitution Rate",
                description:
                  "Monitor product-level substitution and rival share capture.",
                targetTab: "product-insights",
              },
              {
                key: "supplyChain",
                icon: Truck,
                title: "Supply Chain Attribution",
                description:
                  "Diagnose logistics, procurement, and distribution drivers of OOS.",
                targetTab: "risk-revenue",
              },
              {
                key: "regionCoverage",
                icon: MapPin,
                title: "Region Coverage",
                description:
                  "See which regions are active and how many pharmacies you reach in each.",
                targetTab: "field-activity",
              },
              {
                key: "stockOutPharmacies",
                icon: PackageSearch,
                title: "Stock-out Pharmacies",
                description:
                  "List of pharmacies with stock-outs, products affected, and total OOS days.",
                targetTab: "risk-revenue",
              },
              {
                key: "vulnerableProducts",
                icon: ShieldAlert,
                title: "Most Vulnerable Products",
                description:
                  "Products with the highest substitution rates and main rivals.",
                targetTab: "product-insights",
              },
            ].map((card, index) => {
              const IconComponent = card.icon;
              const number = String(index + 1).padStart(2, "0");
              return (
                <div
                  key={card.key}
                  className="group flex h-full flex-col overflow-hidden rounded-xl bg-white border border-slate-500 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:bg-slate-800/90 dark:shadow-none dark:ring-1 dark:ring-slate-700 dark:hover:ring-slate-600"
                >
                  {/* Blue accent line */}
                  <div className="h-0.5 w-full shrink-0 bg-blue-700 dark:bg-blue-600" />

                  <button
                    type="button"
                    onClick={() => setActiveTab(card.targetTab)}
                    className="flex flex-1 flex-col items-start gap-4 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400"
                  >
                    {/* Icon + number */}
                    <div className="flex w-full items-center justify-between">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-400/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
                        <IconComponent className="h-5 w-5 text-slate-800 dark:text-slate-300" strokeWidth={1.5} />
                      </div>
                      <span className="text-lg font-medium tabular-nums text-slate-400 dark:text-slate-800">
                        {number}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div className="min-w-0 space-y-2">
                      <p className="text-xl font-semibold leading-tight text-slate-900 dark:text-slate-50">
                        {card.title}
                      </p>
                      <p className="text-sm leading-snug text-slate-800 dark:text-slate-400">
                        {card.description}
                      </p>
                    </div>
                  </button>

                  {/* Single primary CTA + secondary link */}
                  <div className="flex flex-col gap-2 px-5 pb-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportOpen(card.key);
                      }}
                      disabled={reportPdfLoading !== null}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 py-2.5 text-sm font-medium text-white  ring-1 ring-blue-600/30 transition hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:ring-blue-500/30 dark:hover:bg-blue-700"
                    >
                      {reportPdfLoading === card.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Open Report
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportDownload(card.key);
                      }}
                      disabled={reportPdfLoading !== null}
                      className="text-center mt-2 border border-slate-500 rounded-full px-2 py-2 text-sm font-medium hover:bg-slate-600 hover:text-white text-slate-800 transition hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      {reportPdfLoading === card.key ? "Generating…" : "Download PDF"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
