"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mrCheckIn } from "@/app/mr/actions";
import { VISIT_OBJECTIVES } from "@/lib/mr/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

type Objective = "AUDIT" | "SALES" | "CAMPAIGN";

export function MrCheckInButton({
  pharmacyId,
  hasOpenVisit,
  openVisitId,
}: {
  pharmacyId: string;
  hasOpenVisit: boolean;
  openVisitId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [objective, setObjective] = useState<Objective>("AUDIT");

  async function handleCheckIn() {
    setLoading(true);
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
        // Proceed without GPS
      }
    }

    const result = await mrCheckIn({
      pharmacyId,
      objective,
      gpsLat,
      gpsLng,
    });

    setLoading(false);
    if (result.success && result.visitId) {
      router.push(`/mr/visit/${result.visitId}`);
      router.refresh();
    } else {
      alert(result.error || "Check-in failed");
    }
  }

  if (hasOpenVisit && openVisitId) {
    return (
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(`/mr/visit/${openVisitId}`)}
      >
        Continue Open Visit
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="objective">Visit objective</Label>
        <select
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-400/20"
        >
          {VISIT_OBJECTIVES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <Button
        className="w-full"
        size="lg"
        onClick={handleCheckIn}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Check In (capturing GPS...)
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4" />
            Check In
          </span>
        )}
      </Button>
    </div>
  );
}
