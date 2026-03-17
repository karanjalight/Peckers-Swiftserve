import { redirect, notFound } from "next/navigation";
import { getMrAuth } from "@/lib/mr/supabase-server";
import Link from "next/link";
import { MrCheckInButton } from "./MrCheckInButton";
import { MrAssignReps } from "./MrAssignReps";
import { MrEditPharmacyForm } from "../MrEditPharmacyForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, TrendingDown } from "lucide-react";

type VisitRow = {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  visit_duration_minutes: number | null;
  objective: string;
  status: string;
  mr_profiles?: { full_name: string } | { full_name: string }[] | null;
};

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

    const { data: visits } = await supabase
      .from("mr_visits")
      .select(
        "id, check_in_time, check_out_time, visit_duration_minutes, objective, status"
      )
      .eq("mr_id", auth.user.id)
      .eq("pharmacy_id", id)
      .order("check_in_time", { ascending: false })
      .limit(20);

    const visitRows = (visits ?? []) as VisitRow[];

    const visitIds = visitRows.map((v) => v.id);
    let lostSalesRows: {
      id: string;
      productName: string;
      daysOos: number;
      qtySoldGoodMonth: number;
      pricePerPack: number | null;
      volumeLoss: number;
      revenueLoss: number;
    }[] = [];

    if (visitIds.length > 0) {
      const { data: productAudits } = await supabase
        .from("mr_product_audits")
        .select(
          "id, visit_id, days_oos, quantity_sold_good_month, price_per_pack, mr_products(name)"
        )
        .not("days_oos", "is", null)
        .gte("days_oos", 0)
        .in("visit_id", visitIds);

      const list = (productAudits ?? []) as Array<{
        id: string;
        days_oos: number | null;
        quantity_sold_good_month: number | null;
        price_per_pack: number | null;
        mr_products: { name: string } | { name: string }[] | null;
      }>;

      lostSalesRows = list
        .map((r) => {
          const daysOos = Number(r.days_oos) || 0;
          const qtySoldGoodMonth = Number(r.quantity_sold_good_month) || 0;
          const pricePerPack =
            r.price_per_pack != null ? Number(r.price_per_pack) : null;
          const product = r.mr_products;
          const productName = (Array.isArray(product) ? product[0] : product)?.name ?? "—";
          const volumeLoss = (daysOos / 30) * qtySoldGoodMonth;
          const revenueLoss = pricePerPack != null ? volumeLoss * pricePerPack : 0;
          return {
            id: r.id,
            productName,
            daysOos,
            qtySoldGoodMonth,
            pricePerPack,
            volumeLoss,
            revenueLoss,
          };
        })
        .filter((r) => r.daysOos > 0 && r.qtySoldGoodMonth > 0)
        .sort((a, b) => b.revenueLoss - a.revenueLoss);
    }

    const totalLostSales = lostSalesRows.reduce(
      (sum, r) => sum + (r.revenueLoss || 0),
      0
    );
    const latestVisit = visitRows[0] ?? null;
    const lastVisit = latestVisit?.check_in_time
      ? new Date(latestVisit.check_in_time)
      : null;

    return (
      <div className="space-y-8 sm:space-y-10">
        {/* Back + premium hero */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mr/pharmacies" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Pharmacies
            </Link>
          </Button>

          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 shadow-xl ring-1 ring-blue-800/60">
            <div className="px-5 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">
                    {pharmacy.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-blue-100/90">
                    <span>
                      {pharmacy.region}
                      {pharmacy.sub_region ? ` • ${pharmacy.sub_region}` : ""}
                    </span>
                    {pharmacy.location_text && (
                      <span className="text-blue-100/80">
                        · {pharmacy.location_text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
                    Overview of all visits, lost sales and field activity for this pharmacy.
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <MrEditPharmacyForm
                    pharmacyId={id}
                    initial={{
                      name: pharmacy.name,
                      region: pharmacy.region,
                      sub_region: pharmacy.sub_region,
                      location_text: pharmacy.location_text,
                      procurement_name: pharmacy.procurement_name,
                      procurement_contact: pharmacy.procurement_contact,
                      avg_attendants_per_day: pharmacy.avg_attendants_per_day,
                      avg_order_value: pharmacy.avg_order_value,
                    }}
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-blue-100/80">
                    <span className="inline-flex items-center rounded-full bg-blue-800/60 px-3 py-1 font-medium">
                      {visitRows.length} visit{visitRows.length === 1 ? "" : "s"}
                    </span>
                    {lastVisit && (
                      <span className="inline-flex items-center rounded-full bg-blue-800/40 px-3 py-1">
                        Last visit:{" "}
                        {lastVisit.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-blue-800/40 px-3 py-1">
                      Lost sales: KES {Math.round(totalLostSales).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy details */}
        <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Pharmacy profile
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Region, location, procurement contacts and commercial profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Region
              </dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                {pharmacy.region}
                {pharmacy.sub_region && ` • ${pharmacy.sub_region}`}
              </dd>
            </div>
            {pharmacy.location_text && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Location
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {pharmacy.location_text}
                </dd>
              </div>
            )}
            {pharmacy.procurement_name && (
              <div className="sm:col-span-2 lg:col-span-1">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Procurement contact
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {pharmacy.procurement_name}
                  {pharmacy.procurement_contact &&
                    ` • ${pharmacy.procurement_contact}`}
                </dd>
              </div>
            )}
            {pharmacy.avg_attendants_per_day != null && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  People attended per day
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {pharmacy.avg_attendants_per_day}
                </dd>
              </div>
            )}
            {pharmacy.avg_order_value != null && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Basket value
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  KES {pharmacy.avg_order_value.toLocaleString()}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest visit snapshot */}
        {latestVisit && (
          <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Latest visit snapshot
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Quick view of your most recent visit. Open it to see full product audits, prescriptions and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Visit ID
                </p>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">
                  {latestVisit.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Objective &amp; status
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {latestVisit.objective} ·{" "}
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {latestVisit.status}
                  </span>
                </p>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div>
                  <span className="font-semibold">Check-in: </span>
                  {latestVisit.check_in_time
                    ? new Date(latestVisit.check_in_time).toLocaleString()
                    : "—"}
                </div>
                {latestVisit.check_out_time && (
                  <div>
                    <span className="font-semibold">Check-out: </span>
                    {new Date(latestVisit.check_out_time).toLocaleString()}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Duration: </span>
                  {latestVisit.visit_duration_minutes != null
                    ? `${Math.round(latestVisit.visit_duration_minutes)} min`
                    : "—"}
                </div>
              </div>
              <div className="flex shrink-0 items-center sm:items-end">
                <Button
                  asChild
                  className="rounded-full px-5 font-semibold"
                >
                  <Link href={`/mr/visit/${latestVisit.id}`}>
                    View full visit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base dark:text-slate-200 text-slate-900 dark:text-white">Start Visit</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-200">
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

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Recent visits to this pharmacy
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Last 20 visits you have done here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!visitRows.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No visits recorded for this pharmacy yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                      <TableHead className="text-xs font-semibold">Visit</TableHead>
                      <TableHead className="text-xs font-semibold">
                        Check-in
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Duration (min)
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Objective
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitRows.map((v) => {
                      const checkIn = v.check_in_time
                        ? new Date(v.check_in_time)
                        : null;
                      const label = checkIn
                        ? `${checkIn.toLocaleDateString()} ${checkIn.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "—";
                      return (
                        <TableRow key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <TableCell className="text-xs font-mono">
                            <Link
                              href={`/mr/visit/${v.id}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {v.id.slice(0, 8).toUpperCase()}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs">{label}</TableCell>
                          <TableCell className="text-xs">
                            {v.visit_duration_minutes ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs uppercase">
                            {v.objective}
                          </TableCell>
                          <TableCell className="text-xs">{v.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <TrendingDown className="h-4 w-4" />
              Lost sales from out-of-stock
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Based on days out of stock and quantity sold in a good month for products you audited here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!lostSalesRows.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No lost-sales data yet. Capture days out of stock and quantity sold in a
                good month in your product audits for this pharmacy.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                      <TableHead className="text-xs font-semibold">
                        Product
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Days OOS
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Sold (good mo)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Price/pack (KES)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Volume loss
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Revenue loss (KES)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lostSalesRows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <TableCell className="text-xs font-medium">
                          {r.productName}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.daysOos}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.qtySoldGoodMonth}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.pricePerPack != null
                            ? r.pricePerPack.toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {Math.round(r.volumeLoss).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-amber-700 dark:text-amber-400">
                          {Math.round(r.revenueLoss).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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

    const { data: visits } = await supabase
      .from("mr_visits")
      .select(
        "id, check_in_time, check_out_time, visit_duration_minutes, objective, status, mr_profiles(full_name)"
      )
      .eq("pharmacy_id", id)
      .order("check_in_time", { ascending: false })
      .limit(50);

    const visitRows = (visits ?? []) as VisitRow[];

    const visitIds = visitRows.map((v) => v.id);
    let lostSalesRows: {
      id: string;
      productName: string;
      daysOos: number;
      qtySoldGoodMonth: number;
      pricePerPack: number | null;
      volumeLoss: number;
      revenueLoss: number;
    }[] = [];

    if (visitIds.length > 0) {
      const { data: productAudits } = await supabase
        .from("mr_product_audits")
        .select(
          "id, visit_id, days_oos, quantity_sold_good_month, price_per_pack, mr_products(name)"
        )
        .not("days_oos", "is", null)
        .gte("days_oos", 0)
        .in("visit_id", visitIds);

      const list = (productAudits ?? []) as Array<{
        id: string;
        days_oos: number | null;
        quantity_sold_good_month: number | null;
        price_per_pack: number | null;
        mr_products: { name: string } | { name: string }[] | null;
      }>;

      lostSalesRows = list
        .map((r) => {
          const daysOos = Number(r.days_oos) || 0;
          const qtySoldGoodMonth = Number(r.quantity_sold_good_month) || 0;
          const pricePerPack =
            r.price_per_pack != null ? Number(r.price_per_pack) : null;
          const product = r.mr_products;
          const productName = (Array.isArray(product) ? product[0] : product)?.name ?? "—";
          const volumeLoss = (daysOos / 30) * qtySoldGoodMonth;
          const revenueLoss = pricePerPack != null ? volumeLoss * pricePerPack : 0;
          return {
            id: r.id,
            productName,
            daysOos,
            qtySoldGoodMonth,
            pricePerPack,
            volumeLoss,
            revenueLoss,
          };
        })
        .filter((r) => r.daysOos > 0 && r.qtySoldGoodMonth > 0)
        .sort((a, b) => b.revenueLoss - a.revenueLoss);
    }

    const totalLostSales = lostSalesRows.reduce(
      (sum, r) => sum + (r.revenueLoss || 0),
      0
    );
    const latestVisit = visitRows[0] ?? null;
    const lastVisit = latestVisit?.check_in_time
      ? new Date(latestVisit.check_in_time)
      : null;

    const assignedIds = new Set(assignedReps.map((r) => r.id));
    const availableReps = (allMrProfiles ?? []).filter(
      (p: { id: string }) => !assignedIds.has(p.id)
    );

    return (
      <div className="space-y-8 sm:space-y-10">
        {/* Back + premium hero */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mr/pharmacies" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Pharmacies
            </Link>
          </Button>

          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 shadow-xl ring-1 ring-blue-800/60">
            <div className="px-5 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">
                    {pharmacy.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-blue-100/90">
                    <span>
                      {pharmacy.region}
                      {pharmacy.sub_region ? ` • ${pharmacy.sub_region}` : ""}
                    </span>
                    {pharmacy.location_text && (
                      <span className="text-blue-100/80">
                        · {pharmacy.location_text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 max-w-xl">
                    Assignment overview, visit history and lost-sales intelligence for this pharmacy.
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <MrEditPharmacyForm
                    pharmacyId={id}
                    initial={{
                      name: pharmacy.name,
                      region: pharmacy.region,
                      sub_region: pharmacy.sub_region,
                      location_text: pharmacy.location_text,
                      procurement_name: pharmacy.procurement_name,
                      procurement_contact: pharmacy.procurement_contact,
                      avg_attendants_per_day: pharmacy.avg_attendants_per_day,
                      avg_order_value: pharmacy.avg_order_value,
                    }}
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-blue-100/80">
                    <span className="inline-flex items-center rounded-full bg-blue-800/60 px-3 py-1 font-medium">
                      {visitRows.length} visit{visitRows.length === 1 ? "" : "s"}
                    </span>
                    {lastVisit && (
                      <span className="inline-flex items-center rounded-full bg-blue-800/40 px-3 py-1">
                        Last visit:{" "}
                        {lastVisit.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-blue-800/40 px-3 py-1">
                      Lost sales: KES {Math.round(totalLostSales).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy details + reps */}
        <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Pharmacy profile
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Region, location, procurement contacts and commercial profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Region
                </dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {pharmacy.region}
                  {pharmacy.sub_region ? ` • ${pharmacy.sub_region}` : ""}
                </dd>
              </div>
              {pharmacy.location_text && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {pharmacy.location_text}
                  </dd>
                </div>
              )}
              {pharmacy.procurement_name && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Procurement contact
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {pharmacy.procurement_name}
                    {pharmacy.procurement_contact
                      ? ` • ${pharmacy.procurement_contact}`
                      : ""}
                  </dd>
                </div>
              )}
              {pharmacy.avg_attendants_per_day != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    People attended per day
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {pharmacy.avg_attendants_per_day}
                  </dd>
                </div>
              )}
              {pharmacy.avg_order_value != null && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Average order value
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    KES {Number(pharmacy.avg_order_value).toLocaleString()}
                  </dd>
                </div>
              )}
            </div>
            <MrAssignReps
              pharmacyId={id}
              assignedReps={assignedReps}
              availableReps={availableReps}
            />
          </CardContent>
        </Card>

        {/* Latest visit snapshot */}
        {latestVisit && (
          <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Latest visit snapshot
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Key details for the most recent visit. Open it to see full audits and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Visit ID
                </p>
                <p className="text-sm font-mono text-slate-900 dark:text-slate-100">
                  {latestVisit.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Objective &amp; status
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {latestVisit.objective} ·{" "}
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {latestVisit.status}
                  </span>
                </p>
              </div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div>
                  <span className="font-semibold">Check-in: </span>
                  {latestVisit.check_in_time
                    ? new Date(latestVisit.check_in_time).toLocaleString()
                    : "—"}
                </div>
                {latestVisit.check_out_time && (
                  <div>
                    <span className="font-semibold">Check-out: </span>
                    {new Date(latestVisit.check_out_time).toLocaleString()}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Duration: </span>
                  {latestVisit.visit_duration_minutes != null
                    ? `${Math.round(latestVisit.visit_duration_minutes)} min`
                    : "—"}
                </div>
              </div>
              <div className="flex shrink-0 items-center sm:items-end">
                <Button
                  asChild
                  className="rounded-full px-5 font-semibold"
                >
                  <Link href={`/mr/visit/${latestVisit.id}`}>
                    View full visit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Visits to this pharmacy
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Last 50 visits submitted here, with MR names.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!visitRows.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No visits recorded for this pharmacy yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                      <TableHead className="text-xs font-semibold">Visit</TableHead>
                      <TableHead className="text-xs font-semibold">
                        MR
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Check-in
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Duration (min)
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Objective
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitRows.map((v) => {
                      const checkIn = v.check_in_time
                        ? new Date(v.check_in_time)
                        : null;
                      const label = checkIn
                        ? `${checkIn.toLocaleDateString()} ${checkIn.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "—";
                      const mrRaw = v.mr_profiles;
                      const mr =
                        (Array.isArray(mrRaw) ? mrRaw[0] : mrRaw)?.full_name ?? "—";
                      return (
                        <TableRow key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <TableCell className="text-xs font-mono">
                            <Link
                              href={`/mr/visit/${v.id}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {v.id.slice(0, 8).toUpperCase()}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs">{mr}</TableCell>
                          <TableCell className="text-xs">{label}</TableCell>
                          <TableCell className="text-xs">
                            {v.visit_duration_minutes ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs uppercase">
                            {v.objective}
                          </TableCell>
                          <TableCell className="text-xs">{v.status}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
              <TrendingDown className="h-4 w-4" />
              Lost sales from out-of-stock
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Based on days out of stock and quantity sold in a good month for products audited in visits to this pharmacy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!lostSalesRows.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No lost-sales data yet. Ensure product audits capture days out of stock and
                quantity sold in a good month.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                      <TableHead className="text-xs font-semibold">
                        Product
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Days OOS
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Sold (good mo)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Price/pack (KES)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Volume loss
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Revenue loss (KES)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lostSalesRows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        <TableCell className="text-xs font-medium">
                          {r.productName}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.daysOos}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.qtySoldGoodMonth}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {r.pricePerPack != null
                            ? r.pricePerPack.toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {Math.round(r.volumeLoss).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-amber-700 dark:text-amber-400">
                          {Math.round(r.revenueLoss).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect("/mr");
}

