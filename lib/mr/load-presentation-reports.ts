import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { fetchPrescriptionAuditsForVisitIds } from "@/lib/mr/fetch-prescription-audits-for-visits";
import { fetchProductAuditsForVisitIds } from "@/lib/mr/fetch-product-audits-for-visits";
import {
  buildAuditedPharmaciesDetail,
  buildOutOfStockDetail,
  buildRegionalAuditSummary,
  type AuditVisitRow,
} from "@/lib/mr/presentation-reports";
import {
  buildOosRatioPerProduct,
  buildPharmacyMarketShareEstimate,
  buildTopPrescribersPerProduct,
} from "@/lib/mr/presentation-reports-advanced";
import type { PresentationReportsProps } from "@/lib/mr/presentation-reports-props";

export async function loadPresentationReports(
  supabase: SupabaseClient
): Promise<PresentationReportsProps> {
  const auditVisitsRes = await fetchAllByRange((from, to) =>
    supabase
      .from("mr_visits")
      .select(
        "id, pharmacy_id, check_in_time, patients_per_day, basket_value_per_patient, mr_pharmacies(id, name, region, sub_region, location_text, avg_attendants_per_day, avg_order_value)"
      )
      .eq("status", "SUBMITTED")
      .eq("objective", "AUDIT")
      .order("check_in_time", { ascending: false })
      .range(from, to)
  );

  if (auditVisitsRes.error) {
    console.error("loadPresentationReports audit visits:", auditVisitsRes.error);
  }

  const auditVisits = (auditVisitsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const ph = r.mr_pharmacies;
    const pharmacy = Array.isArray(ph) ? ph[0] : ph;
    return {
      ...r,
      mr_pharmacies: pharmacy,
    } as AuditVisitRow;
  });

  const auditVisitIds = auditVisits.map((v) => v.id).filter(Boolean);
  const [reportProductAudits, prescriptionAuditsForReports] = await Promise.all([
    fetchProductAuditsForVisitIds(supabase, auditVisitIds),
    fetchPrescriptionAuditsForVisitIds(supabase, auditVisitIds),
  ]);

  const mrProductsRes = await supabase.from("mr_products").select("name, is_company_product");
  const catalogRows = (mrProductsRes.data ?? []) as Array<{
    name: string;
    is_company_product?: boolean | null;
  }>;
  const companyProductNames = catalogRows
    .filter((p) => p.is_company_product === true)
    .map((p) => p.name)
    .filter(Boolean);

  return {
    regionalAuditSummary: buildRegionalAuditSummary(auditVisits),
    auditedPharmaciesDetail: buildAuditedPharmaciesDetail(auditVisits),
    outOfStockDetail: buildOutOfStockDetail(auditVisits, reportProductAudits),
    oosRatioPerProduct: buildOosRatioPerProduct(auditVisits, reportProductAudits),
    pharmacyMarketShareEstimate: buildPharmacyMarketShareEstimate(
      auditVisits,
      prescriptionAuditsForReports,
      companyProductNames
    ),
    topPrescribersPerProduct: buildTopPrescribersPerProduct(prescriptionAuditsForReports),
  };
}
