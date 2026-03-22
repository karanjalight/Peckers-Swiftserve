import type { SupabaseClient } from "@supabase/supabase-js";
import { MR_SUPABASE_IN_CHUNK } from "./supabase-limits";

/**
 * Fetches product audits for a set of visit IDs in batches (PostgREST `.in` limits).
 */
export async function fetchProductAuditsForVisitIds(
  supabase: SupabaseClient,
  visitIds: string[]
): Promise<
  Array<{
    visit_id: string;
    quantity_in_stock: number;
    days_oos?: number | null;
    mr_products?: { name: string } | { name: string }[] | null;
  }>
> {
  if (visitIds.length === 0) return [];
  const out: Array<{
    visit_id: string;
    quantity_in_stock: number;
    days_oos?: number | null;
    mr_products?: { name: string } | { name: string }[] | null;
  }> = [];
  for (let i = 0; i < visitIds.length; i += MR_SUPABASE_IN_CHUNK) {
    const chunk = visitIds.slice(i, i + MR_SUPABASE_IN_CHUNK);
    const { data, error } = await supabase
      .from("mr_product_audits")
      .select("visit_id, quantity_in_stock, days_oos, mr_products(name)")
      .in("visit_id", chunk);
    if (error) {
      console.error("mr_product_audits batch error:", error);
      continue;
    }
    out.push(...(data ?? []));
  }
  return out;
}
