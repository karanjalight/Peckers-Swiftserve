/**
 * Advanced MR presentation metrics: OOS ratio per product, pharmacy Rx share, top prescribers.
 */

import type { AuditVisitRow, ProductAuditRow } from "./presentation-reports";
import type { PrescriptionAuditRow } from "./fetch-prescription-audits-for-visits";

export type OosRatioPerProductRow = {
  productName: string;
  pharmaciesAudited: number;
  pharmaciesOutOfStock: number;
  /** Share of distinct audited pharmacies where the product was OOS at least once */
  ratioPercent: number;
};

export type PharmacyMarketShareRow = {
  pharmacyId: string;
  pharmacyName: string;
  /** Sum of rx_per_month across all prescription lines captured at this pharmacy */
  totalRxPerMonth: number;
  /** Rx attributed to catalogue / company products only */
  companyRxPerMonth: number;
  /** companyRx / totalRx * 100 */
  sharePercent: number;
};

export type PrescriberRankRow = {
  doctorName: string;
  doctorLocation: string;
  rxPerMonth: number;
};

export type TopPrescribersPerPharmacyRow = {
  pharmacyId: string;
  pharmacyName: string;
  prescribers: PrescriberRankRow[];
};

export type TopPrescribersPerProductRow = {
  productName: string;
  prescribers: PrescriberRankRow[];
};

const TOP_N = 5;

function productNameFromAudit(pa: ProductAuditRow): string {
  const mp = pa.mr_products;
  return (Array.isArray(mp) ? mp[0] : mp)?.name?.trim() || "Unknown";
}

function normalizeProductKey(name: string): string {
  return name.trim().toLowerCase();
}

function doctorFromRow(
  row: PrescriptionAuditRow
): { name: string; location: string } {
  const d = row.mr_doctors;
  const doc = Array.isArray(d) ? d[0] : d;
  return {
    name: (doc?.name ?? "Unknown").trim() || "Unknown",
    location: (doc?.location ?? "").trim(),
  };
}

/**
 * Per product: distinct pharmacies where the product was audited vs distinct where it was OOS (qty=0).
 */
export function buildOosRatioPerProduct(
  auditVisits: AuditVisitRow[],
  productAudits: ProductAuditRow[]
): OosRatioPerProductRow[] {
  const visitToPharmacyId = new Map<string, string>();
  for (const v of auditVisits) {
    visitToPharmacyId.set(v.id, v.pharmacy_id);
  }

  const byProduct: Record<
    string,
    { audited: Set<string>; oos: Set<string> }
  > = {};

  for (const pa of productAudits) {
    const pharmacyId = visitToPharmacyId.get(pa.visit_id);
    if (!pharmacyId) continue;
    const pname = productNameFromAudit(pa);
    if (!byProduct[pname]) {
      byProduct[pname] = { audited: new Set(), oos: new Set() };
    }
    byProduct[pname].audited.add(pharmacyId);
    if (pa.quantity_in_stock === 0) {
      byProduct[pname].oos.add(pharmacyId);
    }
  }

  return Object.entries(byProduct)
    .map(([productName, { audited, oos }]) => {
      const nAud = audited.size;
      const nOos = oos.size;
      const ratioPercent =
        nAud > 0 ? Math.round((nOos / nAud) * 1000) / 10 : 0;
      return {
        productName,
        pharmaciesAudited: nAud,
        pharmaciesOutOfStock: nOos,
        ratioPercent,
      };
    })
    .sort((a, b) => b.ratioPercent - a.ratioPercent || a.productName.localeCompare(b.productName));
}

function buildCompanyProductMatchers(companyProductNames: string[]) {
  return companyProductNames.map((name) => {
    const t = name.trim();
    const fullLower = normalizeProductKey(t);
    const firstWord = fullLower.split(/[^a-z0-9]+/).filter(Boolean)[0] ?? "";
    return { fullLower, firstWord };
  });
}

/** Match prescription free-text to catalogue (exact, or first-word / prefix for common variants). */
export function prescriptionMatchesCompanyProduct(
  rawProductName: string,
  matchers: ReturnType<typeof buildCompanyProductMatchers>
): boolean {
  const k = normalizeProductKey(rawProductName);
  if (!k) return false;
  for (const c of matchers) {
    if (k === c.fullLower) return true;
    if (
      c.firstWord.length >= 3 &&
      (k.startsWith(c.firstWord) || c.fullLower.startsWith(`${k} `))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Estimated “market share” at pharmacy level: share of captured Rx volume for company catalogue products vs all products in prescription capture.
 */
export function buildPharmacyMarketShareEstimate(
  auditVisits: AuditVisitRow[],
  prescriptionRows: PrescriptionAuditRow[],
  companyProductNames: string[]
): PharmacyMarketShareRow[] {
  const matchers = buildCompanyProductMatchers(companyProductNames);

  const visitToPharmacy = new Map<
    string,
    { id: string; name: string }
  >();
  for (const v of auditVisits) {
    const ph = v.mr_pharmacies;
    visitToPharmacy.set(v.id, {
      id: v.pharmacy_id,
      name: ph?.name ?? "Unknown",
    });
  }

  const byPharmacy: Record<
    string,
    { name: string; total: number; company: number }
  > = {};

  for (const row of prescriptionRows) {
    const loc = visitToPharmacy.get(row.visit_id);
    if (!loc) continue;
    const rx = row.rx_per_month ?? 0;
    if (rx <= 0) continue;
    const key = loc.id;
    if (!byPharmacy[key]) {
      byPharmacy[key] = { name: loc.name, total: 0, company: 0 };
    }
    byPharmacy[key].total += rx;
    const pn = (row.product_name ?? "").trim();
    if (pn && prescriptionMatchesCompanyProduct(pn, matchers)) {
      byPharmacy[key].company += rx;
    }
  }

  return Object.entries(byPharmacy)
    .map(([pharmacyId, { name, total, company }]) => ({
      pharmacyId,
      pharmacyName: name,
      totalRxPerMonth: Math.round(total * 10) / 10,
      companyRxPerMonth: Math.round(company * 10) / 10,
      sharePercent:
        total > 0 ? Math.round((company / total) * 1000) / 10 : 0,
    }))
    .filter((r) => r.totalRxPerMonth > 0)
    .sort((a, b) => b.sharePercent - a.sharePercent || b.totalRxPerMonth - a.totalRxPerMonth);
}

function aggregateTopPrescribers(
  rows: Array<{ doctorName: string; doctorLocation: string; rx: number }>
): PrescriberRankRow[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.doctorName}\u0000${r.doctorLocation}`;
    map.set(key, (map.get(key) ?? 0) + r.rx);
  }
  return Array.from(map.entries())
    .map(([key, rxPerMonth]) => {
      const [doctorName, doctorLocation] = key.split("\u0000");
      return { doctorName, doctorLocation, rxPerMonth };
    })
    .sort((a, b) => b.rxPerMonth - a.rxPerMonth)
    .slice(0, TOP_N)
    .map((r) => ({
      doctorName: r.doctorName,
      doctorLocation: r.doctorLocation,
      rxPerMonth: Math.round(r.rxPerMonth * 10) / 10,
    }));
}

/**
 * Top prescribers (by summed Rx) per pharmacy (chemist).
 */
export function buildTopPrescribersPerPharmacy(
  auditVisits: AuditVisitRow[],
  prescriptionRows: PrescriptionAuditRow[]
): TopPrescribersPerPharmacyRow[] {
  const visitToPharmacy = new Map<
    string,
    { id: string; name: string }
  >();
  for (const v of auditVisits) {
    const ph = v.mr_pharmacies;
    visitToPharmacy.set(v.id, {
      id: v.pharmacy_id,
      name: ph?.name ?? "Unknown",
    });
  }

  const byPharmacy: Record<
    string,
    { pharmacyName: string; rows: Array<{ doctorName: string; doctorLocation: string; rx: number }> }
  > = {};

  for (const row of prescriptionRows) {
    const loc = visitToPharmacy.get(row.visit_id);
    if (!loc) continue;
    const rx = row.rx_per_month ?? 0;
    if (rx <= 0) continue;
    const doc = doctorFromRow(row);
    if (!byPharmacy[loc.id]) {
      byPharmacy[loc.id] = { pharmacyName: loc.name, rows: [] };
    }
    byPharmacy[loc.id].rows.push({
      doctorName: doc.name,
      doctorLocation: doc.location,
      rx,
    });
  }

  return Object.entries(byPharmacy)
    .map(([pharmacyId, { pharmacyName, rows }]) => ({
      pharmacyId,
      pharmacyName,
      prescribers: aggregateTopPrescribers(rows),
    }))
    .filter((p) => p.prescribers.length > 0)
    .sort((a, b) => a.pharmacyName.localeCompare(b.pharmacyName));
}

/**
 * Top prescribers per product (by summed Rx in prescription capture).
 */
export function buildTopPrescribersPerProduct(
  prescriptionRows: PrescriptionAuditRow[]
): TopPrescribersPerProductRow[] {
  const byProduct: Record<
    string,
    Array<{ doctorName: string; doctorLocation: string; rx: number }>
  > = {};

  for (const row of prescriptionRows) {
    const pname = (row.product_name ?? "").trim() || "Product (unspecified)";
    const rx = row.rx_per_month ?? 0;
    if (rx <= 0) continue;
    const doc = doctorFromRow(row);
    if (!byProduct[pname]) byProduct[pname] = [];
    byProduct[pname].push({
      doctorName: doc.name,
      doctorLocation: doc.location,
      rx,
    });
  }

  return Object.entries(byProduct)
    .map(([productName, rows]) => ({
      productName,
      prescribers: aggregateTopPrescribers(rows),
    }))
    .filter((p) => p.prescribers.length > 0)
    .sort((a, b) => a.productName.localeCompare(b.productName));
}
