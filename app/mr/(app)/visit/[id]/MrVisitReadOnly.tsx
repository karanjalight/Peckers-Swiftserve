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
  Stethoscope,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { MrVisitProductDetailTabs } from "./MrVisitProductDetailTabs";

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
        quantity_sold_good_month,
        price_per_pack,
        days_oos,
        reason_for_oos,
        do_substitute,
        substitute_with_and_why,
        mr_products (name),
        mr_competitor_audits (competitor_name, supplier, competitor_stock, stock_sold_per_month, substitution_reason, price_per_pack, days_out, reason_out_of_stock, doctor_prescribing, doctor_location, rx_per_month)
      `)
      .eq("visit_id", visitId),
    supabase
      .from("mr_prescription_audits")
      .select("product_name, rx_per_month, prescription_image_url, mr_doctors(name, location)")
      .eq("visit_id", visitId),
    supabase
      .from("mr_competitor_marketing")
      .select("competitor_name, activity_description, reason_it_works, activity_2_description, activity_2_reason")
      .eq("visit_id", visitId),
  ]);

  const productAudits = productAuditsRes.data ?? [];
  const prescriptionAudits = prescriptionAuditsRes.data ?? [];
  const competitorMarketing = competitorMarketingRes.data ?? [];
  const isAudit = objective === "AUDIT";
  const hasAuditMetrics = isAudit && (patientsPerDay != null || basketValuePerPatient != null);

  return (
    <div className="grid gap-5 sm:gap-6">
      {visitNotes && (
        <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700">
          <CardHeader className="space-y-2 border-0 bg-blue-900 px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <FileText className="h-5 w-5 shrink-0 text-blue-200" />
              Visit notes
            </CardTitle>
            <CardDescription className="text-sm text-blue-200/90">
              General notes from the rep: products discussed, stock, competitors, or other observations from the visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900/30 sm:px-6 sm:py-6">
            <p className="whitespace-pre-wrap text-base leading-relaxed font-medium text-slate-800 dark:text-slate-200">
              {visitNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {hasAuditMetrics && (
        <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700">
          <CardHeader className="space-y-2 border-0 bg-blue-900 px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <BarChart3 className="h-5 w-5 shrink-0 text-blue-200" />
              Audit metrics
            </CardTitle>
            <CardDescription className="text-sm text-blue-200/90">
              Pharmacy volume and value: how many patients they serve per day and average basket value (KES) per patient.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900/30 sm:px-6 sm:py-6">
            <dl className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {patientsPerDay != null && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Patients per day</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{patientsPerDay}</dd>
                </div>
              )}
              {basketValuePerPatient != null && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">Basket value per patient (KES)</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{basketValuePerPatient}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Product-based tabs: stock, competitors, prescriptions per product */}
      {productAudits.length > 0 && (
        <MrVisitProductDetailTabs
          productAudits={productAudits as any}
          prescriptionAudits={prescriptionAudits as any}
        />
      )}

      {/* Standalone prescription list when no product audits (edge case) */}
      {productAudits.length === 0 && prescriptionAudits.length > 0 && (
        <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700">
          <CardHeader className="space-y-2 border-0 bg-blue-900 px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <Stethoscope className="h-5 w-5 shrink-0 text-blue-200" />
              Prescription audits
              <span className="rounded-full bg-blue-800/60 px-3 py-1 text-sm font-medium text-blue-100">
                {prescriptionAudits.length} entr{prescriptionAudits.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription className="text-sm text-blue-200/90">
              Top doctors at this pharmacy: who they are, where they practice, which products they prescribe, and prescriptions per month. Attached images are evidence when provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900/30 sm:px-6 sm:py-6">
            {/* Mobile: card list */}
            <div className="space-y-4 md:hidden">
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
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{doc?.name ?? "—"}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{doc?.location ?? "—"}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-slate-500 dark:text-slate-400">Product</dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-200 truncate">{pa.product_name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500 dark:text-slate-400">Rx/month</dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-200">{pa.rx_per_month ?? "—"}</dd>
                      </div>
                    </dl>
                    {pa.prescription_image_url && (
                      <a
                        href={pa.prescription_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 touch-manipulation"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        View image
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto -mx-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-blue-900/10 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Doctor</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Rx/month</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Image</th>
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
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{doc?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{doc?.location ?? "—"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{pa.product_name}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{pa.rx_per_month ?? "—"}</td>
                        <td className="px-4 py-3">
                          {pa.prescription_image_url ? (
                            <a
                              href={pa.prescription_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                            >
                              <ExternalLink className="h-4 w-4" />
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
        <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700">
          <CardHeader className="space-y-2 border-0 bg-blue-900 px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <Megaphone className="h-5 w-5 shrink-0 text-blue-200" />
              Competitor marketing
              <span className="rounded-full bg-blue-800/60 px-3 py-1 text-sm font-medium text-blue-100">
                {competitorMarketing.length} entr{competitorMarketing.length !== 1 ? "ies" : "y"}
              </span>
            </CardTitle>
            <CardDescription className="text-sm text-blue-200/90">
              What competitors are doing at this pharmacy: their activities (e.g. breakfast meetings, sampling) and why pharmacy staff say they dispense their products.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900/30 sm:px-6 sm:py-6">
            <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {competitorMarketing.map((cm: {
                competitor_name: string;
                activity_description: string | null;
                reason_it_works: string | null;
                activity_2_description?: string | null;
                activity_2_reason?: string | null;
              }, i: number) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 sm:p-5"
                >
                  <p className="font-bold text-slate-900 text-base dark:text-slate-100">{cm.competitor_name}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {(cm.activity_description || cm.reason_it_works) && (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Activity 1:</span>{" "}
                        {cm.activity_description}
                        {cm.reason_it_works && (
                          <span className="mt-0.5 block font-medium text-slate-600 dark:text-slate-400">Reason: {cm.reason_it_works}</span>
                        )}
                      </div>
                    )}
                    {(cm.activity_2_description || cm.activity_2_reason) && (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Activity 2:</span>{" "}
                        {cm.activity_2_description}
                        {cm.activity_2_reason && (
                          <span className="mt-0.5 block font-medium text-slate-600 dark:text-slate-400">Reason: {cm.activity_2_reason}</span>
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
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="px-5 py-10 text-center sm:px-6 sm:py-14">
            <p className="text-base font-semibold text-slate-600 dark:text-slate-400">No audit data or notes for this visit yet.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Notes, product audits, prescription audits, and competitor marketing will appear here once added.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
