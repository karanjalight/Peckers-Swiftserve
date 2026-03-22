import type { SupabaseClient } from "@supabase/supabase-js";
import { MR_SUPABASE_IN_CHUNK } from "./supabase-limits";

export type PrescriptionAuditRow = {
  visit_id: string;
  product_name: string | null;
  rx_per_month: number | null;
  mr_doctors?: { name?: string; location?: string | null } | { name?: string; location?: string | null }[] | null;
};

/**
 * Prescription capture lines for a set of visit IDs (batched for PostgREST limits).
 */
export async function fetchPrescriptionAuditsForVisitIds(
  supabase: SupabaseClient,
  visitIds: string[]
): Promise<PrescriptionAuditRow[]> {
  if (visitIds.length === 0) return [];
  const out: PrescriptionAuditRow[] = [];
  for (let i = 0; i < visitIds.length; i += MR_SUPABASE_IN_CHUNK) {
    const chunk = visitIds.slice(i, i + MR_SUPABASE_IN_CHUNK);
    const { data, error } = await supabase
      .from("mr_prescription_audits")
      .select("visit_id, product_name, rx_per_month, mr_doctors(name, location)")
      .in("visit_id", chunk);
    if (error) {
      console.error("mr_prescription_audits batch error:", error);
      continue;
    }
    out.push(...((data ?? []) as PrescriptionAuditRow[]));
  }
  return out;
}
