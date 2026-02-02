import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrCheckInButton } from "./MrCheckInButton";
import { MrAssignReps } from "./MrAssignReps";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function MrPharmacyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;
  const isMr = auth.profile.role === "MR";
  const isManagerOrAdmin =
    auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";

  if (isMr) {
    const { data: assignment } = await supabase
      .from("mr_pharmacy_assignments")
      .select(`
        pharmacy_id,
        mr_pharmacies (
          id,
          name,
          region,
          sub_region,
          location_text,
          procurement_name,
          procurement_contact,
          avg_attendants_per_day,
          avg_order_value
        )
      `)
      .eq("mr_id", auth.user.id)
      .eq("pharmacy_id", id)
      .single();

    if (!assignment?.mr_pharmacies) {
      notFound();
    }

    const phRaw = assignment.mr_pharmacies;
    const pharmacy = (Array.isArray(phRaw) ? phRaw[0] : phRaw) as {
      id: string;
      name: string;
      region: string;
      sub_region?: string;
      location_text?: string;
      procurement_name?: string;
      procurement_contact?: string;
      avg_attendants_per_day?: number | null;
      avg_order_value?: number | null;
    };

    const { data: openVisit } = await supabase
      .from("mr_visits")
      .select("id")
      .eq("mr_id", auth.user.id)
      .eq("pharmacy_id", id)
      .eq("status", "OPEN")
      .single();

    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mr/pharmacies" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Pharmacies
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {pharmacy.name}
          </h1>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Pharmacy Details</CardTitle>
            <CardDescription>Region, location, and contact info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Region
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {pharmacy.region}
                  {pharmacy.sub_region && ` • ${pharmacy.sub_region}`}
                </dd>
              </div>
              {pharmacy.location_text && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.location_text}
                  </dd>
                </div>
              )}
              {pharmacy.procurement_name && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Procurement Contact
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.procurement_name}
                    {pharmacy.procurement_contact &&
                      ` • ${pharmacy.procurement_contact}`}
                  </dd>
                </div>
              )}
              {pharmacy.avg_attendants_per_day != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    People attended per day
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.avg_attendants_per_day}
                  </dd>
                </div>
              )}
              {pharmacy.avg_order_value != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Average order value
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    KES {pharmacy.avg_order_value.toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Start Visit</CardTitle>
            <CardDescription>
              Check in to record audits, notes, and prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MrCheckInButton
              pharmacyId={pharmacy.id}
              hasOpenVisit={!!openVisit}
              openVisitId={openVisit?.id}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isManagerOrAdmin) {
    const { data: pharmacy } = await supabase
      .from("mr_pharmacies")
      .select("id, name, region, sub_region, location_text, procurement_name, procurement_contact, avg_attendants_per_day, avg_order_value")
      .eq("id", id)
      .single();

    if (!pharmacy) notFound();

    const { data: assignments } = await supabase
      .from("mr_pharmacy_assignments")
      .select("mr_id, mr_profiles!mr_id(id, full_name)")
      .eq("pharmacy_id", id);

    const assignedReps = (assignments ?? [])
      .map((a: { mr_id: string; mr_profiles: { id: string; full_name: string } | { id: string; full_name: string }[] | null }) => {
        const profile = Array.isArray(a.mr_profiles) ? a.mr_profiles[0] : a.mr_profiles;
        return profile ? { id: profile.id, full_name: profile.full_name } : null;
      })
      .filter(Boolean) as { id: string; full_name: string }[];

    const { data: allMrProfiles } = await supabase
      .from("mr_profiles")
      .select("id, full_name")
      .eq("role", "MR");

    const assignedIds = new Set(assignedReps.map((r) => r.id));
    const availableReps = (allMrProfiles ?? []).filter(
      (p: { id: string }) => !assignedIds.has(p.id)
    );

    return (
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mr/pharmacies" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Pharmacies
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {pharmacy.name}
          </h1>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Pharmacy Details</CardTitle>
            <CardDescription>Region, location, and contact info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Region
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {pharmacy.region}
                  {pharmacy.sub_region ? ` • ${pharmacy.sub_region}` : ""}
                </dd>
              </div>
              {pharmacy.location_text && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.location_text}
                  </dd>
                </div>
              )}
              {pharmacy.procurement_name && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Procurement Contact
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.procurement_name}
                    {pharmacy.procurement_contact
                      ? ` • ${pharmacy.procurement_contact}`
                      : ""}
                  </dd>
                </div>
              )}
              {pharmacy.avg_attendants_per_day != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    People attended per day
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {pharmacy.avg_attendants_per_day}
                  </dd>
                </div>
              )}
              {pharmacy.avg_order_value != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Average order value
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    KES {Number(pharmacy.avg_order_value).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <MrAssignReps
          pharmacyId={id}
          assignedReps={assignedReps}
          availableReps={availableReps}
        />
      </div>
    );
  }

  redirect("/mr");
}

