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
    <div className="grid gap-6">
      {visitNotes && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-slate-500" />
              Visit notes
            </CardTitle>
            <CardDescription>
              General notes from the rep: products discussed, stock, competitors, or other observations from the visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {visitNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {hasAuditMetrics && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-slate-500" />
              Audit metrics
            </CardTitle>
            <CardDescription>
              Pharmacy volume and value: how many patients they serve per day and average basket value (KES) per patient.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              {patientsPerDay != null && (
                <div>
                  <dt className="text-slate-500">Patients per day</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{patientsPerDay}</dd>
                </div>
              )}
              {basketValuePerPatient != null && (
                <div>
                  <dt className="text-slate-500">Basket value per patient (KES)</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{basketValuePerPatient}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {productAudits.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-slate-500" />
              Product audits
              <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-normal text-slate-600">
                {productAudits.length} product{productAudits.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
            <CardDescription>
              Products recorded at this pharmacy: stock levels, supplier, price (KES), and whether staff understand the product USP. Competitor products are listed where captured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">Product</th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">Stock</th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">Price</th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">Supplier</th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">USP</th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-600">Competitors</th>
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
                        <tr key={pa.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 font-medium text-slate-900">{productName}</td>
                          <td className="px-3 py-2.5 text-slate-700">{pa.quantity_in_stock}</td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {pa.price_per_pack != null ? `KES ${pa.price_per_pack}` : "—"}
                          </td>
                          <td className="max-w-[120px] px-3 py-2.5 text-slate-600">{pa.supplier ?? "—"}</td>
                          <td className="px-3 py-2.5">{pa.usp_understood ? "Yes" : "No"}</td>
                          <td className="max-w-[200px] px-3 py-2.5">
                            {competitors.length ? (
                              <ul className="space-y-1 text-xs text-slate-600">
                                {competitors.map((c: {
                                  competitor_name: string;
                                  supplier?: string | null;
                                  competitor_stock: number | null;
                                  price_per_pack?: number | null;
                                }, i: number) => (
                                  <li key={i}>
                                    <span className="font-medium text-slate-700">{c.competitor_name}</span>
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
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-slate-500" />
              Prescription audits
              <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-normal text-slate-600">
                {prescriptionAudits.length} entr{prescriptionAudits.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription>
              Top doctors at this pharmacy: who they are, where they practice, which products they prescribe, and prescriptions per month. Attached images are evidence when provided.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600">Doctor</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600">Location</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600">Product</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600">Rx/month</th>
                    <th className="px-3 py-2.5 text-left font-medium text-slate-600">Image</th>
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
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-medium text-slate-900">{doc?.name ?? "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{doc?.location ?? "—"}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{pa.product_name}</td>
                        <td className="px-3 py-2.5 text-slate-700">{pa.rx_per_month ?? "—"}</td>
                        <td className="px-3 py-2.5">
                          {pa.prescription_image_url ? (
                            <a
                              href={pa.prescription_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-slate-700 underline hover:text-slate-900"
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
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-slate-500" />
              Competitor marketing
              <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-normal text-slate-600">
                {competitorMarketing.length} entr{competitorMarketing.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription>
              What competitors are doing at this pharmacy: their activities (e.g. breakfast meetings, sampling) and why pharmacy staff say they dispense their products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {competitorMarketing.map((cm: {
                competitor_name: string;
                activity_description: string | null;
                reason_it_works: string | null;
                activity_2_description?: string | null;
                activity_2_reason?: string | null;
              }, i: number) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200"
                >
                  <p className="font-semibold text-slate-900">{cm.competitor_name}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {(cm.activity_description || cm.reason_it_works) && (
                      <div>
                        <span className="font-medium text-slate-700">Activity 1:</span>{" "}
                        {cm.activity_description}
                        {cm.reason_it_works && (
                          <span className="block mt-0.5 text-slate-500">Reason: {cm.reason_it_works}</span>
                        )}
                      </div>
                    )}
                    {(cm.activity_2_description || cm.activity_2_reason) && (
                      <div>
                        <span className="font-medium text-slate-700">Activity 2:</span>{" "}
                        {cm.activity_2_description}
                        {cm.activity_2_reason && (
                          <span className="block mt-0.5 text-slate-500">Reason: {cm.activity_2_reason}</span>
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
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No audit data or notes for this visit yet.</p>
            <p className="mt-1 text-sm text-slate-400">Notes, product audits, prescription audits, and competitor marketing will appear here once added.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
