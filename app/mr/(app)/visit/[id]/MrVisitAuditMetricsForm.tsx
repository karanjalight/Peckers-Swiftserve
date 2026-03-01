"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVisitAuditMetrics } from "@/app/mr/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MrVisitAuditMetricsForm({
  visitId,
  initialPatientsPerDay,
  initialBasketValue,
}: {
  visitId: string;
  initialPatientsPerDay: number | null;
  initialBasketValue: number | null;
}) {
  const router = useRouter();
  const [patientsPerDay, setPatientsPerDay] = useState(
    initialPatientsPerDay?.toString() ?? ""
  );
  const [basketValue, setBasketValue] = useState(
    initialBasketValue?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const result = await updateVisitAuditMetrics(
      visitId,
      patientsPerDay ? parseInt(patientsPerDay, 10) : null,
      basketValue ? parseFloat(basketValue) : null
    );
    setSaving(false);
    if (result.success) {
      setMessage("Audit metrics saved.");
      router.refresh();
    } else {
      setMessage(result.error ?? "Failed to save");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground">Audit metrics</h3>
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-muted-foreground">
        Capture pharmacy volume and value: how many patients they serve per day and the average basket value (KES) per patient. Used for AUDIT visits.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="patientsPerDay" className="text-foreground">Patients served per day</Label>
          <Input
            id="patientsPerDay"
            type="number"
            min={0}
            value={patientsPerDay}
            onChange={(e) => setPatientsPerDay(e.target.value)}
            placeholder="e.g. 50"
            className="mt-1.5 h-12 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
        </div>
        <div>
          <Label htmlFor="basketValue" className="text-slate-900 dark:text-foreground">Basket value per patient (KES)</Label>
          <Input
            id="basketValue"
            type="number"
            min={0}
            step="0.01"
            value={basketValue}
            onChange={(e) => setBasketValue(e.target.value)}
            placeholder="e.g. 350"
            className="mt-1.5 h-12 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="rounded-2xl cta-gradient" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {message && (
          <span
            className={`text-sm ${
              message.includes("saved") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
