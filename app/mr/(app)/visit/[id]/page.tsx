import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrVisitReadOnly } from "./MrVisitReadOnly";
import { MrDeleteVisitButton } from "./MrDeleteVisitButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Clock, Target, Pencil } from "lucide-react";

export default async function MrVisitViewPage({
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
  const isManagerOrAdmin = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";

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

  const canEdit =
    (isMr && isOpen && (visit as { mr_id: string }).mr_id === auth.user.id) ||
    (isManagerOrAdmin);

  const readOnlyProps = {
    visitId: id,
    notes: notes ?? (visit as { notes?: string | null }).notes ?? null,
    objective: (visit.objective ?? (visit as { objective?: string }).objective) ?? null,
    patientsPerDay: patientsPerDay ?? (visit as { patients_per_day?: number | null }).patients_per_day ?? null,
    basketValuePerPatient: basketValuePerPatient ?? (visit as { basket_value_per_patient?: number | null }).basket_value_per_patient ?? null,
    checkInTime: visit.check_in_time,
    checkOutTime: visit.check_out_time,
    visitDurationMinutes: (visit as { visit_duration_minutes?: number | null }).visit_duration_minutes ?? null,
    gpsLat: (visit as { gps_lat?: number | null }).gps_lat ?? null,
    gpsLng: (visit as { gps_lng?: number | null }).gps_lng ?? null,
    pharmacyName,
    pharmacyRegion: (visit.mr_pharmacies as { region?: string } | null)?.region ?? null,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-1 w-fit touch-manipulation" asChild>
          <Link href={isMr ? "/mr/pharmacies" : "/mr/dashboard"} className="gap-1.5">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Back to {isMr ? "Pharmacies" : "Dashboard"}</span>
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <div className="border-b bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 dark:bg-slate-900/30 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 min-w-0 break-words sm:text-2xl">
                    {pharmacyName}
                  </h1>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium sm:px-3 sm:py-1 sm:text-sm ${
                      isOpen ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    }`}
                  >
                    {isOpen ? "In progress" : "Submitted"}
                  </span>
                </div>
                {visit.objective && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/80 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 sm:text-sm">
                    <Target className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">{visit.objective}</span>
                  </span>
                )}
              </div>
              {canEdit && (
                <div className="flex flex-shrink-0 items-center gap-2 sm:flex-wrap">
                  <Button asChild size="sm" className="min-h-10 w-full gap-1.5 touch-manipulation sm:w-auto">
                    <Link href={`/mr/visit/${id}/edit`} className="inline-flex items-center justify-center">
                      <Pencil className="h-4 w-4 shrink-0" />
                      Edit visit
                    </Link>
                  </Button>
                  <MrDeleteVisitButton
                    visitId={id}
                    redirectTo={isMr ? "/mr/pharmacies" : "/mr/dashboard"}
                    variant="ghost"
                  />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Visit details: when the rep checked in and out, and how long they spent at the pharmacy.
            </p>
          </div>
          <CardContent className="grid gap-x-6 gap-y-4 px-4 pt-4 sm:grid-cols-2 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-3 min-w-0">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">Check-in</dt>
                <dd className="break-words font-medium text-slate-900 text-sm sm:text-base dark:text-slate-100">
                  {new Date(visit.check_in_time).toLocaleString()}
                </dd>
              </div>
            </div>
            {visit.check_out_time && (
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">Check-out</dt>
                  <dd className="break-words font-medium text-slate-900 text-sm sm:text-base dark:text-slate-100">
                    {new Date(visit.check_out_time).toLocaleString()}
                  </dd>
                </div>
              </div>
            )}
            {(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes != null && (
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">Duration</dt>
                  <dd className="font-medium text-slate-900 text-sm sm:text-base dark:text-slate-100">
                    {Math.round((visit as { visit_duration_minutes: number }).visit_duration_minutes)} min
                  </dd>
                </div>
              </div>
            )}
            {(pharmacyRow as { region?: string } | null)?.region && (
              <div className="flex items-start gap-3 min-w-0 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">Region</dt>
                  <dd className="font-medium text-slate-900 text-sm sm:text-base dark:text-slate-100">
                    {(pharmacyRow as { region?: string }).region}
                  </dd>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MrVisitReadOnly {...readOnlyProps} />

      {!isOpen && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="px-4 py-3 text-center sm:px-5 sm:py-4">
            <p className="text-xs text-green-800 dark:text-green-200 sm:text-sm">
              Visit submitted.{" "}
              <Button variant="link" className="h-auto p-0 touch-manipulation" asChild>
                <Link href={isMr ? "/mr/history" : "/mr/dashboard"}>
                  {isMr ? "View in History" : "Back to Dashboard"}
                </Link>
              </Button>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
