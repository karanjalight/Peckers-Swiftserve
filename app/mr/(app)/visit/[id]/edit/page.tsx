import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrVisitProductCycleForm } from "../MrVisitProductCycleForm";
// import { MrVisitEditExistingData } from "../MrVisitEditExistingData";
import { MrDeleteVisitButton } from "../MrDeleteVisitButton";
import { MrVisitFinishButton } from "../MrVisitFinishButton";
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
    .select("id, status, objective, mr_id, mr_pharmacies(name)")
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

  const canEdit = isMr || isManagerOrAdmin;

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
    <div className="min-h-svh bg-white dark:bg-black/90">
      <div className="space-y-6 lg:px-4 px-2 lg:py-6 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="w-fit rounded-2xl" asChild>
            <Link href={`/mr/visit/${id}`} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Back to visit summary
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-2xl border-black/10 dark:border-white/10"
            asChild
          >
            <Link href={`/mr/visit/${id}`}>
              <Eye className="h-4 w-4" />
              View ({pharmacyName}) visit
            </Link>
          </Button>
         
        </div>

        {/* Product cycles first */}
        <MrVisitProductCycleForm visitId={id} objective={visit.objective ?? "AUDIT"} />

        {/* Edit existing data: hidden per request
        <MrVisitEditExistingData visitId={id} objective={visit.objective ?? "AUDIT"} />
        */}

        {/* Finish/submit block */}
        {isMr ? (
          <MrVisitFinishButton
            visitId={id}
            objective={visit.objective ?? null}
            initialPatientsPerDay={patientsPerDay}
            initialBasketValue={basketValuePerPatient}
            initialNotes={notes}
          />
        ) : (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 px-5 py-4 ring-1 ring-amber-200/50 dark:ring-amber-800/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Only the MR can check out and submit this visit. You can edit all audit data. When done, use &quot;View visit&quot; to see the full read-only summary.
            </p>
          </div>
        )}

        {/* Destructive actions */}
        <div className="rounded-2xl bg-white dark:bg-card px-5 py-4 shadow-sm ring-1 ring-red-200/50 dark:ring-red-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-muted-foreground">
            Permanently remove this visit and all its product audits, prescription audits, and competitor marketing. This cannot be undone.
          </p>
          <MrDeleteVisitButton
            visitId={id}
            redirectTo={isMr ? "/mr/pharmacies" : "/mr/dashboard"}
          />
        </div>
      </div>
    </div>
  );
}
