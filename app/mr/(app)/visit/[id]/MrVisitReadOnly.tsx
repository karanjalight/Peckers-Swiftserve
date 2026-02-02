import { getMrAuth } from "@/lib/mr/supabase-server";

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
    <div className="space-y-6">
      {/* Visit summary – all key visit data entered by MR */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-medium text-slate-900">Visit summary</h3>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {pharmacyName != null && (
            <>
              <dt className="text-slate-500">Pharmacy</dt>
              <dd className="font-medium text-slate-900 sm:col-span-2">{pharmacyName}</dd>
            </>
          )}
          {pharmacyRegion != null && pharmacyRegion !== "" && (
            <>
              <dt className="text-slate-500">Region</dt>
              <dd className="font-medium text-slate-900">{pharmacyRegion}</dd>
            </>
          )}
          {objective != null && (
            <>
              <dt className="text-slate-500">Objective</dt>
              <dd className="font-medium text-slate-900">{objective}</dd>
            </>
          )}
          {checkInTime != null && (
            <>
              <dt className="text-slate-500">Check-in</dt>
              <dd className="font-medium text-slate-900">{new Date(checkInTime).toLocaleString()}</dd>
            </>
          )}
          {checkOutTime != null && (
            <>
              <dt className="text-slate-500">Check-out</dt>
              <dd className="font-medium text-slate-900">{new Date(checkOutTime).toLocaleString()}</dd>
            </>
          )}
          {visitDurationMinutes != null && (
            <>
              <dt className="text-slate-500">Duration</dt>
              <dd className="font-medium text-slate-900">{Math.round(visitDurationMinutes)} min</dd>
            </>
          )}
          {(gpsLat != null && gpsLng != null) && (
            <>
              <dt className="text-slate-500">GPS location</dt>
              <dd className="font-medium text-slate-900 font-mono text-xs">
                {gpsLat.toFixed(5)}, {gpsLng.toFixed(5)}
              </dd>
            </>
          )}
        </dl>
      </div>

      {visitNotes && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 font-medium">Visit notes</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{visitNotes}</p>
        </div>
      )}
      {hasAuditMetrics && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 font-medium">Audit Metrics</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {patientsPerDay != null && (
              <>
                <dt className="text-slate-500">Patients per day</dt>
                <dd className="font-medium">{patientsPerDay}</dd>
              </>
            )}
            {basketValuePerPatient != null && (
              <>
                <dt className="text-slate-500">Basket value per patient (KES)</dt>
                <dd className="font-medium">{basketValuePerPatient}</dd>
              </>
            )}
          </dl>
        </div>
      )}
      {productAudits.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-medium">Product audits</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-left font-medium text-slate-600">Product</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Stock</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Price (KES)</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Reason stock</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Supplier</th>
                  <th className="pb-2 text-left font-medium text-slate-600">USP understood</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Substitute?</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Substitute with / why</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Reason OOS</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Days OOS</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Competitors</th>
                </tr>
              </thead>
              <tbody>
                {productAudits.map((pa: {
                  id: string;
                  quantity_in_stock: number;
                  usp_understood: boolean;
                  reason_why_stock?: string | null;
                  supplier?: string | null;
                  do_substitute?: boolean;
                  substitute_with_and_why?: string | null;
                  reason_for_oos?: string | null;
                  days_oos?: number | null;
                  price_per_pack?: number | null;
                  mr_products: { name: string } | { name: string }[] | null;
                  mr_competitor_audits: Array<{
                    competitor_name: string;
                    competitor_stock: number | null;
                    stock_sold_per_month?: number | null;
                    substitution_reason: string | null;
                    price_per_pack?: number | null;
                    days_out?: number | null;
                    reason_out_of_stock?: string | null;
                  }>;
                }) => {
                  const productName = (() => {
                    const mp = pa.mr_products;
                    const p = Array.isArray(mp) ? mp[0] : mp;
                    return p?.name ?? "—";
                  })();
                  const competitors = Array.isArray(pa.mr_competitor_audits) ? pa.mr_competitor_audits : [];
                  return (
                  <tr key={pa.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium">{productName}</td>
                    <td className="py-2">{pa.quantity_in_stock}</td>
                    <td className="py-2">{pa.price_per_pack != null ? pa.price_per_pack : "—"}</td>
                    <td className="max-w-[100px] py-2 text-slate-600">{pa.reason_why_stock ?? "—"}</td>
                    <td className="max-w-[100px] py-2 text-slate-600">{pa.supplier ?? "—"}</td>
                    <td className="py-2">{pa.usp_understood ? "Yes" : "No"}</td>
                    <td className="py-2">{pa.do_substitute ? "Yes" : "No"}</td>
                    <td className="max-w-[160px] py-2 text-slate-600">
                      {pa.do_substitute ? (pa.substitute_with_and_why || "—") : "—"}
                    </td>
                    <td className="max-w-[120px] py-2 text-slate-600">{pa.reason_for_oos ?? "—"}</td>
                    <td className="py-2">{pa.days_oos != null ? pa.days_oos : "—"}</td>
                    <td className="py-2">
                      {competitors.length ? (
                        <ul className="space-y-1 text-slate-600">
                          {competitors.map((c: {
                            competitor_name: string;
                            supplier?: string | null;
                            competitor_stock: number | null;
                            stock_sold_per_month?: number | null;
                            substitution_reason: string | null;
                            price_per_pack?: number | null;
                            days_out?: number | null;
                            reason_out_of_stock?: string | null;
                          }, i: number) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium text-slate-700">{c.competitor_name}</span>
                              {c.supplier && ` — Supplier: ${c.supplier}`}
                              {c.competitor_stock != null && ` — Stock: ${c.competitor_stock}`}
                              {c.stock_sold_per_month != null && ` — Sold/mo: ${c.stock_sold_per_month}`}
                              {c.price_per_pack != null && ` — KES ${c.price_per_pack}`}
                              {c.days_out != null && ` — Days OOS: ${c.days_out}`}
                              {c.reason_out_of_stock && ` — OOS: ${c.reason_out_of_stock}`}
                              {c.substitution_reason && ` — Sub: ${c.substitution_reason}`}
                            </li>
                          ))}
                        </ul>
                      ) : "—"}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prescriptionAudits.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-medium">Prescription audits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-left font-medium text-slate-600">Doctor</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Location</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Product</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Rx/month</th>
                  <th className="pb-2 text-left font-medium text-slate-600">Prescription image</th>
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
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">
                      {doc?.name ?? "—"}
                    </td>
                    <td className="py-2">
                      {doc?.location ?? "—"}
                    </td>
                    <td className="py-2 font-medium">{pa.product_name}</td>
                    <td className="py-2">{pa.rx_per_month ?? "—"}</td>
                    <td className="py-2">
                      {pa.prescription_image_url ? (
                        <a
                          href={pa.prescription_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View image
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {competitorMarketing.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-medium">Competitor marketing</h3>
          <ul className="space-y-4 text-sm">
            {competitorMarketing.map((cm: {
              competitor_name: string;
              activity_description: string | null;
              reason_it_works: string | null;
              activity_2_description?: string | null;
              activity_2_reason?: string | null;
            }, i: number) => (
              <li key={i} className="rounded border border-slate-100 bg-slate-50/50 p-3">
                <strong className="text-slate-900">{cm.competitor_name}</strong>
                <div className="mt-2 space-y-2 text-slate-600">
                  {(cm.activity_description || cm.reason_it_works) && (
                    <div>
                      <span className="font-medium text-slate-700">Activity 1:</span>
                      {cm.activity_description && <span> {cm.activity_description}</span>}
                      {cm.reason_it_works && (
                        <span> — Reason: {cm.reason_it_works}</span>
                      )}
                    </div>
                  )}
                  {(cm.activity_2_description || cm.activity_2_reason) && (
                    <div>
                      <span className="font-medium text-slate-700">Activity 2:</span>
                      {cm.activity_2_description && <span> {cm.activity_2_description}</span>}
                      {cm.activity_2_reason && (
                        <span> — Reason: {cm.activity_2_reason}</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {productAudits.length === 0 && prescriptionAudits.length === 0 && competitorMarketing.length === 0 && !hasAuditMetrics && (
        <p className="text-sm text-slate-500">
          {visitNotes ? "No audit data for this visit." : "No audit data or notes for this visit."}
        </p>
      )}
    </div>
  );
}
