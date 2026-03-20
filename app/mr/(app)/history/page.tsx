import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MR_SUPABASE_MAX_ROWS } from "@/lib/mr/supabase-limits";
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
import { History } from "lucide-react";
import { MrHistoryFilters } from "./MrHistoryFilters";
import { MrVisitHistoryTable } from "./MrVisitHistoryTable";
import { Suspense } from "react";

type VisitRow = {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  visit_duration_minutes: number | null;
  objective: string;
  status: string;
  notes?: string | null;
  patients_per_day?: number | null;
  basket_value_per_patient?: number | null;
  mr_pharmacies: { name: string; region?: string } | null;
  mr_profiles?: { full_name: string } | null;
};

export default async function MrHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const params = await searchParams;
  const mrId = typeof params.mrId === "string" ? params.mrId : undefined;
  const region = typeof params.region === "string" ? params.region : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : undefined;

  const { supabase } = auth;
  const role = auth.profile.role as "MR" | "MANAGER" | "ADMIN";

  if (role === "MR") {
    // MR sees all of their own visits, no filters
    const { data: visits, error: visitsError } = await supabase
      .from("mr_visits")
      .select(`
        id,
        check_in_time,
        check_out_time,
        visit_duration_minutes,
        objective,
        status,
        mr_pharmacies (name, region)
      `)
      .eq("mr_id", auth.user.id)
      .order("check_in_time", { ascending: false })
      .limit(MR_SUPABASE_MAX_ROWS);

    if (visitsError) {
      console.error("MR visits fetch error:", visitsError);
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Visit History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Your submitted visits. Read-only. No edits allowed.
          </p>
        </div>

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">Recent Visits</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Your visits (up to {MR_SUPABASE_MAX_ROWS} most recent)
            </CardDescription>
          </CardHeader>
        <CardContent>
          {!visits || visits.length === 0 ? (
            <EmptyState role="MR" />
          ) : (
            <MrVisitHistoryTable visits={visits as unknown as VisitRow[]} showMrColumn={false} />
          )}
        </CardContent>
        </Card>
      </div>
    );
  }

  // Manager / Admin: same robust experience – fetch all data (notes, audit metrics when columns exist)
  const fullSelect = `
    id,
    check_in_time,
    check_out_time,
    visit_duration_minutes,
    objective,
    status,
    notes,
    patients_per_day,
    basket_value_per_patient,
    mr_pharmacies (name, region),
    mr_profiles (full_name)
  `;
  const minimalSelect = `
    id,
    check_in_time,
    check_out_time,
    visit_duration_minutes,
    objective,
    status,
    mr_pharmacies (name, region),
    mr_profiles (full_name)
  `;

  let visitsQuery = supabase
    .from("mr_visits")
    .select(fullSelect)
    .order("check_in_time", { ascending: false });
  if (mrId) visitsQuery = visitsQuery.eq("mr_id", mrId);
  if (status) visitsQuery = visitsQuery.eq("status", status);
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    visitsQuery = visitsQuery.gte("check_in_time", from.toISOString());
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    visitsQuery = visitsQuery.lte("check_in_time", to.toISOString());
  }

  visitsQuery = visitsQuery.limit(MR_SUPABASE_MAX_ROWS);

  const visitsRes = await visitsQuery;

  // If full select fails (e.g. notes/patients_per_day columns not yet migrated), fall back to minimal
  let visitsData: VisitRow[] = (visitsRes.data ?? []) as unknown as VisitRow[];
  if (visitsRes.error) {
    let fallbackQuery = supabase
      .from("mr_visits")
      .select(minimalSelect)
      .order("check_in_time", { ascending: false })
      .limit(MR_SUPABASE_MAX_ROWS);
    if (mrId) fallbackQuery = fallbackQuery.eq("mr_id", mrId);
    if (status) fallbackQuery = fallbackQuery.eq("status", status);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      fallbackQuery = fallbackQuery.gte("check_in_time", from.toISOString());
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      fallbackQuery = fallbackQuery.lte("check_in_time", to.toISOString());
    }
    const fallbackRes = await fallbackQuery;
    visitsData = (fallbackRes.data ?? []) as unknown as VisitRow[];
  }

  const [mrProfilesRes, regionsRes] = await Promise.all([
    role === "ADMIN"
      ? supabase
          .from("mr_profiles")
          .select("id, full_name")
          .eq("role", "MR")
          .order("full_name")
      : supabase
          .from("mr_profiles")
          .select("id, full_name")
          .eq("role", "MR")
          .eq("manager_id", auth.user.id)
          .order("full_name"),
    supabase.from("mr_pharmacies").select("region"),
  ]);

  let visits = visitsData;

  // Filter by region in JS (nested filter not always straightforward)
  if (region && visits.length > 0) {
    visits = visits.filter((v) => {
      const ph = Array.isArray(v.mr_pharmacies) ? v.mr_pharmacies[0] : v.mr_pharmacies;
      return (ph as { region?: string } | null)?.region === region;
    });
  }

  const mrOptions = (mrProfilesRes.data ?? []).map((p: { id: string; full_name: string }) => ({
    id: p.id,
    full_name: p.full_name,
  }));
  const regionRows = regionsRes.data ?? [];
  const regionSet = new Set(
    regionRows.map((r: { region?: string }) => r.region).filter(Boolean)
  );
  const regionOptions = Array.from(regionSet).sort() as string[];

  const filterInitial = {
    mrId: mrId ?? undefined,
    region: region ?? undefined,
    status: status ?? undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Visit History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            All visits you can see, with full data (notes, audit metrics). Filter by MR, region, status, or date range.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <MrHistoryFilters
          mrOptions={mrOptions}
          regionOptions={regionOptions}
          role={role}
          initial={filterInitial}
        />
      </Suspense>

      {visits.length === 0 ? (
        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardContent className="pt-6">
            <EmptyState role={role} />
          </CardContent>
        </Card>
      ) : (
        <MrVisitHistoryTable visits={visits} showMrColumn={true} />
      )}
    </div>
  );
}

function EmptyState({ role }: { role: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 py-12 dark:border-slate-600 dark:bg-slate-800/50">
      <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
        <History className="h-10 w-10 text-slate-600 dark:text-slate-300" />
      </div>
      <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
        No visits yet
      </h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-600 dark:text-slate-400">
        {role === "MR"
          ? "Start a visit from a pharmacy to record audits and notes. Your submitted visits will appear here."
          : "No visits match the current filters. Try changing or clearing filters."}
      </p>
      {role === "MR" && (
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/mr/pharmacies">View pharmacies</Link>
        </Button>
      )}
    </div>
  );
}
