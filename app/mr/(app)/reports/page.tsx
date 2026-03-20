import { redirect } from "next/navigation";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { MrReportsClient } from "./MrReportsClient";
import { MrAdvancedReports } from "./MrAdvancedReports";

export default async function MrReportsPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const isManager =
    auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  const { supabase } = auth;

  if (isManager) {
    // Managers/Admins see full analytics reports
    const [visitsRes, productAuditsRes, competitorAuditsRes] = await Promise.all(
      [
        fetchAllByRange((from, to) =>
          supabase
            .from("mr_visits")
            .select(
              "id, check_in_time, visit_duration_minutes, objective, mr_pharmacies(name, region)"
            )
            .eq("status", "SUBMITTED")
            .order("check_in_time", { ascending: false })
            .range(from, to)
        ),
        fetchAllByRange((from, to) =>
          supabase
            .from("mr_product_audits")
            .select("id, quantity_in_stock, mr_products(name)")
            .range(from, to)
        ),
        fetchAllByRange((from, to) =>
          supabase.from("mr_competitor_audits").select("id").range(from, to)
        ),
      ]
    );

    const visits = visitsRes.data ?? [];
    const productAudits = productAuditsRes.data ?? [];
    const competitorCount = competitorAuditsRes.data?.length ?? 0;
    const stockOuts = productAudits.filter(
      (pa: { quantity_in_stock: number }) => pa.quantity_in_stock === 0
    ).length;
    const totalProductAudits = productAudits.length;
    const substitutionRate =
      totalProductAudits > 0
        ? (competitorCount / totalProductAudits) * 100
        : 0;

    const regionCounts: Record<string, number> = {};
    const objectiveCounts: Record<string, number> = {};
    const pharmacyCounts: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const productCounts: Record<string, number> = {};

    for (const v of visits) {
      const ph = (v as unknown as {
        mr_pharmacies?: { region?: string; name?: string } | null;
      }).mr_pharmacies;
      const region = ph?.region ?? "Unknown";
      const pharmacyName = ph?.name ?? "Unknown";
      const objective = (v as { objective?: string }).objective ?? "AUDIT";

      regionCounts[region] = (regionCounts[region] ?? 0) + 1;
      pharmacyCounts[pharmacyName] = (pharmacyCounts[pharmacyName] ?? 0) + 1;
      objectiveCounts[objective] = (objectiveCounts[objective] ?? 0) + 1;

      const d = new Date((v as { check_in_time: string }).check_in_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }

    for (const pa of productAudits) {
      const name =
        (() => {
          const mp = (pa as { mr_products?: { name: string } | { name: string }[] | null }).mr_products;
          return (Array.isArray(mp) ? mp[0] : mp)?.name;
        })() ??
        "Unknown";
      productCounts[name] = (productCounts[name] ?? 0) + 1;
    }

    const chartData = {
      byRegion: Object.entries(regionCounts).map(([name, value]) => ({
        name,
        value,
      })),
      byObjective: Object.entries(objectiveCounts).map(([name, value]) => ({
        name,
        value,
      })),
      byPharmacy: Object.entries(pharmacyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value })),
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, count]) => ({ name, visits: count })),
      byProduct: Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
    };

    const recentVisits = visits.slice(0, 30).map((v: Record<string, unknown>) => ({
      id: String(v.id ?? ""),
      checkIn: v.check_in_time as string,
      pharmacy:
        ((v.mr_pharmacies as { name: string } | null) ?? {})?.name ?? "—",
      region: ((v.mr_pharmacies as { region?: string } | null) ?? {})?.region ?? "—",
      objective: (v.objective as string) ?? "—",
    }));

    const managerKpis = {
      totalVisits: visits.length,
      stockOuts,
      substitutionRate: Math.round(substitutionRate * 10) / 10,
      totalProductAudits,
      competitorCount,
      uniquePharmacies: Object.keys(pharmacyCounts).length,
    };

    return (
      <div className="space-y-10">
        <MrReportsClient
          mode="manager"
          kpis={managerKpis}
          chartData={chartData}
          recentVisits={recentVisits}
        />
        <MrAdvancedReports
          kpis={managerKpis}
          chartData={chartData}
          recentVisits={recentVisits}
        />
      </div>
    );
  }

  // MR sees their personal visit stats
  const visitsRes = await fetchAllByRange((from, to) =>
    supabase
      .from("mr_visits")
      .select(
        "id, check_in_time, visit_duration_minutes, objective, status, mr_pharmacies(name)"
      )
      .eq("mr_id", auth.user.id)
      .in("status", ["OPEN", "SUBMITTED"])
      .order("check_in_time", { ascending: false })
      .range(from, to)
  );
  const visits = visitsRes.data;

  const submittedVisits =
    (visits ?? []).filter(
      (v) => (v as { status?: string }).status === "SUBMITTED"
    );

  const totalVisits = submittedVisits.length;
  const byMonth: Record<string, number> = {};
  const byObjective: Record<string, number> = {};
  const byPharmacy: Record<string, number> = {};

  for (const v of submittedVisits) {
    const d = new Date((v as { check_in_time: string }).check_in_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + 1;

    const objective = (v as { objective?: string }).objective ?? "AUDIT";
    byObjective[objective] = (byObjective[objective] ?? 0) + 1;

    const ph = (v as { mr_pharmacies?: { name?: string } | null }).mr_pharmacies;
    const pharmacyName = ph?.name ?? "Unknown";
    byPharmacy[pharmacyName] = (byPharmacy[pharmacyName] ?? 0) + 1;
  }

  const chartData = {
    byMonth: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, visits: count })),
    byObjective: Object.entries(byObjective).map(([name, value]) => ({
      name,
      value,
    })),
    byPharmacy: Object.entries(byPharmacy)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value })),
  };

  const recentVisits = (visits ?? [])
    .slice(0, 20)
    .map((v: Record<string, unknown>) => ({
      id: String(v.id ?? ""),
      checkIn: v.check_in_time as string,
      pharmacy:
        ((v.mr_pharmacies as { name: string } | null) ?? {})?.name ?? "—",
      region: undefined,
      objective: undefined,
      canEdit:
        (v as { status?: string }).status === "OPEN",
    }));

  return (
    <MrReportsClient
      mode="mr"
      kpis={{ totalVisits, uniquePharmacies: Object.keys(byPharmacy).length }}
      chartData={chartData}
      recentVisits={recentVisits}
    />
  );
}
