import { redirect } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MapPin, Building2, Package, ClipboardList, Plus } from "lucide-react";
import { MrCreatePharmacyForm } from "./MrCreatePharmacyForm";
import { MrNewPharmacyCheckInForm } from "./MrNewPharmacyCheckInForm";
import { MrPharmaciesTable } from "./MrPharmaciesTable";
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
          location_text,
          procurement_name,
          procurement_contact,
          created_at,
          avg_order_value
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
      procurement_name?: string | null;
      procurement_contact?: string | null;
      created_at?: string | null;
      avg_order_value?: number | null;
    }[];

    const sortedPharmacies = [...pharmacies].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    // Compute lost sales per pharmacy for this MR based on product audits
    const { data: mrVisits } = await supabase
      .from("mr_visits")
      .select("id, pharmacy_id")
      .eq("mr_id", auth.user.id)
      .eq("status", "SUBMITTED");

    const visitIds = (mrVisits ?? []).map((v: { id: string }) => v.id);
    const lostSalesByPharmacy: Record<string, number> = {};
    if (visitIds.length > 0) {
      const { data: productAudits } = await supabase
        .from("mr_product_audits")
        .select("id, visit_id, days_oos, quantity_sold_good_month, price_per_pack")
        .not("days_oos", "is", null)
        .gte("days_oos", 0)
        .in("visit_id", visitIds);

      const visitToPharmacy = new Map(
        (mrVisits ?? []).map((v: { id: string; pharmacy_id: string }) => [v.id, v.pharmacy_id])
      );

      for (const r of productAudits ?? []) {
        const pa = r as {
          visit_id: string;
          days_oos: number | null;
          quantity_sold_good_month: number | null;
          price_per_pack: number | null;
        };
        const pharmacyId = visitToPharmacy.get(pa.visit_id);
        if (!pharmacyId) continue;
        const daysOos = Number(pa.days_oos) || 0;
        const qtySoldGoodMonth = Number(pa.quantity_sold_good_month) || 0;
        const pricePerPack =
          pa.price_per_pack != null ? Number(pa.price_per_pack) : null;
        if (daysOos <= 0 || qtySoldGoodMonth <= 0 || pricePerPack == null) continue;
        const volumeLoss = (daysOos / 30) * qtySoldGoodMonth;
        const revenueLoss = volumeLoss * pricePerPack;
        lostSalesByPharmacy[pharmacyId] =
          (lostSalesByPharmacy[pharmacyId] ?? 0) + revenueLoss;
      }
    }

    const enrichedPharmacies = sortedPharmacies.map((p) => ({
      ...p,
      lost_sales_revenue: lostSalesByPharmacy[p.id] ?? null,
    }));

    const totalPharmacies = enrichedPharmacies.length;
    const nairobiCount = enrichedPharmacies.filter((p) => p.region === "Nairobi").length;
    const highValue = enrichedPharmacies.filter(
      (p) => (p.avg_order_value ?? 0) >= 200000
    ).length;
    const withProcurementContact = enrichedPharmacies.filter(
      (p) => !!p.procurement_name || !!p.procurement_contact
    ).length;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                My Pharmacies
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                View and manage pharmacies you can visit.
              </p>
            </div>
            <div>
              <Button
                asChild
                className="gap-2 text-center flex items-center justify-center rounded-full py-4 px-10 bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
              >
                <Link href="/mr/visit/create">
                  <Plus className="h-4 w-4 text-white" />
                  Create Pharmacy
                </Link>
              </Button>
            </div>
            {/* <MrNewPharmacyCheckInForm /> */}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#0f1c4d] to-[#1e3a8a] text-white ">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                    Total Pharmacies
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{totalPharmacies}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-blue-100/90">
                All pharmacies assigned to you.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/60" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Nairobi
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{nairobiCount}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-sky-900/80">
                Pharmacies within Nairobi region.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/20" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
                    High Value
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{highValue}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Package className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-indigo-900/80">
                Basket value ≥ 200,000 KES.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#fef3c7] to-[#fffbeb] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-200/70" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                    With Contacts
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">
                    {withProcurementContact}
                  </CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-amber-900/80">
                Pharmacies with procurement contacts captured.
              </CardContent>
            </Card>
          </div>
        </div>

        {enrichedPharmacies.length === 0 ? (
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
          <MrPharmaciesTable pharmacies={enrichedPharmacies} canDelete={false} />
        )}
      </div>
    );
  }

  if (isManagerOrAdmin) {
    const { data: pharmacies } = await supabase
      .from("mr_pharmacies")
      .select(
        "id, name, region, sub_region, location_text, procurement_name, procurement_contact, created_at, avg_order_value"
      )
      .order("created_at", { ascending: false });

    const sortedPharmacies = (pharmacies ?? []) as {
      id: string;
      name: string;
      region: string;
      sub_region?: string | null;
      location_text?: string | null;
      procurement_name?: string | null;
      procurement_contact?: string | null;
      created_at?: string | null;
      avg_order_value?: number | null;
    }[];

    // Lost sales across all visits for these pharmacies
    const pharmacyIds = sortedPharmacies.map((p) => p.id);
    const lostSalesByPharmacy: Record<string, number> = {};
    if (pharmacyIds.length > 0) {
      const { data: visits } = await supabase
        .from("mr_visits")
        .select("id, pharmacy_id")
        .in("pharmacy_id", pharmacyIds)
        .eq("status", "SUBMITTED");

      const visitIds = (visits ?? []).map((v: { id: string }) => v.id);
      if (visitIds.length > 0) {
        const { data: productAudits } = await supabase
          .from("mr_product_audits")
          .select("id, visit_id, days_oos, quantity_sold_good_month, price_per_pack")
          .not("days_oos", "is", null)
          .gte("days_oos", 0)
          .in("visit_id", visitIds);

        const visitToPharmacy = new Map(
          (visits ?? []).map((v: { id: string; pharmacy_id: string }) => [
            v.id,
            v.pharmacy_id,
          ])
        );

        for (const r of productAudits ?? []) {
          const pa = r as {
            visit_id: string;
            days_oos: number | null;
            quantity_sold_good_month: number | null;
            price_per_pack: number | null;
          };
          const pharmacyId = visitToPharmacy.get(pa.visit_id);
          if (!pharmacyId) continue;
          const daysOos = Number(pa.days_oos) || 0;
          const qtySoldGoodMonth = Number(pa.quantity_sold_good_month) || 0;
          const pricePerPack =
            pa.price_per_pack != null ? Number(pa.price_per_pack) : null;
          if (daysOos <= 0 || qtySoldGoodMonth <= 0 || pricePerPack == null) continue;
          const volumeLoss = (daysOos / 30) * qtySoldGoodMonth;
          const revenueLoss = volumeLoss * pricePerPack;
          lostSalesByPharmacy[pharmacyId] =
            (lostSalesByPharmacy[pharmacyId] ?? 0) + revenueLoss;
        }
      }
    }

    const enrichedPharmacies = sortedPharmacies.map((p) => ({
      ...p,
      lost_sales_revenue: lostSalesByPharmacy[p.id] ?? null,
    }));

    const totalPharmacies = enrichedPharmacies.length;
    const nairobiCount = enrichedPharmacies.filter(
      (p) => p.region === "Nairobi"
    ).length;
    const highValue = enrichedPharmacies.filter(
      (p) => (p.avg_order_value ?? 0) >= 200000
    ).length;
    const withProcurementContact = enrichedPharmacies.filter(
      (p) => !!p.procurement_name || !!p.procurement_contact
    ).length;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {auth.profile.role === "ADMIN" ? "All Pharmacies" : "My Pharmacies"}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Create pharmacies, assign MRs, and oversee visit performance.
              </p>
            </div>
            <div>
            <Button
                asChild
                className="gap-2 text-center flex items-center justify-center rounded-full py-4 px-10 bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
              >
                <Link href="/mr/visit/create">
                  <Plus className="h-4 w-4 text-white" />o
                  Create Pharmacy
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#0f1c4d] to-[#1e3a8a] text-white ">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                    Total Pharmacies
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{totalPharmacies}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-blue-100/90">
                All pharmacies in the MR field.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/60" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Nairobi
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{nairobiCount}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-sky-900/80">
                Pharmacies in Nairobi region.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/20" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
                    High Value
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">{highValue}</CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <Package className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-indigo-900/80">
                Basket value ≥ 200,000 KES.
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl border border-slate-400 bg-gradient-to-br from-[#fef3c7] to-[#fffbeb] text-slate-900 ">
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-200/70" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                    With Contacts
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">
                    {withProcurementContact}
                  </CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 text-xs text-amber-900/80">
                Pharmacies with procurement details set.
              </CardContent>
            </Card>
          </div>
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
          <MrPharmaciesTable pharmacies={enrichedPharmacies} canDelete={true} />
        )}
      </div>
    );
  }

  redirect("/mr");
}
