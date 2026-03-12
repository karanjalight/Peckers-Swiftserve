"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { deletePharmacy } from "@/app/mr/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  MapPin,
  Trash2,
  Loader2,
  Search,
  Eye,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";

type PharmacyRow = {
  id: string;
  name: string;
  region: string;
  sub_region?: string | null;
  location_text?: string | null;
  procurement_name?: string | null;
  procurement_contact?: string | null;
  created_at?: string | null;
  avg_order_value?: number | null;
  lost_sales_revenue?: number | null;
};

type ValueSegment = "ALL" | "HIGH" | "MEDIUM" | "LOW_OR_UNKNOWN";

type SortMode = "RECENT" | "NAME_ASC" | "NAME_DESC" | "REGION" | "LOST_SALES_DESC";

interface MrPharmaciesTableProps {
  pharmacies: PharmacyRow[];
  canDelete: boolean;
}

export function MrPharmaciesTable({ pharmacies, canDelete }: MrPharmaciesTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [segment, setSegment] = useState<ValueSegment>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortMode, setSortMode] = useState<SortMode>("RECENT");

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          pharmacies
            .map((p) => p.region)
            .filter((r): r is string => !!r && r.trim().length > 0)
        )
      ).sort(),
    [pharmacies]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateRange?.from ? new Date(dateRange.from) : null;
    const to = dateRange?.to ? new Date(dateRange.to) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const bySearch = pharmacies.filter((p) => {
      const ref = formatReference(p.id).toLowerCase();
      const fields = [
        p.name,
        p.region,
        p.sub_region ?? "",
        p.location_text ?? "",
        p.procurement_name ?? "",
        p.procurement_contact ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q) || ref.includes(q);
    });
    const bySegment = bySearch.filter((p) => {
      const v = p.avg_order_value ?? null;
      if (segment === "ALL" || v == null) {
        return segment === "ALL" || segment === "LOW_OR_UNKNOWN";
      }
      if (segment === "HIGH") return v >= 200000;
      if (segment === "MEDIUM") return v >= 50000 && v < 200000;
      if (segment === "LOW_OR_UNKNOWN") return v < 50000;
      return true;
    });
    const byRegion = bySegment.filter((p) =>
      regionFilter === "ALL" ? true : p.region === regionFilter
    );
    const byDate = byRegion.filter((p) => {
      if (!from && !to) return true;
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      if (Number.isNaN(created.getTime())) return false;
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
    const sorted = [...byDate].sort((a, b) => {
      if (sortMode === "NAME_ASC" || sortMode === "NAME_DESC") {
        const na = (a.name || "").toLowerCase();
        const nb = (b.name || "").toLowerCase();
        if (na < nb) return sortMode === "NAME_ASC" ? -1 : 1;
        if (na > nb) return sortMode === "NAME_ASC" ? 1 : -1;
        return 0;
      }
      if (sortMode === "REGION") {
        const ra = (a.region || "").toLowerCase();
        const rb = (b.region || "").toLowerCase();
        if (ra < rb) return -1;
        if (ra > rb) return 1;
        return 0;
      }
      if (sortMode === "LOST_SALES_DESC") {
        const la = a.lost_sales_revenue ?? 0;
        const lb = b.lost_sales_revenue ?? 0;
        if (lb !== la) return lb - la;
      }
      // Default / RECENT: newest created_at first, fallback to name
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (tb !== ta) return tb - ta;
      const na = (a.name || "").toLowerCase();
      const nb = (b.name || "").toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    });
    return sorted;
  }, [pharmacies, query, segment, regionFilter, dateRange, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [query, segment, regionFilter, dateRange, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  function formatReference(id: string) {
    const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `PH-${short}`;
  }

  function formatDate(dateString?: string | null) {
    if (!dateString) return { top: "—", bottom: "" };
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return { top: "—", bottom: "" };
    return {
      top: d.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      bottom: d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function handleExportCsv() {
    if (!filtered.length) return;
    const header = [
      "Reference",
      "Pharmacy",
      "Region",
      "Location",
      "Procurement contact",
      "Created at",
      "Lost sales (KES)",
    ];
    const rows = filtered.map((p) => {
      const dateParts = formatDate(p.created_at);
      const createdAt = [dateParts.top, dateParts.bottom].filter(Boolean).join(" ");
      const lostSales =
        p.lost_sales_revenue != null ? Math.round(p.lost_sales_revenue).toString() : "";
      const values = [
        formatReference(p.id),
        p.name ?? "",
        [p.region, p.sub_region].filter(Boolean).join(" • "),
        p.location_text ?? "",
        p.procurement_contact || p.procurement_name || "",
        createdAt,
        lostSales,
      ];
      return values
        .map((v) => {
          const s = String(v ?? "");
          const escaped = s.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");
    });
    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pharmacies.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDelete(id: string) {
    if (!canDelete) return;
    const confirmDelete = window.confirm("Delete this pharmacy? This cannot be undone.");
    if (!confirmDelete) return;

    setPendingId(id);
    startTransition(async () => {
      const result = await deletePharmacy(id);
      setPendingId(null);
      if (!result.success) {
        alert(result.error ?? "Failed to delete pharmacy");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-400 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="space-y-1">
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Pharmacies
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} of {pharmacies.length} pharmacies shown
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[60vh]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by reference, name, or location"
                className="h-9 lg:h-12 w-full rounded-2xl border-slate-500 bg-slate-50 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-9 lg:h-12 w-full rounded-2xl border border-slate-500 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="ALL">All regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="h-9 lg:h-12 w-full rounded-2xl border border-slate-500 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="RECENT">Sort: Most recent</option>
                <option value="NAME_ASC">Sort: Name A–Z</option>
                <option value="NAME_DESC">Sort: Name Z–A</option>
                <option value="REGION">Sort: Region</option>
                <option value="LOST_SALES_DESC">Sort: Lost sales (high → low)</option>
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="flex h-9 lg:h-12 items-center gap-2 rounded-2xl border-slate-500 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 lg:h-12 items-center gap-2 rounded-2xl border border-slate-500 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <span className="whitespace-nowrap">
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "dd MMM yyyy")} → ${format(
                          dateRange.to,
                          "dd MMM yyyy"
                        )}`
                      : "Filter by date range"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                />
                <div className="mt-3 flex justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Showing pharmacies created within this range.
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-400 bg-slate-50/60 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <MapPin className="mb-2 h-8 w-8 text-slate-400 dark:text-slate-300" />
            <p>No pharmacies match your search.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl text-whitel dark:text-white border border-slate-400 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className=" overflow-auto">
              <Table className="rounded-b-2xl">
                <TableHeader className="py-12">
                  <TableRow className="sticky top-0 z-10   bg-[#071b5f] hover:bg-[#071b5f] rounded-t-2xl text-xs font-semibold uppercase tracking-wide text-white">
                    <TableHead className="min-w-[130px] border-none  pl-3 py-8 text-white">Reference No.</TableHead>
                    <TableHead className="min-w-[200px] text-white border-none">Pharmacy</TableHead>
                    <TableHead className="min-w-[160px] text-white border-none">Region</TableHead>
                    <TableHead className="min-w-[150px] text-white border-none">Location</TableHead>
                    <TableHead className="min-w-[220px] text-white border-none">
                      Procurement Contact
                    </TableHead>
                    <TableHead className="min-w-[140px] text-white border-none text-right">
                      Lost Sales (KES)
                    </TableHead>
                    <TableHead className="min-w-[120px] text-white border-none">Date &amp; Time</TableHead>
                    <TableHead className="min-w-[120px] text-white border-none text-right">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[150px] text-white border-none text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((p) => {
                    const dateParts = formatDate(p.created_at);
                    return (
                    <TableRow
                      key={p.id}
                      className="border-b border-slate-400 text-sm   text-slate-800 hover:bg-slate-50/80 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/70"
                    >
                      <TableCell className="font-medium text-slate-900 py-6 dark:text-white">
                        {formatReference(p.id)}
                      </TableCell>

                      <TableCell>
                        <span className="line-clamp-2 font-medium">{p.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          {p.region}
                          {p.sub_region ? ` • ${p.sub_region}` : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {p.location_text || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-slate-700 dark:text-slate-200">
                          {/* <span>{p.procurement_name || ""}</span> */}
                          <span className="text-slate-500 dark:text-slate-400">
                            {p.procurement_contact || p.procurement_name || ""}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-right text-slate-700 dark:text-slate-200">
                        {p.lost_sales_revenue != null
                          ? `KES ${Math.round(p.lost_sales_revenue).toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-200">
                        <div className="flex flex-col">
                          <span>{dateParts.top}</span>
                          {dateParts.bottom && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {dateParts.bottom}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2 flex b pt-4 justify-center items-bottom text-right">
                        <Button
                          asChild
                          variant="default"
                          size="sm"
                          className="h-8 rounded-full border-slate-300 px-3 text-xs text-white bg-blue-900 hover:bg-blue-800"
                        >
                          <Link href={`/mr/pharmacies/${p.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canDelete && (
                          <Button
                            type="button"
                            // variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            disabled={isPending && pendingId === p.id}
                            className="h-8 rounded-full px-2 text-xs text-red-600 bg-white"
                          >
                            {isPending && pendingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                                
                              </span>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <div className="flex items-center gap-4">
                <span>
                  Showing{" "}
                  <span className="font-semibold">
                    {filtered.length === 0 ? 0 : startIndex + 1}-
                    {Math.min(endIndex, filtered.length)}
                  </span>{" "}
                  of <span className="font-semibold">{filtered.length}</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const next = Number(e.target.value) || 25;
                      setPageSize(next);
                      setPage(1);
                    }}
                    className="h-8 rounded-full border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {[25, 50, 100, 300, 500, 1000].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className=" rounded-full border-slate-300 px-6 text-xs font-medium text-slate-50 py-4 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Previous
                </Button>
                <span className="text-md text-slate-800 dark:text-slate-400">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || filtered.length === 0}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className=" rounded-full border-slate-300 px-6 text-xs font-medium text-slate-50 py-4 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

