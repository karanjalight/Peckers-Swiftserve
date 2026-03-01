import { getMrAuth } from "@/lib/mr/supabase-server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  BarChart3,
  Package,
  Stethoscope,
  Megaphone,
  ExternalLink,
} from "lucide-react";

export async function MrVisitReadOnly({
  visitId,
  notes: visitNotes,
  objective,
  patientsPerDay,
  basketValuePerPatient,
  checkInTime,
  checkOutTime,
  visitDurationMinutes,
  gpsLat,
  gpsLng,
  pharmacyName,
  pharmacyRegion,
}: {
  visitId: string;
  notes?: string | null;
  objective?: string | null;
  patientsPerDay?: number | null;
  basketValuePerPatient?: number | null;
  checkInTime?: string;
  checkOutTime?: string | null;
  visitDurationMinutes?: number | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  pharmacyName?: string;
  pharmacyRegion?: string | null;
}) {
  const auth = await getMrAuth();
  if (auth.error) return null;

  const { supabase } = auth;

  const [
    productAuditsRes,
    prescriptionAuditsRes,
    competitorMarketingRes,
  ] = await Promise.all([
    supabase
      .from("mr_product_audits")
      .select(`
        id,
        quantity_in_stock,
        usp_understood,
        reason_why_stock,
        supplier,
        price_per_pack,
        days_oos,
        reason_for_oos,
        do_substitute,
        substitute_with_and_why,
        mr_products (name),
        mr_competitor_audits (competitor_name, supplier, competitor_stock, stock_sold_per_month, substitution_reason, price_per_pack, days_out, reason_out_of_stock)
      `)
      .eq("visit_id", visitId),
    supabase
      .from("mr_prescription_audits")
      .select("product_name, rx_per_month, prescription_image_url, mr_doctors(name, location)")
      .eq("visit_id", visitId),
    supabase
      .from("mr_competitor_marketing")
      .select("competitor_name, activity_description, reason_it_works")
      .eq("visit_id", visitId),
  ]);

  const productAudits = productAuditsRes.data ?? [];
  const prescriptionAudits = prescriptionAuditsRes.data ?? [];
  const competitorMarketing = competitorMarketingRes.data ?? [];
  const isAudit = objective === "AUDIT";
  const hasAuditMetrics = isAudit && (patientsPerDay != null || basketValuePerPatient != null);

  return (
    <div className="grid gap-4 sm:gap-6">
      {visitNotes && (
        <Card>
          <CardHeader className="space-y-1.5 pb-1 px-4 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 shrink-0 text-slate-500 sm:h-5 sm:w-5" />
              Visit notes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              General notes from the rep: products discussed, stock, competitors, or other observations from the visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm sm:text-base dark:text-slate-300">
              {visitNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {hasAuditMetrics && (
        <Card>
          <CardHeader className="space-y-1.5 pb-1 px-4 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 shrink-0 text-slate-500 sm:h-5 sm:w-5" />
              Audit metrics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Pharmacy volume and value: how many patients they serve per day and average basket value (KES) per patient.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2 sm:gap-5">
              {patientsPerDay != null && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Patients per day</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{patientsPerDay}</dd>
                </div>
              )}
              {basketValuePerPatient != null && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Basket value per patient (KES)</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{basketValuePerPatient}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {productAudits.length > 0 && (
        <Card>
          <CardHeader className="space-y-1.5 pb-1 px-4 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 shrink-0 text-slate-500 sm:h-5 sm:w-5" />
              Product audits
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:text-sm">
                {productAudits.length} product{productAudits.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Products recorded at this pharmacy: stock levels, supplier, price (KES), and whether staff understand the product USP. Competitor products are listed where captured.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {productAudits.map((pa: {
                id: string;
                quantity_in_stock: number;
                usp_understood: boolean;
                supplier?: string | null;
                price_per_pack?: number | null;
                mr_products: { name: string } | { name: string }[] | null;
                mr_competitor_audits: Array<{
                  competitor_name: string;
                  competitor_stock: number | null;
                  supplier?: string | null;
                  price_per_pack?: number | null;
                }>;
              }) => {
                const productName = (() => {
                  const mp = pa.mr_products;
                  const p = Array.isArray(mp) ? mp[0] : mp;
                  return p?.name ?? "—";
                })();
                const competitors = Array.isArray(pa.mr_competitor_audits) ? pa.mr_competitor_audits : [];
                return (
                  <div
                    key={pa.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{productName}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Stock</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-300">{pa.quantity_in_stock}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Price</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-300">
                          {pa.price_per_pack != null ? `KES ${pa.price_per_pack}` : "—"}
                        </dd>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <dt className="text-slate-500 dark:text-slate-400">Supplier</dt>
                        <dd className="truncate font-medium text-slate-700 dark:text-slate-300">{pa.supplier ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">USP</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-300">{pa.usp_understood ? "Yes" : "No"}</dd>
                      </div>
                    </dl>
                    {competitors.length > 0 && (
                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-600">
                        <dt className="text-slate-500 dark:text-slate-400 text-xs">Competitors</dt>
                        <ul className="mt-0.5 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {competitors.map((c: {
                            competitor_name: string;
                            supplier?: string | null;
                            competitor_stock: number | null;
                            price_per_pack?: number | null;
                          }, i: number) => (
                            <li key={i}>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{c.competitor_name}</span>
                              {c.supplier && ` · ${c.supplier}`}
                              {c.competitor_stock != null && ` · Stock: ${c.competitor_stock}`}
                              {c.price_per_pack != null && ` · KES ${c.price_per_pack}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto -mx-1">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Product</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Stock</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Price</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Supplier</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">USP</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Competitors</th>
                  </tr>
                </thead>
                <tbody>
                  {productAudits.map((pa: {
                    id: string;
                    quantity_in_stock: number;
                    usp_understood: boolean;
                    supplier?: string | null;
                    price_per_pack?: number | null;
                    mr_products: { name: string } | { name: string }[] | null;
                    mr_competitor_audits: Array<{
                      competitor_name: string;
                      competitor_stock: number | null;
                      supplier?: string | null;
                      price_per_pack?: number | null;
                    }>;
                  }) => {
                    const productName = (() => {
                      const mp = pa.mr_products;
                      const p = Array.isArray(mp) ? mp[0] : mp;
                      return p?.name ?? "—";
                    })();
                    const competitors = Array.isArray(pa.mr_competitor_audits) ? pa.mr_competitor_audits : [];
                    return (
                      <tr key={pa.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">{productName}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{pa.quantity_in_stock}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                          {pa.price_per_pack != null ? `KES ${pa.price_per_pack}` : "—"}
                        </td>
                        <td className="max-w-[120px] px-3 py-2.5 text-slate-600 dark:text-slate-400 truncate">{pa.supplier ?? "—"}</td>
                        <td className="px-3 py-2.5 dark:text-slate-300">{pa.usp_understood ? "Yes" : "No"}</td>
                        <td className="max-w-[200px] px-3 py-2.5">
                          {competitors.length ? (
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                              {competitors.map((c: {
                                competitor_name: string;
                                supplier?: string | null;
                                competitor_stock: number | null;
                                price_per_pack?: number | null;
                              }, i: number) => (
                                <li key={i}>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{c.competitor_name}</span>
                                  {c.supplier && ` · ${c.supplier}`}
                                  {c.competitor_stock != null && ` · Stock: ${c.competitor_stock}`}
                                  {c.price_per_pack != null && ` · KES ${c.price_per_pack}`}
                                </li>
                              ))}
                            </ul>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {prescriptionAudits.length > 0 && (
        <Card>
          <CardHeader className="space-y-1.5 pb-1 px-4 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <Stethoscope className="h-4 w-4 shrink-0 text-slate-500 sm:h-5 sm:w-5" />
              Prescription audits
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:text-sm">
                {prescriptionAudits.length} entr{prescriptionAudits.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Top doctors at this pharmacy: who they are, where they practice, which products they prescribe, and prescriptions per month. Attached images are evidence when provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {prescriptionAudits.map((pa: {
                product_name: string;
                rx_per_month: number | null;
                prescription_image_url?: string | null;
                mr_doctors: { name: string; location: string | null } | { name: string; location: string | null }[] | null;
              }, i: number) => {
                const doc = Array.isArray(pa.mr_doctors) ? pa.mr_doctors[0] : pa.mr_doctors;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
                  >
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{doc?.name ?? "—"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{doc?.location ?? "—"}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Product</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-300 truncate">{pa.product_name}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Rx/month</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-300">{pa.rx_per_month ?? "—"}</dd>
                      </div>
                    </dl>
                    {pa.prescription_image_url && (
                      <a
                        href={pa.prescription_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 touch-manipulation"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        View image
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto -mx-1">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Doctor</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Location</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Product</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Rx/month</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionAudits.map((pa: {
                    product_name: string;
                    rx_per_month: number | null;
                    prescription_image_url?: string | null;
                    mr_doctors: { name: string; location: string | null } | { name: string; location: string | null }[] | null;
                  }, i: number) => {
                    const doc = Array.isArray(pa.mr_doctors) ? pa.mr_doctors[0] : pa.mr_doctors;
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">{doc?.name ?? "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{doc?.location ?? "—"}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">{pa.product_name}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{pa.rx_per_month ?? "—"}</td>
                        <td className="px-3 py-2.5">
                          {pa.prescription_image_url ? (
                            <a
                              href={pa.prescription_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {competitorMarketing.length > 0 && (
        <Card>
          <CardHeader className="space-y-1.5 pb-1 px-4 sm:px-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <Megaphone className="h-4 w-4 shrink-0 text-slate-500 sm:h-5 sm:w-5" />
              Competitor marketing
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:text-sm">
                {competitorMarketing.length} entr{competitorMarketing.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              What competitors are doing at this pharmacy: their activities (e.g. breakfast meetings, sampling) and why pharmacy staff say they dispense their products.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ul className="space-y-3 sm:space-y-4">
              {competitorMarketing.map((cm: {
                competitor_name: string;
                activity_description: string | null;
                reason_it_works: string | null;
                activity_2_description?: string | null;
                activity_2_reason?: string | null;
              }, i: number) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-600 sm:p-4"
                >
                  <p className="font-semibold text-slate-900 text-sm sm:text-base dark:text-slate-100">{cm.competitor_name}</p>
                  <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-sm">
                    {(cm.activity_description || cm.reason_it_works) && (
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Activity 1:</span>{" "}
                        {cm.activity_description}
                        {cm.reason_it_works && (
                          <span className="block mt-0.5 text-slate-500 dark:text-slate-400">Reason: {cm.reason_it_works}</span>
                        )}
                      </div>
                    )}
                    {(cm.activity_2_description || cm.activity_2_reason) && (
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Activity 2:</span>{" "}
                        {cm.activity_2_description}
                        {cm.activity_2_reason && (
                          <span className="block mt-0.5 text-slate-500 dark:text-slate-400">Reason: {cm.activity_2_reason}</span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {productAudits.length === 0 && prescriptionAudits.length === 0 && competitorMarketing.length === 0 && !hasAuditMetrics && !visitNotes && (
        <Card>
          <CardContent className="py-8 text-center px-4 sm:py-12 sm:px-6">
            <p className="text-slate-500 text-sm sm:text-base dark:text-slate-400">No audit data or notes for this visit yet.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 sm:text-sm">Notes, product audits, prescription audits, and competitor marketing will appear here once added.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
