import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrVisitAuditForm } from "./MrVisitAuditForm";
import { MrVisitAuditMetricsForm } from "./MrVisitAuditMetricsForm";
import { MrCheckoutButton } from "./MrCheckoutButton";
import { MrVisitReadOnly } from "./MrVisitReadOnly";
import { MrVisitNotesForm } from "./MrVisitNotesForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function MrVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || typeof id !== "string") notFound();

  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;
  const isMr = auth.profile.role === "MR";

  const { data: visit, error: visitError } = await supabase
    .from("mr_visits")
    .select(
      "id, status, check_in_time, check_out_time, visit_duration_minutes, objective, mr_id, gps_lat, gps_lng, mr_pharmacies(name, region)"
    )
    .eq("id", id)
    .maybeSingle();

  if (visitError) {
    console.error("Visit fetch error:", visitError);
    notFound();
  }

  if (!visit) notFound();

  let notes: string | null = null;
  let patientsPerDay: number | null = null;
  let basketValuePerPatient: number | null = null;
  const { data: extras } = await supabase
    .from("mr_visits")
    .select("notes, patients_per_day, basket_value_per_patient")
    .eq("id", id)
    .maybeSingle();
  if (extras) {
    notes = (extras as { notes?: string | null }).notes ?? null;
    patientsPerDay = (extras as { patients_per_day?: number | null }).patients_per_day ?? null;
    basketValuePerPatient = (extras as { basket_value_per_patient?: number | null }).basket_value_per_patient ?? null;
  }

  if (isMr && (visit as { mr_id: string }).mr_id !== auth.user.id) {
    notFound();
  }

  const pharmacyRow = Array.isArray(visit.mr_pharmacies) ? visit.mr_pharmacies[0] : visit.mr_pharmacies;
  const pharmacyName = (pharmacyRow as { name?: string } | null)?.name ?? "Pharmacy";
  const isOpen = visit.status === "OPEN";

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={isMr ? "/mr/pharmacies" : "/mr/dashboard"}
            className="gap-1.5 -ml-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {isMr ? "Pharmacies" : "Dashboard"}
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Visit: {pharmacyName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Check-in: {new Date(visit.check_in_time).toLocaleString()}
          {visit.check_out_time && (
            <> • Check-out: {new Date(visit.check_out_time).toLocaleString()}</>
          )}
          {(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes != null && (
            <> • Duration: {Math.round((visit as { visit_duration_minutes: number }).visit_duration_minutes)} min</>
          )}
        </p>
      </div>

      {isOpen && isMr ? (
        <>
          <MrVisitNotesForm visitId={id} initialNotes={notes} />
          {visit.objective === "AUDIT" && (
            <MrVisitAuditMetricsForm
              visitId={id}
              initialPatientsPerDay={patientsPerDay}
              initialBasketValue={basketValuePerPatient}
            />
          )}
          <MrVisitAuditForm visitId={id} objective={visit.objective ?? "AUDIT"} />
          <MrCheckoutButton visitId={id} />
        </>
      ) : isOpen && !isMr ? (
        <>
          <MrVisitReadOnly
            visitId={id}
            notes={(visit as { notes?: string | null }).notes ?? null}
            objective={(visit as { objective?: string }).objective ?? null}
            patientsPerDay={(visit as { patients_per_day?: number | null }).patients_per_day ?? null}
            basketValuePerPatient={(visit as { basket_value_per_patient?: number | null }).basket_value_per_patient ?? null}
            checkInTime={visit.check_in_time}
            checkOutTime={visit.check_out_time}
            visitDurationMinutes={(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes ?? null}
            gpsLat={(visit as { gps_lat?: number | null }).gps_lat ?? null}
            gpsLng={(visit as { gps_lng?: number | null }).gps_lng ?? null}
            pharmacyName={pharmacyName}
            pharmacyRegion={(visit.mr_pharmacies as { region?: string } | null)?.region ?? null}
          />
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <p className="text-sm text-amber-800">
                Managers cannot edit. This visit is still open (MR has not
                checked out).
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <MrVisitReadOnly
            visitId={id}
            notes={notes}
            objective={visit.objective}
            patientsPerDay={patientsPerDay}
            basketValuePerPatient={basketValuePerPatient}
            checkInTime={visit.check_in_time}
            checkOutTime={visit.check_out_time}
            visitDurationMinutes={(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes ?? null}
            gpsLat={(visit as { gps_lat?: number | null }).gps_lat ?? null}
            gpsLng={(visit as { gps_lng?: number | null }).gps_lng ?? null}
            pharmacyName={pharmacyName}
            pharmacyRegion={(visit.mr_pharmacies as { region?: string } | null)?.region ?? null}
          />
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-green-800">
                Visit submitted.{" "}
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={isMr ? "/mr/history" : "/mr/dashboard"}>
                    {isMr ? "View in History" : "Back to Dashboard"}
                  </Link>
                </Button>
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
