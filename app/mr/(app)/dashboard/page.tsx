import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/mr/supabase-server";
import { MrDashboardClient } from "./MrDashboardClient";

export default async function MrDashboardPage() {
  const auth = await requireManagerOrAdmin();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const [visitsRes, productAuditsRes, competitorAuditsRes, pharmaciesRes] =
    await Promise.all([
      supabase
        .from("mr_visits")
        .select(
          "id, pharmacy_id, check_in_time, visit_duration_minutes, objective, mr_pharmacies(region, sub_region, name)"
        )
        .eq("status", "SUBMITTED"),
      supabase
        .from("mr_product_audits")
        .select(
          "id, quantity_in_stock, visit_id, product_id, mr_products(name)"
        ),
      supabase.from("mr_competitor_audits").select("id"),
      supabase.from("mr_pharmacies").select("id"),
    ]);

  const visits = visitsRes.data ?? [];
  const productAudits = productAuditsRes.data ?? [];
  const competitorCount = competitorAuditsRes.data?.length ?? 0;
  const totalPharmacies = pharmaciesRes.data?.length ?? 0;

  const totalVisits = visits.length;
  const stockOuts = productAudits.filter(
    (pa: { quantity_in_stock: number }) => pa.quantity_in_stock === 0
  ).length;
  const totalProductAudits = productAudits.length;
  const substitutionRate =
    totalProductAudits > 0 ? (competitorCount / totalProductAudits) * 100 : 0;

  const durations = visits
    .map((v: { visit_duration_minutes?: number | null }) =>
      v.visit_duration_minutes != null ? v.visit_duration_minutes : 0
    )
    .filter((d: number) => d > 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0;

  const uniquePharmacyIds = new Set(
    visits.map((v: { pharmacy_id?: string }) =>
      (v as { pharmacy_id: string }).pharmacy_id
    )
  );
  const uniquePharmacies = uniquePharmacyIds.size;

  const regionCounts: Record<string, number> = {};
  const subRegionCounts: Record<string, number> = {};
  const objectiveCounts: Record<string, number> = {};
  const pharmacyCounts: Record<string, number> = {};
  const visitsByMonth: Record<string, number> = {};
  const visitsByWeek: Record<string, number> = {};

  for (const v of visits) {
    const ph = (v as unknown as { mr_pharmacies?: { region?: string; sub_region?: string; name?: string } | null })
      .mr_pharmacies;
    const region = ph?.region ?? "Unknown";
    const subRegion = ph?.sub_region ? `${region} - ${ph.sub_region}` : region;
    const pharmacyName = ph?.name ?? "Unknown";
    const objective = (v as { objective?: string }).objective ?? "AUDIT";

    regionCounts[region] = (regionCounts[region] ?? 0) + 1;
    subRegionCounts[subRegion] = (subRegionCounts[subRegion] ?? 0) + 1;
    pharmacyCounts[pharmacyName] = (pharmacyCounts[pharmacyName] ?? 0) + 1;
    objectiveCounts[objective] = (objectiveCounts[objective] ?? 0) + 1;

    const d = new Date((v as { check_in_time: string }).check_in_time);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    visitsByMonth[monthKey] = (visitsByMonth[monthKey] ?? 0) + 1;

    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    visitsByWeek[weekKey] = (visitsByWeek[weekKey] ?? 0) + 1;
  }

  const productCounts: Record<string, number> = {};
  for (const pa of productAudits) {
    const mp = (pa as { mr_products?: { name: string } | { name: string }[] | null }).mr_products;
    const name = (Array.isArray(mp) ? mp[0] : mp)?.name ?? "Unknown";
    productCounts[name] = (productCounts[name] ?? 0) + 1;
  }

  const kpis = {
    totalVisits,
    stockOuts,
    substitutionRate: Math.round(substitutionRate * 10) / 10,
    avgDuration,
    uniquePharmacies,
    totalPharmacies,
    totalProductAudits,
    competitorCount,
  };

  const chartData = {
    byRegion: Object.entries(regionCounts).map(([name, value]) => ({
      name,
      value,
    })),
    bySubRegion: Object.entries(subRegionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value })),
    byProduct: Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value })),
    byMonth: Object.entries(visitsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, visits: value })),
    byWeek: Object.entries(visitsByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([date, count]) => ({
        name: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        visits: count,
      })),
    byObjective: Object.entries(objectiveCounts).map(([name, value]) => ({
      name,
      value,
    })),
    byPharmacy: Object.entries(pharmacyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value })),
  };

  const visitsTable = visits.slice(0, 100).map((v: Record<string, unknown>) => {
    const ph = v.mr_pharmacies as { region?: string } | null | undefined;
    return {
      id: String(v.id ?? ""),
      checkIn: v.check_in_time as string,
      region: ph?.region ?? undefined,
    };
  });

  return (
    <MrDashboardClient
      kpis={kpis}
      chartData={chartData}
      visitsTable={visitsTable}
    />
  );
}
