import { redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/mr/supabase-server";
import { MrProductsClient } from "./MrProductsClient";

export type MrProductRow = {
  id: string;
  name: string;
  sku: string | null;
  is_company_product: boolean;
  price: number | null;
  owned_by: string | null;
  created_at: string;
};

export default async function MrProductsPage() {
  const auth = await requireManagerOrAdmin();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const { data: products } = await supabase
    .from("mr_products")
    .select("id, name, sku, is_company_product, price, owned_by, created_at")
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Products
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage products that MRs use during pharmacy visits for audits and prescriptions.
        </p>
      </div>
      <MrProductsClient products={(products ?? []) as MrProductRow[]} />
    </div>
  );
}
