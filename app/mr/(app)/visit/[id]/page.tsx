import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrVisitReadOnly } from "./MrVisitReadOnly";
import { MrDeleteVisitButton } from "./MrDeleteVisitButton";
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
    (isMr && (visit as { mr_id: string }).mr_id === auth.user.id) ||
    isManagerOrAdmin;

  const submittedHref = isMr ? "/mr/history" : "/mr/dashboard";
  const submittedLabel = isMr ? "View in History" : "Back to Dashboard";

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
    <div className="mx-auto   space-y-6 sm:space-y-8">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-1 w-fit touch-manipulation text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800" asChild>
          <Link href={isMr ? "/mr/pharmacies" : "/mr/dashboard"} className="gap-1.5 font-medium">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Back to {isMr ? "Pharmacies" : "Dashboard"}</span>
          </Link>
        </Button>
      </div>

      {/* Premium hero header */}
      <div className="overflow-hidden rounded-2xl bg-blue-900 shadow-xl ring-1 ring-blue-800/50 dark:ring-blue-950">
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3 gap-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white min-w-0 break-words sm:text-3xl">
                  {pharmacyName}
                </h1>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${
                    isOpen
                      ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30"
                      : "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30"
                  }`}
                >
                  {isOpen ? "In progress" : "Submitted"}
                </span>
              </div>
              {visit.objective && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-blue-800/60 px-3 py-1.5 text-sm font-medium text-blue-100">
                  <Target className="h-4 w-4 shrink-0" />
                  <span className="truncate">{visit.objective}</span>
                </span>
              )}
              <p className="text-sm text-blue-200/90 max-w-xl">
                Visit details: check-in, check-out, duration and location.
              </p>
            </div>
            {canEdit && (
              <div className="flex flex-shrink-0 items-center gap-2 sm:flex-wrap">
                <Button
                  asChild
                  size="sm"
                  className="min-h-10 gap-1.5 touch-manipulation bg-white text-blue-900 hover:bg-blue-50 sm:w-auto"
                >
                  <Link href={`/mr/visit/${id}/edit`} className="inline-flex items-center justify-center font-semibold">
                    <Pencil className="h-4 w-4 shrink-0" />
                    Edit visit
                  </Link>
                </Button>
                <MrDeleteVisitButton
                  visitId={id}
                  redirectTo={isMr ? "/mr/pharmacies" : "/mr/dashboard"}
                  variant="ghost"
                  className="text-blue-200 hover:bg-blue-800/50 hover:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Visit details grid - inside hero for premium look */}
        <div className="border-t border-blue-800/60 bg-blue-950/40 px-5 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-800/60">
                <Clock className="h-5 w-5 text-blue-200" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">Check-in</dt>
                <dd className="mt-0.5 break-words text-base font-semibold text-white sm:text-lg">
                  {new Date(visit.check_in_time).toLocaleString()}
                </dd>
              </div>
            </div>
            {visit.check_out_time && (
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-800/60">
                  <Clock className="h-5 w-5 text-blue-200" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">Check-out</dt>
                  <dd className="mt-0.5 break-words text-base font-semibold text-white sm:text-lg">
                    {new Date(visit.check_out_time).toLocaleString()}
                  </dd>
                </div>
              </div>
            )}
            {(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes != null && (
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-800/60">
                  <Clock className="h-5 w-5 text-blue-200" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">Duration</dt>
                  <dd className="mt-0.5 text-base font-semibold text-white sm:text-lg">
                    {Math.round((visit as { visit_duration_minutes: number }).visit_duration_minutes)} min
                  </dd>
                </div>
              </div>
            )}
            {(pharmacyRow as { region?: string } | null)?.region && (
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-800/60">
                  <MapPin className="h-5 w-5 text-blue-200" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">Region</dt>
                  <dd className="mt-0.5 font-semibold text-white sm:text-base">
                    {(pharmacyRow as { region?: string }).region}
                  </dd>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MrVisitReadOnly {...readOnlyProps} />

      {!isOpen && (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-950/50">
          <div className="px-5 py-4 text-center sm:px-6 sm:py-5">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Visit submitted.{" "}
              <Button variant="link" className="h-auto p-0 font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 touch-manipulation" asChild>
                <Link href={submittedHref}>
                  {submittedLabel}
                </Link>
              </Button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
