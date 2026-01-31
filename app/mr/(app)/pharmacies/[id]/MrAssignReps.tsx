"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignMrToPharmacy, unassignMrFromPharmacy } from "@/app/mr/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

type AssignedRep = { id: string; full_name: string };
type AvailableRep = { id: string; full_name: string };

export function MrAssignReps({
  pharmacyId,
  assignedReps,
  availableReps,
}: {
  pharmacyId: string;
  assignedReps: AssignedRep[];
  availableReps: AvailableRep[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedMrId, setSelectedMrId] = useState("");

  async function handleAssign() {
    if (!selectedMrId) return;
    setAdding(selectedMrId);
    const result = await assignMrToPharmacy(pharmacyId, selectedMrId);
    setAdding(null);
    if (result.success) {
      setSelectedMrId("");
      router.refresh();
    }
  }

  async function handleUnassign(mrId: string) {
    setRemoving(mrId);
    const result = await unassignMrFromPharmacy(pharmacyId, mrId);
    setRemoving(null);
    if (result.success) router.refresh();
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Assigned Medical Reps
        </CardTitle>
        <CardDescription>
          Assign MRs to this pharmacy. They can then check in and record visits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignedReps.length === 0 && availableReps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
            No MRs in your team yet. Admins can create MRs and set you as their
            manager.
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {assignedReps.map((rep) => (
                <li
                  key={rep.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {rep.full_name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(rep.id)}
                    disabled={!!removing}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {removing === rep.id ? "Removing…" : "Remove"}
                  </Button>
                </li>
              ))}
            </ul>
            {availableReps.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                <select
                  value={selectedMrId}
                  onChange={(e) => setSelectedMrId(e.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20"
                >
                  <option value="">Select MR to assign</option>
                  {availableReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.full_name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedMrId || !!adding}
                >
                  {adding ? "Adding…" : "Assign"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
