import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";
import { fetchPrescriptionAuditsForVisitIds } from "@/lib/mr/fetch-prescription-audits-for-visits";
import { buildTopPrescribersPerPharmacy } from "@/lib/mr/presentation-reports-advanced";
import type { AuditVisitRow } from "@/lib/mr/presentation-reports";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { TopPrescribersPerChemistPanel } from "@/components/mr/TopPrescribersPerChemistPanel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TopPrescribersPerChemistPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

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
    console.error("Top prescribers audit visits error:", auditVisitsRes.error);
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
  const prescriptionAudits = await fetchPrescriptionAuditsForVisitIds(
    supabase,
    auditVisitIds
  );

  const topPrescribersPerChemist = buildTopPrescribersPerPharmacy(
    auditVisits,
    prescriptionAudits
  );

  return (
    <div className="w-full space-y-6">
      <Button variant="ghost" size="sm" className="-ml-1 w-fit" asChild>
        <Link href="/mr/reports" className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </Button>

      <Card className="border-slate-600 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 dark:text-white">
            Top prescribers per chemist
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Doctors with the highest summed prescription volume (Rx/month) per
            pharmacy, based on data captured during AUDIT visits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopPrescribersPerChemistPanel blocks={topPrescribersPerChemist} />
        </CardContent>
      </Card>
    </div>
  );
}
