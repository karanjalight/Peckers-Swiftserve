/**
 * Pure builders for MR field reports: substitution, OOS reasons, comparative pricing.
 */

export type SubstitutionReportData = {
  topRivals: { name: string; count: number }[];
  byReason: { reason: string; count: number; percentOfSubstitutions: number }[];
  /** Same definition as dashboard: competitor audit rows ÷ product audit rows × 100 */
  overallSubstitutionRatePercent: number;
  totalCompetitorRows: number;
  totalProductAudits: number;
};

export type OutOfStockReportRow = {
  productName: string;
  pharmacyName: string;
  region: string;
  reason: string;
  daysOos: number | null;
  checkIn: string;
};

export type ComparativePricingRow = {
  product: string;
  region: string;
  avgAuditPriceKes: number | null;
  avgCompetitorPriceKes: number | null;
  differenceKes: number | null;
};

export function buildSubstitutionReport(
  competitorRows: Array<{
    competitor_name?: string | null;
    substitution_reason?: string | null;
  }>,
  totalProductAuditCount: number
): SubstitutionReportData {
  const totalComp = competitorRows.length;
  const overallSubstitutionRatePercent =
    totalProductAuditCount > 0
      ? Math.round((totalComp / totalProductAuditCount) * 1000) / 10
      : 0;

  const byCompetitor: Record<string, number> = {};
  for (const r of competitorRows) {
    const n = (r.competitor_name ?? "").trim() || "Unknown";
    byCompetitor[n] = (byCompetitor[n] ?? 0) + 1;
  }
  const topRivals = Object.entries(byCompetitor)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const byReasonMap: Record<string, number> = {};
  for (const r of competitorRows) {
    const reason = (r.substitution_reason?.trim() || "Not specified") as string;
    byReasonMap[reason] = (byReasonMap[reason] ?? 0) + 1;
  }
  const byReason = Object.entries(byReasonMap)
    .map(([reason, count]) => ({
      reason,
      count,
      percentOfSubstitutions:
        totalComp > 0 ? Math.round((count / totalComp) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    topRivals,
    byReason,
    overallSubstitutionRatePercent,
    totalCompetitorRows: totalComp,
    totalProductAudits: totalProductAuditCount,
  };
}

function normVisitPharmacy(
  v: unknown
): { name?: string; region?: string; check_in_time?: string } | null {
  const visit = Array.isArray(v) ? v[0] : v;
  if (!visit || typeof visit !== "object") return null;
  const vo = visit as Record<string, unknown>;
  const phRaw = vo.mr_pharmacies;
  const ph = Array.isArray(phRaw) ? phRaw[0] : phRaw;
  const p = ph && typeof ph === "object" ? (ph as Record<string, unknown>) : null;
  return {
    name: typeof p?.name === "string" ? p.name : undefined,
    region: typeof p?.region === "string" ? p.region : undefined,
    check_in_time:
      typeof vo.check_in_time === "string" ? vo.check_in_time : undefined,
  };
}

export function buildOutOfStockReportRows(
  rows: Array<{
    reason_for_oos?: string | null;
    days_oos?: number | null;
    mr_products?: { name: string } | { name: string }[] | null;
    mr_visits?: unknown;
  }>
): OutOfStockReportRow[] {
  const out: OutOfStockReportRow[] = [];
  for (const r of rows) {
    const mp = r.mr_products;
    const productName =
      (Array.isArray(mp) ? mp[0] : mp)?.name?.trim() || "Unknown";
    const loc = normVisitPharmacy(r.mr_visits);
    out.push({
      productName,
      pharmacyName: loc?.name ?? "—",
      region: loc?.region ?? "—",
      reason: (r.reason_for_oos?.trim() || "Not specified") as string,
      daysOos: r.days_oos ?? null,
      checkIn: loc?.check_in_time ?? "",
    });
  }
  return out.sort(
    (a, b) =>
      a.pharmacyName.localeCompare(b.pharmacyName) ||
      a.productName.localeCompare(b.productName)
  );
}

export function buildComparativePricingRows(
  productAudits: Array<{
    price_per_pack?: number | null;
    mr_products?: { name: string } | { name: string }[] | null;
    mr_visits?: unknown;
  }>,
  competitorAudits: Array<{
    price_per_pack?: number | null;
    mr_product_audits?: unknown;
  }>
): ComparativePricingRow[] {
  const pricingByProductRegion: Record<
    string,
    Record<string, { auditPrices: number[]; competitorPrices: number[] }>
  > = {};

  for (const pa of productAudits) {
    const mp = pa.mr_products;
    const product =
      (Array.isArray(mp) ? mp[0] : mp)?.name?.trim() || "Unknown";
    const vRaw = pa.mr_visits;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    const ph = v && typeof v === "object" ? (v as Record<string, unknown>).mr_pharmacies : null;
    const phObj = Array.isArray(ph) ? ph[0] : ph;
    const region =
      phObj && typeof phObj === "object" && typeof (phObj as { region?: string }).region === "string"
        ? (phObj as { region: string }).region
        : "Unknown";
    if (!pricingByProductRegion[product]) pricingByProductRegion[product] = {};
    if (!pricingByProductRegion[product][region]) {
      pricingByProductRegion[product][region] = {
        auditPrices: [],
        competitorPrices: [],
      };
    }
    if (pa.price_per_pack != null) {
      pricingByProductRegion[product][region].auditPrices.push(pa.price_per_pack);
    }
  }

  for (const ca of competitorAudits) {
    const ppa = ca.mr_product_audits;
    const pa = Array.isArray(ppa) ? ppa[0] : ppa;
    if (!pa || typeof pa !== "object") continue;
    const po = pa as Record<string, unknown>;
    const mp = po.mr_products as { name?: string } | undefined;
    const product = mp?.name?.trim() || "Unknown";
    const vRaw = po.mr_visits;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    const ph = v && typeof v === "object" ? (v as Record<string, unknown>).mr_pharmacies : null;
    const phObj = Array.isArray(ph) ? ph[0] : ph;
    const region =
      phObj && typeof phObj === "object" && typeof (phObj as { region?: string }).region === "string"
        ? (phObj as { region: string }).region
        : "Unknown";
    if (
      ca.price_per_pack != null &&
      pricingByProductRegion[product]?.[region]
    ) {
      pricingByProductRegion[product][region].competitorPrices.push(
        ca.price_per_pack
      );
    }
  }

  return Object.entries(pricingByProductRegion)
    .flatMap(([product, regions]) =>
      Object.entries(regions).map(([region, data]) => {
        const avgAudit = data.auditPrices.length
          ? data.auditPrices.reduce((a, b) => a + b, 0) / data.auditPrices.length
          : null;
        const avgComp = data.competitorPrices.length
          ? data.competitorPrices.reduce((a, b) => a + b, 0) /
            data.competitorPrices.length
          : null;
        const rounded = (n: number) => Math.round(n * 100) / 100;
        return {
          product,
          region,
          avgAuditPriceKes: avgAudit != null ? rounded(avgAudit) : null,
          avgCompetitorPriceKes: avgComp != null ? rounded(avgComp) : null,
          differenceKes:
            avgAudit != null && avgComp != null
              ? rounded(avgAudit - avgComp)
              : null,
        };
      })
    )
    .filter(
      (row) =>
        row.avgAuditPriceKes != null || row.avgCompetitorPriceKes != null
    )
    .sort(
      (a, b) =>
        a.product.localeCompare(b.product) || a.region.localeCompare(b.region)
    );
}
