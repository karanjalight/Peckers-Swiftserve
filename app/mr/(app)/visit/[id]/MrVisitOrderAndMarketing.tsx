"use client";

import { useState, useEffect } from "react";
import {
  getMrOrderForVisit,
  getMrVisitMarketing,
  getVisitAudits,
  upsertMrOrder,
  upsertMrVisitMarketing,
} from "@/app/mr/actions";
import { MR_DISTRIBUTORS } from "@/lib/mr/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Megaphone, ShoppingCart } from "lucide-react";

type ProductAuditRow = {
  id: string;
  product_id: string;
  quantity_in_stock?: number | null;
  quantity_sold_good_month?: number | null;
  price_per_pack?: number | null;
  days_oos?: number | null;
  mr_products?: { id: string; name: string } | { id: string; name: string }[] | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  quantity_ordered: number;
  bonus_quantity: number;
  unit_price?: number | null;
  mr_products?: { id: string; name: string } | { id: string; name: string }[] | null;
};

export function MrVisitOrderAndMarketing({
  visitId,
  pharmacyId,
  initialProcurementName,
  initialProcurementContact,
}: {
  visitId: string;
  pharmacyId: string;
  initialProcurementName?: string | null;
  initialProcurementContact?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [distributorName, setDistributorName] = useState<string>(MR_DISTRIBUTORS[0]);
  const [distributorOther, setDistributorOther] = useState("");
  const [telesalesName, setTelesalesName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [procurementName, setProcurementName] = useState(initialProcurementName ?? "");
  const [procurementContact, setProcurementContact] = useState(initialProcurementContact ?? "");

  const [orderLines, setOrderLines] = useState<Array<{ productId: string; productName: string; quantityOrdered: number; bonusQuantity: number; unitPrice: number | null }>>([]);

  const [wobblers, setWobblers] = useState(0);
  const [posters, setPosters] = useState(0);
  const [shelfTalkers, setShelfTalkers] = useState(0);
  const [flyers, setFlyers] = useState(0);
  const [otherActivity, setOtherActivity] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [nextVisitNotes, setNextVisitNotes] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const [orderRes, marketingRes, auditsRes] = await Promise.all([
        getMrOrderForVisit(visitId),
        getMrVisitMarketing(visitId),
        getVisitAudits(visitId),
      ]);

      if (orderRes.success && orderRes.order) {
        const o = orderRes.order as { distributor_name?: string | null; distributor_other?: string | null; telesales_name?: string | null; special_instructions?: string | null; procurement_name?: string | null; procurement_contact?: string | null };
        setDistributorName(o.distributor_name ?? MR_DISTRIBUTORS[0]);
        setDistributorOther(o.distributor_other ?? "");
        setTelesalesName(o.telesales_name ?? "");
        setSpecialInstructions(o.special_instructions ?? "");
        setProcurementName(o.procurement_name ?? "");
        setProcurementContact(o.procurement_contact ?? "");
      } else {
        setProcurementName(initialProcurementName ?? "");
        setProcurementContact(initialProcurementContact ?? "");
      }

      const items = (orderRes.items ?? []) as OrderItemRow[];
      const audits = (auditsRes.data?.productAudits ?? []) as ProductAuditRow[];

      const productMap = new Map<string, { name: string; price: number | null }>();
      for (const a of audits) {
        const mp = Array.isArray(a.mr_products) ? a.mr_products[0] : a.mr_products;
        const name = mp?.name ?? "Product";
        productMap.set(a.product_id, { name, price: a.price_per_pack ?? null });
      }

      const lineMap = new Map<string, { qty: number; bonus: number; price: number | null }>();
      for (const item of items) {
        lineMap.set(item.product_id, {
          qty: item.quantity_ordered,
          bonus: item.bonus_quantity,
          price: item.unit_price ?? null,
        });
      }

      let combined: Array<{ productId: string; productName: string; quantityOrdered: number; bonusQuantity: number; unitPrice: number | null }>;
      if (audits.length > 0) {
        combined = audits.map((a) => {
          const info = productMap.get(a.product_id) ?? { name: "Product", price: null };
          const saved = lineMap.get(a.product_id);
          return {
            productId: a.product_id,
            productName: info.name,
            quantityOrdered: saved?.qty ?? 0,
            bonusQuantity: saved?.bonus ?? 0,
            unitPrice: saved?.price ?? a.price_per_pack ?? null,
          };
        });
      } else if (items.length > 0) {
        combined = items.map((item) => {
          const mp = Array.isArray(item.mr_products) ? item.mr_products[0] : item.mr_products;
          return {
            productId: item.product_id,
            productName: mp?.name ?? "Product",
            quantityOrdered: item.quantity_ordered,
            bonusQuantity: item.bonus_quantity,
            unitPrice: item.unit_price ?? null,
          };
        });
      } else {
        combined = [];
      }

      setOrderLines(combined);

      if (marketingRes.success && marketingRes.data) {
        const m = marketingRes.data as { wobblers?: number; posters?: number; shelf_talkers?: number; flyers?: number; other_activity?: string | null; next_visit_date?: string | null; next_visit_notes?: string | null; feedback_notes?: string | null };
        setWobblers(m.wobblers ?? 0);
        setPosters(m.posters ?? 0);
        setShelfTalkers(m.shelf_talkers ?? 0);
        setFlyers(m.flyers ?? 0);
        setOtherActivity(m.other_activity ?? "");
        setNextVisitDate(m.next_visit_date ?? "");
        setNextVisitNotes(m.next_visit_notes ?? "");
        setFeedbackNotes(m.feedback_notes ?? "");
      }

      setLoading(false);
    })();
  }, [visitId, initialProcurementName, initialProcurementContact]);

  const handleOrderQty = (productId: string, value: string) => {
    const n = parseInt(value, 10);
    setOrderLines((prev) =>
      prev.map((r) =>
        r.productId === productId ? { ...r, quantityOrdered: Number.isNaN(n) ? 0 : Math.max(0, n) } : r
      )
    );
  };

  const handleBonusQty = (productId: string, value: string) => {
    const n = parseInt(value, 10);
    setOrderLines((prev) =>
      prev.map((r) =>
        r.productId === productId ? { ...r, bonusQuantity: Number.isNaN(n) ? 0 : Math.max(0, n) } : r
      )
    );
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    setError(null);
    const res = await upsertMrOrder({
      visitId,
      pharmacyId,
      distributorName: distributorName === "Other" ? null : distributorName,
      distributorOther: distributorName === "Other" ? distributorOther : null,
      telesalesName: telesalesName || null,
      specialInstructions: specialInstructions || null,
      procurementName: procurementName || null,
      procurementContact: procurementContact || null,
      items: orderLines.map((l) => ({
        productId: l.productId,
        quantityOrdered: l.quantityOrdered,
        bonusQuantity: l.bonusQuantity,
        unitPrice: l.unitPrice,
      })),
    });
    if (!res.success) {
      setError(res.error ?? "Failed to save order");
      setSaving(false);
      return;
    }
    const mRes = await upsertMrVisitMarketing({
      visitId,
      wobblers,
      posters,
      shelfTalkers,
      flyers,
      otherActivity: otherActivity || null,
      nextVisitDate: nextVisitDate || null,
      nextVisitNotes: nextVisitNotes || null,
      feedbackNotes: feedbackNotes || null,
    });
    if (!mRes.success) setError(mRes.error ?? "Failed to save marketing");
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="orders" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700">
            <Megaphone className="h-4 w-4" />
            Marketing insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6 mt-0">
          {/* Order & distributor – top of Orders tab */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-50">
                <ShoppingCart className="h-4 w-4" />
                Order &amp; distributor
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                Capture order quantities and bonus per product. Select distributor and add special instructions. Enter 0 where no order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Distributor</Label>
                  <select
                    value={distributorName}
                    onChange={(e) => setDistributorName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  >
                    {MR_DISTRIBUTORS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {distributorName === "Other" && (
                  <div className="space-y-2">
                    <Label>Other distributor name</Label>
                    <Input
                      value={distributorOther}
                      onChange={(e) => setDistributorOther(e.target.value)}
                      placeholder="Type distributor"
                      className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Telesales name</Label>
                  <Input
                    value={telesalesName}
                    onChange={(e) => setTelesalesName(e.target.value)}
                    placeholder="e.g. Mary"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Procurement / contact name</Label>
                  <Input
                    value={procurementName}
                    onChange={(e) => setProcurementName(e.target.value)}
                    placeholder="e.g. Charity Nakoru"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Procurement contact</Label>
                  <Input
                    value={procurementContact}
                    onChange={(e) => setProcurementContact(e.target.value)}
                    placeholder="e.g. 0790967263"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Special instructions (delivery, etc.)</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="When to deliver, pack sizes..."
                  className="min-h-[80px] rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </CardContent>
          </Card>

          {/* Helper text + order lines at bottom of Orders tab */}
          <p className="text-sm text-slate-500">
            Complete the key products section above (stock levels for up to 10 products). Order lines will appear here so you can capture quantities and bonus.
          </p>

          {orderLines.length > 0 ? (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                  Order items (products the pharmacy will order)
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  All products with unique order lines. Enter quantity and bonus per product; use 0 where no order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                        <th className="px-3 py-2 text-left font-semibold">Product</th>
                        <th className="px-2 py-2 text-right font-semibold">Order qty</th>
                        <th className="px-2 py-2 text-right font-semibold">Bonus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line) => (
                        <tr key={line.productId} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">{line.productName}</td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={line.quantityOrdered}
                              onChange={(e) => handleOrderQty(line.productId, e.target.value)}
                              className="h-9 w-20 rounded-lg text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={line.bonusQuantity}
                              onChange={(e) => handleBonusQty(line.productId, e.target.value)}
                              className="h-9 w-20 rounded-lg text-right"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-50">
                <Megaphone className="h-4 w-4" />
                Marketing &amp; visit notes
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                Merchandise used at outlet, next visit date and feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Wobblers</Label>
                  <Input
                    type="number"
                    min={0}
                    value={wobblers}
                    onChange={(e) => setWobblers(parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Posters</Label>
                  <Input
                    type="number"
                    min={0}
                    value={posters}
                    onChange={(e) => setPosters(parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shelf talkers</Label>
                  <Input
                    type="number"
                    min={0}
                    value={shelfTalkers}
                    onChange={(e) => setShelfTalkers(parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Flyers</Label>
                  <Input
                    type="number"
                    min={0}
                    value={flyers}
                    onChange={(e) => setFlyers(parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Other marketing activity</Label>
                <Textarea
                  value={otherActivity}
                  onChange={(e) => setOtherActivity(e.target.value)}
                  placeholder="CPD session, product demo..."
                  className="min-h-[60px] rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Next visit date</Label>
                  <Input
                    type="date"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Next visit – what to do</Label>
                  <Input
                    value={nextVisitNotes}
                    onChange={(e) => setNextVisitNotes(e.target.value)}
                    placeholder="e.g. Ulgicid always in stock"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Feedback from outlet</Label>
                <Textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Concerns, competitor activity..."
                  className="min-h-[60px] rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handleSaveOrder}
        disabled={saving}
        className="rounded-full bg-blue-700 text-white hover:bg-blue-800"
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save order &amp; marketing
      </Button>
    </div>
  );
}
