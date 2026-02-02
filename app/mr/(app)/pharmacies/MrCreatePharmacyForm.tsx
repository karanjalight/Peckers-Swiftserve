"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPharmacy } from "@/app/mr/actions";
import { MR_REGIONS, NAIROBI_SUB_REGIONS } from "@/lib/mr/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function MrCreatePharmacyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");

  useEffect(() => {
    if (region !== "Nairobi") setSubRegion("");
  }, [region]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createPharmacy({
      name: (formData.get("name") as string) || "",
      region: (formData.get("region") as string) || "",
      subRegion: region === "Nairobi" ? (formData.get("subRegion") as string) || null : null,
      locationText: (formData.get("locationText") as string) || null,
      procurementName: (formData.get("procurementName") as string) || null,
      procurementContact: (formData.get("procurementContact") as string) || null,
      avgAttendantsPerDay: (() => {
        const v = formData.get("avgAttendantsPerDay") as string;
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? null : n;
      })(),
      avgOrderValue: (() => {
        const v = formData.get("avgOrderValue") as string;
        const n = parseFloat(v);
        return Number.isNaN(n) ? null : n;
      })(),
    });
    setLoading(false);
    if (result.success && result.pharmacyId) {
      setOpen(false);
      form.reset();
      router.push(`/mr/pharmacies/${result.pharmacyId}`);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create pharmacy");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Pharmacy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pharmacy</DialogTitle>
          <DialogDescription>
            Add a new pharmacy to the MR field. You can assign reps after
            creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Pharmacy name"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <select
              id="region"
              name="region"
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select region</option>
              {MR_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {region === "Nairobi" && (
            <div className="space-y-2">
              <Label htmlFor="subRegion">Sub-region</Label>
              <select
                id="subRegion"
                name="subRegion"
                value={subRegion}
                onChange={(e) => setSubRegion(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select sub-region</option>
                {NAIROBI_SUB_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="locationText">Location (address)</Label>
            <Input
              id="locationText"
              name="locationText"
              placeholder="Optional"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurementName">Procurement contact name</Label>
            <Input
              id="procurementName"
              name="procurementName"
              placeholder="Optional"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurementContact">
              Procurement contact (phone/email)
            </Label>
            <Input
              id="procurementContact"
              name="procurementContact"
              placeholder="Optional"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avgAttendantsPerDay">How many people attended per day (average)</Label>
            <Input
              id="avgAttendantsPerDay"
              name="avgAttendantsPerDay"
              type="number"
              min={0}
              placeholder="e.g. 50"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avgOrderValue">Average order value (KES)</Label>
            <Input
              id="avgOrderValue"
              name="avgOrderValue"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 1200"
              className="border-slate-200"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
