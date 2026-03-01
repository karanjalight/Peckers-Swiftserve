import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { MrCreatePharmacyForm } from "./MrCreatePharmacyForm";
import { MrNewPharmacyCheckInForm } from "./MrNewPharmacyCheckInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MrPharmaciesPage() {
  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;
  const isMr = auth.profile.role === "MR";
  const isManagerOrAdmin =
    auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";

  if (isMr) {
    const { data: assignments } = await supabase
      .from("mr_pharmacy_assignments")
      .select(`
        pharmacy_id,
        mr_pharmacies (
          id,
          name,
          region,
          sub_region,
          location_text
        )
      `)
      .eq("mr_id", auth.user.id);

    const pharmacies = (assignments ?? [])
      .map((a: { mr_pharmacies: unknown }) => a.mr_pharmacies)
      .filter(Boolean) as {
      id: string;
      name: string;
      region: string;
      sub_region?: string;
      location_text?: string;
    }[];

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Pharmacies
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Select a pharmacy to start a visit, or add a new one and check in
            </p>
          </div>
          <MrNewPharmacyCheckInForm />
        </div>
        {pharmacies.length === 0 ? (
          <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
                <MapPin className="h-10 w-10 text-slate-600 dark:text-slate-300" />
              </div>
              <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
                No pharmacies assigned yet
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-slate-600 dark:text-slate-400">
                Start your first visit by adding a new pharmacy, or contact your
                manager to get assigned to pharmacies.
              </p>
              <MrNewPharmacyCheckInForm />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((p) => (
              <Link key={p.id} href={`/mr/pharmacies/${p.id}`}>
                <Card className="h-full border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                        <MapPin className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-tight text-slate-900 dark:text-white">
                          {p.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                          {p.region}
                          {p.sub_region ? ` • ${p.sub_region}` : ""}
                          {p.location_text ? ` • ${p.location_text}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      View details →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isManagerOrAdmin) {
    const { data: pharmacies } = await supabase
      .from("mr_pharmacies")
      .select("id, name, region, sub_region, location_text")
      .order("name");

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {auth.profile.role === "ADMIN" ? "All Pharmacies" : "My Pharmacies"}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Create pharmacies and assign MRs. Submitted visit data is read-only.
            </p>
          </div>
          <MrCreatePharmacyForm />
        </div>

        {!pharmacies?.length ? (
          <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-200 p-4 dark:bg-slate-700">
                <MapPin className="h-10 w-10 text-slate-600 dark:text-slate-300" />
              </div>
              <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
                No pharmacies yet
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-slate-600 dark:text-slate-400">
                Create your first pharmacy to get started. You can then assign MRs
                to each pharmacy.
              </p>
              <MrCreatePharmacyForm />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((p) => (
              <Link key={p.id} href={`/mr/pharmacies/${p.id}`}>
                <Card className="h-full border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-200 p-2 dark:bg-slate-700">
                        <MapPin className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-tight text-slate-900 dark:text-white">
                          {p.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                          {p.region}
                          {p.sub_region ? ` • ${p.sub_region}` : ""}
                          {p.location_text ? ` • ${p.location_text}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      View details →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  redirect("/mr");
}
