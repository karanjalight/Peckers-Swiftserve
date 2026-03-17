"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mrCreatePharmacyAndCheckIn } from "@/app/mr/actions";
import { MR_REGIONS, NAIROBI_SUB_REGIONS, VISIT_OBJECTIVES } from "@/lib/mr/constants";
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
import { Plus, Loader2, MapPin } from "lucide-react";

type Objective = "AUDIT" | "SALES" | "CAMPAIGN";

export function MrNewPharmacyCheckInForm() {
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

    let gpsLat: number | undefined;
    let gpsLng: number | undefined;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        gpsLat = pos.coords.latitude;
        gpsLng = pos.coords.longitude;
      } catch {
        /* ignore */
      }
    }

    const result = await mrCreatePharmacyAndCheckIn({
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
      objective: (formData.get("objective") as Objective) || "AUDIT",
      gpsLat,
      gpsLng,
    });

    setLoading(false);
    if (result.success && result.visitId) {
      setOpen(false);
      form.reset();
      setRegion("");
      setSubRegion("");
      router.push(`/mr/visit/${result.visitId}/edit`);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to start visit");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          New Pharmacy & Check In
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Pharmacy & Check In</DialogTitle>
          <DialogDescription>
            Type pharmacy details and check in to start your visit
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Pharmacy Name *</Label>
            <Input id="name" name="name" required placeholder="Pharmacy name" className="border-slate-200" />
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
            <Label htmlFor="locationText">Location (typed by MR)</Label>
            <Input
              id="locationText"
              name="locationText"
              placeholder="Address or area"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurementName">Procurement Staff Name</Label>
            <Input
              id="procurementName"
              name="procurementName"
              placeholder="Name"
              className="border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procurementContact">Procurement Contact</Label>
            <Input
              id="procurementContact"
              name="procurementContact"
              placeholder="Phone or email"
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
            <Label htmlFor="avgOrderValue">Basket value (KES)</Label>
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
          <div className="space-y-2">
            <Label htmlFor="objective">Objective *</Label>
            <select
              id="objective"
              name="objective"
              required
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {VISIT_OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Check In
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
