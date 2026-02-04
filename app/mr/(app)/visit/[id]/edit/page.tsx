import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrVisitAuditForm } from "../MrVisitAuditForm";
import { MrVisitAuditMetricsForm } from "../MrVisitAuditMetricsForm";
import { MrCheckoutButton } from "../MrCheckoutButton";
import { MrVisitNotesForm } from "../MrVisitNotesForm";
import { MrVisitEditExistingData } from "../MrVisitEditExistingData";
import { MrDeleteVisitButton } from "../MrDeleteVisitButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye } from "lucide-react";

export default async function MrVisitEditPage({
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
      "id, status, objective, mr_id, mr_pharmacies(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (visitError) {
    console.error("Visit fetch error:", visitError);
    notFound();
  }

  if (!visit) notFound();

  if (isMr && (visit as { mr_id: string }).mr_id !== auth.user.id) {
    notFound();
  }

  const isOpen = visit.status === "OPEN";
  const canEdit =
    (isMr && isOpen) || isManagerOrAdmin;

  if (!canEdit) {
    redirect(`/mr/visit/${id}`);
  }

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

  const pharmacyRow = Array.isArray(visit.mr_pharmacies) ? visit.mr_pharmacies[0] : visit.mr_pharmacies;
  const pharmacyName = (pharmacyRow as { name?: string } | null)?.name ?? "Pharmacy";

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link href={`/mr/visit/${id}`} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Back to view
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/mr/visit/${id}`}>
              <Eye className="h-4 w-4" />
              View visit
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border bg-slate-50 px-5 py-3">
          <h1 className="text-xl font-semibold text-slate-900">Edit visit: {pharmacyName}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Update notes, audit metrics, add or edit product audits, prescription audits, and competitor marketing. When finished, the MR can check out from this page.
          </p>
        </div>
      </div>

      <MrVisitNotesForm visitId={id} initialNotes={notes} />

      {visit.objective === "AUDIT" && (
        <MrVisitAuditMetricsForm
          visitId={id}
          initialPatientsPerDay={patientsPerDay}
          initialBasketValue={basketValuePerPatient}
        />
      )}

      <MrVisitAuditForm visitId={id} objective={visit.objective ?? "AUDIT"} />

      <MrVisitEditExistingData visitId={id} objective={visit.objective ?? "AUDIT"} />

      {isMr ? (
        <MrCheckoutButton visitId={id} />
      ) : (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-amber-800">
              Only the MR can check out and submit this visit. You can edit all notes and audit data. When done, use &quot;View visit&quot; to see the full read-only summary.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-100">
        <CardContent className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-600">
            Permanently remove this visit and all its product audits, prescription audits, and competitor marketing. This cannot be undone.
          </p>
          <MrDeleteVisitButton
            visitId={id}
            redirectTo={isMr ? "/mr/pharmacies" : "/mr/dashboard"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
