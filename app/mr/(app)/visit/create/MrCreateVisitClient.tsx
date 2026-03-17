"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mrCheckIn, mrCreatePharmacyAndCheckIn } from "@/app/mr/actions";
import { MR_REGIONS, NAIROBI_SUB_REGIONS, VISIT_OBJECTIVES } from "@/lib/mr/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Check,
  Loader2,
  MapPin,
  MapPinHouse,
  PlusCircle,
  Sparkles,
  Target,
} from "lucide-react";

type Objective = "AUDIT" | "SALES" | "CAMPAIGN";

type SimplePharmacy = {
  id: string;
  name: string;
  region: string;
  subRegion: string | null;
};

interface MrCreateVisitClientProps {
  pharmacies: SimplePharmacy[];
}

export function MrCreateVisitClient({ pharmacies }: MrCreateVisitClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">("new");

  // Existing pharmacy state
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacies[0]?.id ?? ""
  );
  const [existingObjective, setExistingObjective] = useState<Objective>("AUDIT");
  const [existingLoading, setExistingLoading] = useState(false);

  // New pharmacy state
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [newObjective, setNewObjective] = useState<Objective>("AUDIT");
  const [newLoading, setNewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartExisting() {
    if (!selectedPharmacyId) return;
    setExistingLoading(true);
    setError(null);

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
        // ignore GPS failure and continue
      }
    }

    const result = await mrCheckIn({
      pharmacyId: selectedPharmacyId,
      objective: existingObjective,
      gpsLat,
      gpsLng,
    });

    setExistingLoading(false);
    if (result.success && result.visitId) {
      router.push(`/mr/visit/${result.visitId}/edit`);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to start visit");
    }
  }

  async function handleCreateNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewLoading(true);
    setError(null);
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
        // ignore
      }
    }

    const result = await mrCreatePharmacyAndCheckIn({
      name: (formData.get("name") as string) || "",
      region: (formData.get("region") as string) || "",
      subRegion: region === "Nairobi" ? ((formData.get("subRegion") as string) || null) : null,
      locationText: ((formData.get("locationText") as string) || "").trim() || null,
      procurementName: ((formData.get("procurementName") as string) || "").trim() || null,
      procurementContact:
        ((formData.get("procurementContact") as string) || "").trim() || null,
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
      objective: (formData.get("objective") as Objective) || newObjective,
      gpsLat,
      gpsLng,
    });

    setNewLoading(false);
    if (result.success && result.visitId) {
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
    <div className="min-h-svh bg-gradient-to-b from-slate-50 via-white to-slate-50/70 px-4 py-6 sm:px-6 lg:px-8 dark:from-black dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full  flex-col gap-6">
        {/* Hero */}
        <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-blue-800 via-indigo-500 to-violet-900 text-white shadow-lg">
          <CardContent className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">
                  Start a new field visit
                </h1>
                <p className="mt-1 text-sm text-sky-100 sm:max-w-xl">
                  Choose a pharmacy or create a new one, then capture stock, prescriptions
                  and competitor activity in one premium, guided flow.
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-sky-100/80 sm:mt-0">
              <Check className="h-4 w-4" />
              <span>Step 1 · Create visit</span>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Main content */}
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "existing" | "new")}
          className="w-full dark:bg-slate-900 bg-white rounded-2xl"
        >
          <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl dark:bg-slate-900 bg-white  p-1">
            <TabsTrigger
              value="existing"
              className="rounded-2xl data-[state=active]:bg-blue-900 data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-50"
            >
              <MapPinHouse className="mr-1.5 h-4 w-4" />
              Assigned pharmacy
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-2xl py-4 data-[state=active]:bg-blue-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-50"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New pharmacy
            </TabsTrigger>
          </TabsList>

          {/* Existing pharmacy tab */}
          <TabsContent value="existing" className="space-y-4">
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Choose assigned pharmacy
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Pick a pharmacy you are assigned to and set the visit objective.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-700 dark:text-slate-200">
                    Pharmacy
                  </Label>
                  <select
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                  >
                    {pharmacies.length === 0 && (
                      <option value="">No assigned pharmacies yet</option>
                    )}
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} • {p.region}
                        {p.subRegion ? ` / ${p.subRegion}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                    <Target className="h-3.5 w-3.5" />
                    Visit objective
                  </Label>
                  <select
                    value={existingObjective}
                    onChange={(e) => setExistingObjective(e.target.value as Objective)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                  >
                    {VISIT_OBJECTIVES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    GPS is captured automatically when you start the visit.
                  </p>
                  <Button
                    size="lg"
                    className="min-w-[160px] rounded-2xl cta-gradient"
                    disabled={existingLoading || !selectedPharmacyId}
                    onClick={handleStartExisting}
                  >
                    {existingLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Start visit
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New pharmacy tab */}
          <TabsContent value="new" className="space-y-4">
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  New pharmacy & visit
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Capture the core pharmacy details once, then go straight into the
                  product audit flow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNew} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pharmacy name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. Salama Chemist"
                      className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region *</Label>
                      <select
                        id="region"
                        name="region"
                        required
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
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
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationText">Location (typed by MR)</Label>
                    <Input
                      id="locationText"
                      name="locationText"
                      placeholder="Estate, street or landmark"
                      className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="procurementName">Procurement staff name</Label>
                      <Input
                        id="procurementName"
                        name="procurementName"
                        placeholder="Name"
                        className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="procurementContact">Procurement contact</Label>
                      <Input
                        id="procurementContact"
                        name="procurementContact"
                        placeholder="Phone or email"
                        className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="avgAttendantsPerDay">
                        How many people attended per day (average)
                      </Label>
                      <Input
                        id="avgAttendantsPerDay"
                        name="avgAttendantsPerDay"
                        type="number"
                        min={0}
                        placeholder="e.g. 50"
                        className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
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
                        className="h-11 rounded-2xl border-slate-200 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objective">Objective *</Label>
                    <select
                      id="objective"
                      name="objective"
                      required
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value as Objective)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/60 focus:border-transparent focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    >
                      {VISIT_OBJECTIVES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      After this step you&apos;ll add audit metrics, products, prescriptions and
                      competitor activity.
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      className="min-w-[180px] rounded-2xl cta-gradient"
                      disabled={newLoading}
                    >
                      {newLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating visit…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Create & start visit
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

