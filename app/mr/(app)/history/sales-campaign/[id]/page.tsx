import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { Button } from "@/components/ui/button";
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
import {
  ChevronLeft,
  Clock3,
  MapPin,
  Package,
  Megaphone,
  StickyNote,
  CalendarDays,
} from "lucide-react";

function objectiveLabel(obj: string | null | undefined) {
  if (obj === "SALES") return "Sales";
  if (obj === "CAMPAIGN") return "Campaign";
  return obj ?? "—";
}

export default async function MrSalesCampaignVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || typeof id !== "string") notFound();

  const auth = await getMrAuth();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;
  const role = auth.profile.role as "MR" | "MANAGER" | "ADMIN";
  const isMr = role === "MR";

  const { data: visit, error: visitErr } = await supabase
    .from("mr_visits")
    .select(
      `
      id,
      status,
      objective,
      check_in_time,
      check_out_time,
      visit_duration_minutes,
      mr_id,
      mr_pharmacies (name, region, sub_region),
      mr_profiles (full_name)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (visitErr || !visit) notFound();

  const obj = (visit as { objective?: string }).objective;
  if (obj !== "SALES" && obj !== "CAMPAIGN") {
    notFound();
  }

  if (isMr && (visit as { mr_id: string }).mr_id !== auth.user.id) {
    notFound();
  }

  const pharmacyRow = Array.isArray(visit.mr_pharmacies)
    ? visit.mr_pharmacies[0]
    : visit.mr_pharmacies;
  const mrRow = Array.isArray(visit.mr_profiles) ? visit.mr_profiles[0] : visit.mr_profiles;
  const pharmacyName = (pharmacyRow as { name?: string } | null)?.name ?? "Pharmacy";
  const region =
    [(pharmacyRow as { region?: string } | null)?.region, (pharmacyRow as { sub_region?: string | null } | null)?.sub_region]
      .filter(Boolean)
      .join(" · ") || "—";

  const { data: order } = await supabase
    .from("mr_orders")
    .select("*")
    .eq("visit_id", id)
    .maybeSingle();

  let orderItems: Array<{
    id: string;
    quantity_ordered: number;
    bonus_quantity: number;
    unit_price: number | null;
    mr_products: { id: string; name: string; sku: string | null } | { id: string; name: string; sku: string | null }[] | null;
  }> = [];

  if (order) {
    const { data: items } = await supabase
      .from("mr_order_items")
      .select("id, quantity_ordered, bonus_quantity, unit_price, mr_products (id, name, sku)")
      .eq("order_id", (order as { id: string }).id);
    orderItems = (items ?? []) as typeof orderItems;
  }

  const { data: marketing } = await supabase
    .from("mr_visit_marketing")
    .select("*")
    .eq("visit_id", id)
    .maybeSingle();

  const m = marketing as {
    wobblers?: number;
    posters?: number;
    shelf_talkers?: number;
    flyers?: number;
    other_activity?: string | null;
    next_visit_date?: string | null;
    next_visit_notes?: string | null;
    feedback_notes?: string | null;
  } | null;

  const matTotal = m
    ? (m.wobblers ?? 0) + (m.posters ?? 0) + (m.shelf_talkers ?? 0) + (m.flyers ?? 0)
    : 0;

  const orderRow = order as {
    status?: string;
    distributor_name?: string | null;
    distributor_other?: string | null;
    telesales_name?: string | null;
    special_instructions?: string | null;
    procurement_name?: string | null;
    procurement_contact?: string | null;
    order_date?: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit rounded-2xl" asChild>
          <Link href="/mr/history/sales-campaign" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back to sales &amp; campaign history
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-2xl" asChild>
            <Link href={`/mr/visit/${id}/campaign`}>
              <Megaphone className="mr-1.5 h-4 w-4" />
              Open campaign workflow
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-2xl" asChild>
            <Link href={`/mr/visit/${id}`}>Visit summary</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-6 text-white shadow-xl ring-1 ring-emerald-950/50 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/90">Sales &amp; campaign · read-only</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{pharmacyName}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-emerald-100/95">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <Megaphone className="h-3.5 w-3.5" />
            {objectiveLabel(obj)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <MapPin className="h-3.5 w-3.5" />
            {region}
          </span>
          {mrRow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
              MR: {(mrRow as { full_name?: string }).full_name ?? "—"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            {(visit as { status?: string }).status ?? "—"}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">Check-in</p>
            <p className="mt-1 text-lg font-semibold">
              {new Date((visit as { check_in_time: string }).check_in_time).toLocaleString()}
            </p>
          </div>
          {(visit as { check_out_time?: string | null }).check_out_time && (
            <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">Check-out</p>
              <p className="mt-1 text-lg font-semibold">
                {new Date((visit as { check_out_time: string }).check_out_time!).toLocaleString()}
              </p>
            </div>
          )}
          {(visit as { visit_duration_minutes?: number | null }).visit_duration_minutes != null && (
            <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">Duration</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold">
                <Clock3 className="h-5 w-5 opacity-80" />
                {Math.round((visit as { visit_duration_minutes: number }).visit_duration_minutes)} min
              </p>
            </div>
          )}
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Package className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            Order (mr_orders / mr_order_items)
          </CardTitle>
          <CardDescription>
            Distributor-facing order captured during this visit. One order row per visit when recorded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!orderRow ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No order has been saved for this visit yet.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailKV label="Status" value={orderRow.status ?? "—"} />
                <DetailKV label="Order date" value={orderRow.order_date ?? "—"} />
                <DetailKV
                  label="Distributor"
                  value={
                    orderRow.distributor_name === "Other" && orderRow.distributor_other
                      ? `Other (${orderRow.distributor_other})`
                      : orderRow.distributor_name ?? "—"
                  }
                />
                <DetailKV label="Telesales" value={orderRow.telesales_name ?? "—"} />
                <DetailKV label="Procurement" value={orderRow.procurement_name ?? "—"} />
                <DetailKV label="Procurement contact" value={orderRow.procurement_contact ?? "—"} />
              </div>
              {orderRow.special_instructions && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Special instructions
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                    {orderRow.special_instructions}
                  </p>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-slate-900 dark:text-white">Product</TableHead>
                      <TableHead className="text-slate-900 dark:text-white">SKU</TableHead>
                      <TableHead className="text-right text-slate-900 dark:text-white">Qty</TableHead>
                      <TableHead className="text-right text-slate-900 dark:text-white">Bonus</TableHead>
                      <TableHead className="text-right text-slate-900 dark:text-white">Unit price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                          No line items yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orderItems.map((row) => {
                        const prod = Array.isArray(row.mr_products) ? row.mr_products[0] : row.mr_products;
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{prod?.name ?? "—"}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">{prod?.sku ?? "—"}</TableCell>
                            <TableCell className="text-right">{row.quantity_ordered}</TableCell>
                            <TableCell className="text-right">{row.bonus_quantity}</TableCell>
                            <TableCell className="text-right">
                              {row.unit_price != null ? Number(row.unit_price).toFixed(2) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <StickyNote className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            Merchandising (mr_visit_marketing)
          </CardTitle>
          <CardDescription>Point-of-sale materials and follow-up notes tied to this visit.</CardDescription>
        </CardHeader>
        <CardContent>
          {!m ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No merchandising record for this visit.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailKV label="Wobblers" value={String(m.wobblers ?? 0)} />
                <DetailKV label="Posters" value={String(m.posters ?? 0)} />
                <DetailKV label="Shelf talkers" value={String(m.shelf_talkers ?? 0)} />
                <DetailKV label="Flyers" value={String(m.flyers ?? 0)} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total pieces recorded: <span className="font-semibold text-slate-900 dark:text-white">{matTotal}</span>
              </p>
              {m.other_activity && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other activity</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.other_activity}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {m.next_visit_date && (
                  <div className="flex gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Next visit</p>
                      <p className="text-sm font-medium">{m.next_visit_date}</p>
                      {m.next_visit_notes && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{m.next_visit_notes}</p>
                      )}
                    </div>
                  </div>
                )}
                {m.feedback_notes && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Feedback</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{m.feedback_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailKV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
