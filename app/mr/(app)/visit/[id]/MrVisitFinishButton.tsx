"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  mrCheckOut,
  getVisitAudits,
  updateVisitNotes,
  updateVisitAuditMetrics,
} from "@/app/mr/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, ClipboardList, Loader2 } from "lucide-react";

interface MrVisitFinishButtonProps {
  visitId: string;
  objective: string | null;
  initialPatientsPerDay: number | null;
  initialBasketValue: number | null;
  initialNotes: string | null;
}

export function MrVisitFinishButton({
  visitId,
  objective,
  initialPatientsPerDay,
  initialBasketValue,
  initialNotes,
}: MrVisitFinishButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [patientsPerDay, setPatientsPerDay] = useState(
    initialPatientsPerDay != null ? initialPatientsPerDay.toString() : ""
  );
  const [basketValue, setBasketValue] = useState(
    initialBasketValue != null ? initialBasketValue.toString() : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAudit = objective === "AUDIT";

  function handleConfirm() {
    setError(null);
    setWarning(null);

    startTransition(async () => {
      let parsedPatients: number | null = null;
      let parsedBasket: number | null = null;

      if (isAudit) {
        parsedPatients = patientsPerDay ? parseInt(patientsPerDay, 10) : null;
        parsedBasket = basketValue ? parseFloat(basketValue) : null;

        if (!parsedPatients || !parsedBasket) {
          setError(
            "Please fill in audit metrics: patients per day and basket value per patient (KES)."
          );
          return;
        }

        const metricsResult = await updateVisitAuditMetrics(
          visitId,
          parsedPatients,
          parsedBasket
        );
        if (!metricsResult.success) {
          setError(metricsResult.error ?? "Failed to save audit metrics.");
          return;
        }
      }

      const audits = await getVisitAudits(visitId);
      if (!audits.success || !audits.data) {
        setError(audits.error ?? "Could not verify visit data. Please try again.");
        return;
      }

      const { productAudits, prescriptionAudits, competitorMarketing } = audits.data;

      if (isAudit) {
        const missingParts: string[] = [];
        if (productAudits.length === 0) missingParts.push("at least one product audit");
        if (prescriptionAudits.length === 0)
          missingParts.push("some prescription data (doctors & Rx/month)");
        if (competitorMarketing.length === 0)
          missingParts.push("at least one competitor marketing activity");

        if (missingParts.length > 0) {
          setWarning(
            `This AUDIT visit is missing ${missingParts.join(
              ", "
            )}. You can still submit, but reports will be less accurate.`
          );
        }
      }

      const trimmedNotes = notes.trim();
      if (trimmedNotes !== (initialNotes ?? "").trim()) {
        const notesResult = await updateVisitNotes(visitId, trimmedNotes);
        if (!notesResult.success) {
          setError(notesResult.error ?? "Failed to save visit notes.");
          return;
        }
      }

      const result = await mrCheckOut(visitId);
      if (!result.success) {
        setError(result.error ?? "Failed to submit visit.");
        return;
      }

      setOpen(false);
      router.push(`/mr/visit/${visitId}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="lg"
        className="min-h-12 w-full rounded-2xl cta-gradient"
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="mr-2 h-5 w-5" />
        Finish & submit visit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white shadow-xl dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              Review & submit visit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
              Add a short summary of this visit, then submit. For AUDIT visits, make sure
              audit metrics and at least one product cycle are completed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isAudit && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Patients served per day
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={patientsPerDay}
                    onChange={(e) => setPatientsPerDay(e.target.value)}
                    placeholder="e.g. 50"
                    className="h-10 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-background dark:text-slate-50 dark:ring-slate-700/80"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                    Basket value per patient (KES)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={basketValue}
                    onChange={(e) => setBasketValue(e.target.value)}
                    placeholder="e.g. 350"
                    className="h-10 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-background dark:text-slate-50 dark:ring-slate-700/80"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                Visit notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Key products discussed, stock situation, competitor activity, next actions..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-background dark:text-slate-50 dark:ring-slate-700/80"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {warning && !error && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl cta-gradient"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save notes & submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

