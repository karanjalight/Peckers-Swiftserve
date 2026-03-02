"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
import { deleteVisit } from "@/app/mr/actions";
import { Search, Eye, Clock3, CheckCircle2, MapPin, Trash2 } from "lucide-react";

type VisitRow = {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  visit_duration_minutes: number | null;
  objective: string;
  status: string;
  mr_pharmacies: { name: string; region?: string } | { name: string; region?: string }[] | null;
  mr_profiles?: { full_name: string } | { full_name: string }[] | null;
};

interface MrVisitHistoryTableProps {
  visits: VisitRow[];
  showMrColumn: boolean;
}

export function MrVisitHistoryTable({ visits, showMrColumn }: MrVisitHistoryTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pharmacy = (v: VisitRow) =>
    Array.isArray(v.mr_pharmacies) ? v.mr_pharmacies[0] : v.mr_pharmacies;
  const profile = (v: VisitRow) =>
    Array.isArray(v.mr_profiles) ? v.mr_profiles[0] : v.mr_profiles;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter((v) => {
      const ph = pharmacy(v);
      const mr = profile(v);
      const fields = [
        v.id,
        v.status,
        v.objective,
        ph?.name ?? "",
        ph?.region ?? "",
        mr?.full_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [visits, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  function formatReference(id: string) {
    const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `VIS-${short}`;
  }

  function formatDateTime(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return { top: "—", bottom: "" };
    return {
      top: format(d, "dd MMM yyyy"),
      bottom: format(d, "HH:mm"),
    };
  }

  function handleChangePage(next: number) {
    startTransition(() => {
      setPage(next);
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this visit? This cannot be undone.");
    if (!confirmed) return;

    setPendingId(id);
    startTransition(async () => {
      const res = await deleteVisit(id);
      setPendingId(null);
      if (!res.success) {
        alert(res.error ?? "Failed to delete visit");
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
              Visits
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} of {visits.length} visits shown
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[60vh]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by pharmacy, MR, or status"
                className="h-9 lg:h-12 w-full rounded-2xl border-slate-500 bg-slate-50 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-400 bg-slate-50/60 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <HistoryEmptyIcon />
            <p className="mt-2">No visits match your filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-400 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
            <div className="overflow-auto">
              <Table className="rounded-b-2xl">
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 rounded-t-2xl bg-[#071b5f] hover:bg-[#071b5f] text-xs font-semibold uppercase tracking-wide text-white">
                    <TableHead className="min-w-[130px] pl-3 py-8 text-white  border-none pl-3 ">
                      Reference No.
                    </TableHead>
                    <TableHead className="min-w-[200px] text-white border-none">
                      Pharmacy
                    </TableHead>
                    {/* {showMrColumn && (
                      <TableHead className="min-w-[170px] text-white border-none">
                        MR
                      </TableHead>
                    )} */}
                    <TableHead className="min-w-[140px] text-white border-none">
                      Region
                    </TableHead>
                    <TableHead className="min-w-[150px] text-white  border-none">
                      Date &amp; Time
                    </TableHead>
                    <TableHead className="min-w-[120px] text-white  border-none">
                      Duration
                    </TableHead>
                    <TableHead className="min-w-[120px] text-white  border-none text-right">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[140px] text-white  border-none text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((v) => {
                    const ph = pharmacy(v);
                    const mr = profile(v);
                    const dt = formatDateTime(v.check_in_time);
                    const isSubmitted = v.status === "SUBMITTED";
                    return (
                      <TableRow
                        key={v.id}
                        className="border-b border-slate-400 text-sm text-slate-800 hover:bg-slate-50/80 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800/70"
                      >
                        <TableCell className="py-4 font-medium text-slate-900  py-6 dark:text-white">
                          {formatReference(v.id)}
                        </TableCell>
                        <TableCell className="text-lg">
                          <div className="flex flex-col">
                            <Link
                              href={`/mr/visit/${v.id}`}
                              className="line-clamp-2 font-medium text-blue-900 hover:underline dark:text-blue-300"
                            >
                              {ph?.name ?? "—"}
                            </Link>
                            {showMrColumn && mr?.full_name && (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                by {mr.full_name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {/* {showMrColumn && (
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {mr?.full_name ?? "—"}
                          </TableCell>
                        )} */}
                        <TableCell className="text-md text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {ph?.region ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 dark:text-slate-200">
                          <div className="flex flex-col">
                            <span>{dt.top}</span>
                            {dt.bottom && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {dt.bottom}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3 text-slate-400" />
                            {v.visit_duration_minutes != null
                              ? `${Math.round(v.visit_duration_minutes)} min`
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <span
                            className={`inline-flex min-w-[88px] items-center justify-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                              isSubmitted
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-900"
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {v.status}
                          </span>
                        </TableCell>
                        <TableCell className="flex items-center mt-2 justify-center space-x-2 pt-2 text-right">
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="h-8 rounded-full bg-blue-900 px-3 text-xs text-white hover:bg-blue-800"
                          >
                            <Link href={`/mr/visit/${v.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleDelete(v.id)}
                            disabled={isPending && pendingId === v.id}
                            className="h-8 rounded-full bg-white px-2 text-xs  text-red-600 ring-1 ring-red-200 hover:bg-red-50 dark:bg-slate-900 dark:text-red-300 dark:ring-red-900/60 dark:hover:bg-red-950/30"
                          >
                            {isPending && pendingId === v.id ? (
                              <span>...</span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                  onClick={() => handleChangePage(Math.max(1, page - 1))}
                  className="rounded-full border-slate-300 px-6 py-4 text-xs font-medium text-slate-50 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-800 dark:text-slate-400">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || filtered.length === 0}
                  onClick={() => handleChangePage(Math.min(totalPages, page + 1))}
                  className="rounded-full border-slate-300 px-6 py-4 text-xs font-medium text-slate-50 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
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

function HistoryEmptyIcon() {
  return (
    <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
      <Clock3 className="h-8 w-8 text-slate-600 dark:text-slate-300" />
    </div>
  );
}

