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
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import { MrHistoryFilters } from "../MrHistoryFilters";
import {
  MrSalesCampaignHistoryTable,
  type SalesCampaignVisitRow,
} from "./MrSalesCampaignHistoryTable";
import { Suspense } from "react";

const SC_SELECT = `
  id,
  check_in_time,
  check_out_time,
  visit_duration_minutes,
  objective,
  status,
  mr_pharmacies (name, region),
  mr_profiles (full_name),
  mr_orders (
    id,
    status,
    distributor_name,
    order_date,
    mr_order_items ( id )
  ),
  mr_visit_marketing (
    wobblers,
    posters,
    shelf_talkers,
    flyers
  )
`;

const SC_SELECT_MINIMAL = `
  id,
  check_in_time,
  check_out_time,
  visit_duration_minutes,
  objective,
  status,
  mr_pharmacies (name, region),
  mr_profiles (full_name),
  mr_orders (
    id,
    status,
    distributor_name,
    order_date
  ),
  mr_visit_marketing (
    wobblers,
    posters,
    shelf_talkers,
    flyers
  )
`;

export default async function MrSalesCampaignHistoryPage({
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
    let q = supabase
      .from("mr_visits")
      .select(SC_SELECT)
      .eq("mr_id", auth.user.id)
      .in("objective", ["SALES", "CAMPAIGN"])
      .order("check_in_time", { ascending: false })
      .limit(MR_SUPABASE_MAX_ROWS);

    const res = await q;
    let visits: SalesCampaignVisitRow[] = (res.data ?? []) as unknown as SalesCampaignVisitRow[];
    if (res.error) {
      const res2 = await supabase
        .from("mr_visits")
        .select(SC_SELECT_MINIMAL)
        .eq("mr_id", auth.user.id)
        .in("objective", ["SALES", "CAMPAIGN"])
        .order("check_in_time", { ascending: false })
        .limit(MR_SUPABASE_MAX_ROWS);
      visits = (res2.data ?? []) as unknown as SalesCampaignVisitRow[];
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Sales &amp; campaign history
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Visits with Sales or Campaign objective (including the third option when starting a visit). Order data comes from{" "}
            <code className="text-xs">mr_orders</code> / <code className="text-xs">mr_order_items</code>; merchandising from{" "}
            <code className="text-xs">mr_visit_marketing</code>.
          </p>
        </div>

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Your sales &amp; campaign visits
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Up to {MR_SUPABASE_MAX_ROWS} most recent · open a row for a read-only summary, or use the megaphone to edit the campaign workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!visits || visits.length === 0 ? (
              <EmptyState role="MR" />
            ) : (
              <MrSalesCampaignHistoryTable visits={visits} showMrColumn={false} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  let visitsQuery = supabase
    .from("mr_visits")
    .select(SC_SELECT)
    .in("objective", ["SALES", "CAMPAIGN"])
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

  let visitsData: SalesCampaignVisitRow[] = (visitsRes.data ?? []) as unknown as SalesCampaignVisitRow[];
  if (visitsRes.error) {
    let fallbackQuery = supabase
      .from("mr_visits")
      .select(SC_SELECT_MINIMAL)
      .in("objective", ["SALES", "CAMPAIGN"])
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
    visitsData = (fallbackRes.data ?? []) as unknown as SalesCampaignVisitRow[];
  }

  let visits = visitsData;

  if (region && visits.length > 0) {
    visits = visits.filter((v) => {
      const ph = Array.isArray(v.mr_pharmacies) ? v.mr_pharmacies[0] : v.mr_pharmacies;
      return (ph as { region?: string } | null)?.region === region;
    });
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
            Sales &amp; campaign history
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Sales and Campaign visits in scope, with order headers and merchandising from{" "}
            <code className="text-xs">mr_orders</code>, line items from <code className="text-xs">mr_order_items</code>, and materials from{" "}
            <code className="text-xs">mr_visit_marketing</code>. Same table styling as Visit history.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <MrHistoryFilters
          mrOptions={mrOptions}
          regionOptions={regionOptions}
          role={role}
          basePath="/mr/history/sales-campaign"
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
        <MrSalesCampaignHistoryTable visits={visits} showMrColumn={true} />
      )}
    </div>
  );
}

function EmptyState({ role }: { role: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 py-12 dark:border-slate-600 dark:bg-slate-800/50">
      <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
        <Megaphone className="h-10 w-10 text-slate-600 dark:text-slate-300" />
      </div>
      <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
        No sales or campaign visits yet
      </h3>
      <p className="mt-1 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
        {role === "MR"
          ? "Start a new visit and choose Sales or Campaign as the objective, or use Campaign visit. Submitted data will appear here with orders and merchandising."
          : "No visits match the current filters. Try changing MR, region, status, or date range."}
      </p>
      {role === "MR" && (
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/mr/visit/create">Start a visit</Link>
        </Button>
      )}
    </div>
  );
}
