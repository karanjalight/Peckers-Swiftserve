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
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-2 font-medium">Audit Metrics</h3>
      <p className="mb-4 text-sm text-slate-500">
        How many patients do they serve per day? What is the basket value per
        patient?
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="patientsPerDay">Patients served per day</Label>
          <Input
            id="patientsPerDay"
            type="number"
            min={0}
            value={patientsPerDay}
            onChange={(e) => setPatientsPerDay(e.target.value)}
            placeholder="e.g. 50"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="basketValue">Basket value per patient (KES)</Label>
          <Input
            id="basketValue"
            type="number"
            min={0}
            step="0.01"
            value={basketValue}
            onChange={(e) => setBasketValue(e.target.value)}
            placeholder="e.g. 350"
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {message && (
          <span
            className={`text-sm ${
              message.includes("saved") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
