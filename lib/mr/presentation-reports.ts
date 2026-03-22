/**
 * MR presentation reports: regional audit coverage, audited pharmacy detail, out-of-stock lines.
 */

export const MR_REPORT_DAYS_OPEN_PER_MONTH = 26;

export type AuditVisitRow = {
  id: string;
  pharmacy_id: string;
  check_in_time: string;
  patients_per_day?: number | null;
  basket_value_per_patient?: number | null;
  mr_pharmacies?: {
    id?: string;
    name?: string;
    region?: string | null;
    sub_region?: string | null;
    location_text?: string | null;
    avg_attendants_per_day?: number | null;
    avg_order_value?: number | null;
  } | null;
};

export type ProductAuditRow = {
  visit_id: string;
  quantity_in_stock: number;
  days_oos?: number | null;
  mr_products?: { name: string } | { name: string }[] | null;
};

export type RegionalAuditSummaryRow = {
  region: string;
  pharmaciesAudited: number;
  equitablePercent: number;
};

export type AuditedPharmacyDetailRow = {
  pharmacyName: string;
  region: string;
  location: string;
  businessValueMonthlyKes: number | null;
  basketValuePerPatientKes: number | null;
  patientsPerDay: number | null;
  lastAuditAt: string;
};

export type OutOfStockDetailRow = {
  pharmacyName: string;
  region: string;
  location: string;
  productName: string;
  daysOos: number | null;
};

function estimatedMonthlyBusinessKes(
  avgAttendants: number | null | undefined,
  avgOrder: number | null | undefined
): number | null {
  if (
    avgAttendants == null ||
    avgOrder == null ||
    avgAttendants <= 0 ||
    avgOrder <= 0
  ) {
    return null;
  }
  return Math.round(
    avgAttendants * avgOrder * MR_REPORT_DAYS_OPEN_PER_MONTH
  );
}

/**
 * Regions audited, distinct pharmacies per region, and equitable % (share of all audited pharmacies).
 */
export function buildRegionalAuditSummary(
  visits: AuditVisitRow[]
): RegionalAuditSummaryRow[] {
  const byRegion: Record<string, Set<string>> = {};
  for (const v of visits) {
    const ph = v.mr_pharmacies;
    const region = ph?.region?.trim() || "Unknown";
    const pid = v.pharmacy_id;
    if (!byRegion[region]) byRegion[region] = new Set();
    byRegion[region].add(pid);
  }
  const totalDistinct = new Set(visits.map((v) => v.pharmacy_id)).size;
  return Object.entries(byRegion)
    .map(([region, set]) => ({
      region,
      pharmaciesAudited: set.size,
      equitablePercent:
        totalDistinct > 0
          ? Math.round((set.size / totalDistinct) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.pharmaciesAudited - a.pharmaciesAudited);
}

/**
 * One row per pharmacy — metrics from the latest submitted AUDIT visit.
 */
export function buildAuditedPharmaciesDetail(
  visits: AuditVisitRow[]
): AuditedPharmacyDetailRow[] {
  const latestByPharmacy = new Map<string, AuditVisitRow>();
  const sorted = [...visits].sort(
    (a, b) =>
      new Date(b.check_in_time).getTime() -
      new Date(a.check_in_time).getTime()
  );
  for (const v of sorted) {
    if (!latestByPharmacy.has(v.pharmacy_id)) {
      latestByPharmacy.set(v.pharmacy_id, v);
    }
  }
  const rows: AuditedPharmacyDetailRow[] = [];
  for (const v of latestByPharmacy.values()) {
    const ph = v.mr_pharmacies;
    const loc =
      [ph?.location_text?.trim(), ph?.sub_region?.trim()]
        .filter(Boolean)
        .join(" · ") || "—";
    rows.push({
      pharmacyName: ph?.name ?? "Unknown",
      region: ph?.region ?? "—",
      location: loc,
      businessValueMonthlyKes: estimatedMonthlyBusinessKes(
        ph?.avg_attendants_per_day,
        ph?.avg_order_value
      ),
      basketValuePerPatientKes:
        v.basket_value_per_patient != null
          ? Math.round(Number(v.basket_value_per_patient) * 100) / 100
          : null,
      patientsPerDay:
        v.patients_per_day != null ? v.patients_per_day : null,
      lastAuditAt: v.check_in_time,
    });
  }
  return rows.sort((a, b) => a.region.localeCompare(b.region) || a.pharmacyName.localeCompare(b.pharmacyName));
}

/**
 * One row per pharmacy–product where stock quantity is zero (out of stock).
 */
export function buildOutOfStockDetail(
  visits: AuditVisitRow[],
  productAudits: ProductAuditRow[]
): OutOfStockDetailRow[] {
  const visitById = new Map<string, AuditVisitRow>();
  for (const v of visits) visitById.set(v.id, v);

  const out: OutOfStockDetailRow[] = [];
  for (const pa of productAudits) {
    if (pa.quantity_in_stock !== 0) continue;
    const v = visitById.get(pa.visit_id);
    if (!v) continue;
    const ph = v.mr_pharmacies;
    const mp = pa.mr_products;
    const productName = (Array.isArray(mp) ? mp[0] : mp)?.name ?? "Unknown";
    const loc =
      [ph?.location_text?.trim(), ph?.sub_region?.trim()]
        .filter(Boolean)
        .join(" · ") || "—";
    out.push({
      pharmacyName: ph?.name ?? "Unknown",
      region: ph?.region ?? "—",
      location: loc,
      productName,
      daysOos: pa.days_oos ?? null,
    });
  }
  return out.sort((a, b) =>
    a.pharmacyName.localeCompare(b.pharmacyName) ||
    a.productName.localeCompare(b.productName)
  );
}
