"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getVisitAudits,
  getMrOrderForVisit,
  getMrVisitMarketing,
  upsertMrOrder,
  upsertMrVisitMarketing,
} from "@/app/mr/actions";
import { MR_DISTRIBUTORS } from "@/lib/mr/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Megaphone,
  Package,
  RefreshCw,
  ShoppingCart,
  Download,
  Share2,
} from "lucide-react";

type ProductAuditRow = {
  id: string;
  product_id: string;
  quantity_in_stock?: number | null;
  quantity_sold_good_month?: number | null;
  price_per_pack?: number | null;
  days_oos?: number | null;
  mr_products?: { id: string; name: string; price?: number | null } | { id: string; name: string; price?: number | null }[] | null;
};

type OrderItemRow = {
  product_id: string;
  quantity_ordered: number;
  bonus_quantity: number;
  unit_price?: number | null;
  mr_products?: { id: string; name: string } | { id: string; name: string }[] | null;
};

function daysStockCanLast(stock: number, qtyGoodMonth: number): number {
  if (!stock || !qtyGoodMonth) return 0;
  const daily = qtyGoodMonth / 30;
  if (!daily) return 0;
  return Math.round((stock / daily) * 10) / 10;
}

function estimatedLostRevenue(daysOos: number, qtyGoodMonth: number, pricePerPack: number): number {
  if (!daysOos || !qtyGoodMonth || !pricePerPack) return 0;
  const daily = qtyGoodMonth / 30;
  return Math.round(daily * daysOos * pricePerPack);
}

export function MrCampaignVisitClient({
  visitId,
  pharmacyId,
  pharmacy,
  mrName,
  mrContact,
}: {
  visitId: string;
  pharmacyId: string;
  pharmacy: { name: string; region: string; location?: string | null; procurement_name?: string | null; procurement_contact?: string | null };
  mrName: string;
  mrContact: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [audits, setAudits] = useState<ProductAuditRow[]>([]);
  const [orderLines, setOrderLines] = useState<Array<{ productId: string; productName: string; quantityOrdered: number; bonusQuantity: number; unitPrice: number | null }>>([]);

  const [distributorName, setDistributorName] = useState<string>(MR_DISTRIBUTORS[0]);
  const [distributorOther, setDistributorOther] = useState("");
  const [telesalesName, setTelesalesName] = useState("");
  const [procurementName, setProcurementName] = useState(pharmacy.procurement_name ?? "");
  const [procurementContact, setProcurementContact] = useState(pharmacy.procurement_contact ?? "");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [wobblers, setWobblers] = useState(0);
  const [posters, setPosters] = useState(0);
  const [shelfTalkers, setShelfTalkers] = useState(0);
  const [flyers, setFlyers] = useState(0);
  const [otherActivity, setOtherActivity] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [nextVisitNotes, setNextVisitNotes] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  useEffect(() => {
    setProcurementName(pharmacy.procurement_name ?? "");
    setProcurementContact(pharmacy.procurement_contact ?? "");
  }, [pharmacy.procurement_name, pharmacy.procurement_contact]);

  const loadData = async () => {
    setLoading(true);
    const [auditsRes, orderRes, marketingRes] = await Promise.all([
      getVisitAudits(visitId),
      getMrOrderForVisit(visitId),
      getMrVisitMarketing(visitId),
    ]);

    const productAudits = (auditsRes.data?.productAudits ?? []) as ProductAuditRow[];
    setAudits(productAudits);

    if (orderRes.success && orderRes.order) {
      const o = orderRes.order as { distributor_name?: string | null; distributor_other?: string | null; telesales_name?: string | null; special_instructions?: string | null; procurement_name?: string | null; procurement_contact?: string | null };
      setDistributorName(o.distributor_name ?? MR_DISTRIBUTORS[0]);
      setDistributorOther(o.distributor_other ?? "");
      setTelesalesName(o.telesales_name ?? "");
      setSpecialInstructions(o.special_instructions ?? "");
      setProcurementName(o.procurement_name ?? pharmacy.procurement_name ?? "");
      setProcurementContact(o.procurement_contact ?? pharmacy.procurement_contact ?? "");
    }

    const items = (orderRes.items ?? []) as OrderItemRow[];
    const lineMap = new Map<string, { qty: number; bonus: number; price: number | null }>();
    for (const item of items) {
      lineMap.set(item.product_id, { qty: item.quantity_ordered, bonus: item.bonus_quantity, price: item.unit_price ?? null });
    }

    const lines = productAudits.map((a) => {
      const mp = Array.isArray(a.mr_products) ? a.mr_products[0] : a.mr_products;
      const saved = lineMap.get(a.product_id);
      return {
        productId: a.product_id,
        productName: mp?.name ?? "Product",
        quantityOrdered: saved?.qty ?? 0,
        bonusQuantity: saved?.bonus ?? 0,
        unitPrice: saved?.price ?? a.price_per_pack ?? null,
      };
    });
    setOrderLines(lines);

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
  };

  useEffect(() => {
    loadData();
  }, [visitId]);

  const tableRows = useMemo(() => {
    return audits.map((a) => {
      const stock = a.quantity_in_stock ?? 0;
      const qtyGood = a.quantity_sold_good_month ?? 0;
      const price = a.price_per_pack ?? 0;
      const daysOos = a.days_oos ?? 0;
      const mp = Array.isArray(a.mr_products) ? a.mr_products[0] : a.mr_products;
      const productPrice = mp?.price ?? price;
      const line = orderLines.find((l) => l.productId === a.product_id);
      return {
        ...a,
        productName: mp?.name ?? "Product",
        productPrice,
        stock,
        qtyGood,
        price,
        daysOos,
        daysLast: daysStockCanLast(stock, qtyGood),
        lostRevenue: estimatedLostRevenue(daysOos, qtyGood, price),
        quantityOrdered: line?.quantityOrdered ?? 0,
        bonusQuantity: line?.bonusQuantity ?? 0,
      };
    });
  }, [audits, orderLines]);

  const orderedItems = useMemo(() => orderLines.filter((l) => l.quantityOrdered > 0 || l.bonusQuantity > 0), [orderLines]);

  const handleOrderQty = (productId: string, value: string) => {
    const n = parseInt(value, 10);
    setOrderLines((prev) => prev.map((r) => (r.productId === productId ? { ...r, quantityOrdered: Number.isNaN(n) ? 0 : Math.max(0, n) } : r)));
  };
  const handleBonusQty = (productId: string, value: string) => {
    const n = parseInt(value, 10);
    setOrderLines((prev) => prev.map((r) => (r.productId === productId ? { ...r, bonusQuantity: Number.isNaN(n) ? 0 : Math.max(0, n) } : r)));
  };

  const saveOrder = async () => {
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
      items: orderLines.map((l) => ({ productId: l.productId, quantityOrdered: l.quantityOrdered, bonusQuantity: l.bonusQuantity, unitPrice: l.unitPrice })),
    });
    if (!res.success) setError(res.error ?? "Failed to save order");
    else setOrderModalOpen(false);
    setSaving(false);
  };

  const saveMarketing = async () => {
    setSaving(true);
    setError(null);
    const res = await upsertMrVisitMarketing({
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
    if (!res.success) setError(res.error ?? "Failed to save marketing");
    setSaving(false);
  };

  const supplierDisplay = distributorName === "Other" ? distributorOther || "Other" : distributorName;

  const generateOrderPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 16;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Peckers Swiftserve Ltd", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Order", margin, y);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, margin, y + 6);
    y += 18;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Chemist / Outlet", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`${pharmacy.name}`, margin, y);
    doc.text(`Region: ${pharmacy.region}`, margin, y + 5);
    if (pharmacy.location) doc.text(`Location: ${pharmacy.location}`, margin, y + 10);
    doc.text(`Procurement: ${procurementName || "—"} | Contact: ${procurementContact || "—"}`, margin, y + 15);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.text("Supplier", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`${supplierDisplay}${telesalesName ? ` | Telesales: ${telesalesName}` : ""}`, margin, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Items ordered", margin, y);
    y += 6;
    if (orderedItems.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.text("No items (enter order quantities in the table above).", margin, y);
      y += 10;
    } else {
      const colWidths = [80, 30, 25, 35];
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Product", margin, y);
      doc.text("Qty", margin + colWidths[0], y);
      doc.text("Bonus", margin + colWidths[0] + colWidths[1], y);
      doc.text("Price (KES)", margin + colWidths[0] + colWidths[1] + colWidths[2], y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const item of orderedItems) {
        const lineTotal = (item.quantityOrdered + item.bonusQuantity) * (item.unitPrice ?? 0);
        doc.text(item.productName.slice(0, 32), margin, y);
        doc.text(String(item.quantityOrdered), margin + colWidths[0], y);
        doc.text(String(item.bonusQuantity), margin + colWidths[0] + colWidths[1], y);
        doc.text(String(item.unitPrice ?? ""), margin + colWidths[0] + colWidths[1] + colWidths[2], y);
        y += 6;
      }
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.text("MR details", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`${mrName} | ${mrContact || "—"}`, margin, y);
    y += 10;

    if (specialInstructions) {
      doc.setFont("helvetica", "bold");
      doc.text("Special instructions", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const split = doc.splitTextToSize(specialInstructions, 180);
      doc.text(split, margin, y);
    }

    doc.save(`order-${pharmacy.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const copyOrderForWhatsApp = () => {
    const lines = [
      `*Order* – ${pharmacy.name}`,
      `Date: ${new Date().toLocaleDateString("en-GB")}`,
      `Region: ${pharmacy.region} | Location: ${pharmacy.location || "—"}`,
      `Procurement: ${procurementName || "—"} | ${procurementContact || "—"}`,
      `Supplier: ${supplierDisplay}${telesalesName ? ` | Telesales: ${telesalesName}` : ""}`,
      "",
      "Items:",
      ...orderedItems.map((i) => `• ${i.productName}: ${i.quantityOrdered} + ${i.bonusQuantity} bonus`),
      "",
      `MR: ${mrName} | ${mrContact || ""}`,
      specialInstructions ? `Instructions: ${specialInstructions}` : "",
    ];
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-50">
            <Package className="h-5 w-5" />
            Products – stock, impact & order
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Product price, stock levels, quantity sold in a good month, price per pack, days out of stock. Then: days current stock can last, estimated lost revenue (KES). Enter order qty and bonus below. If you just added products above, refresh to see them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="px-3 py-2.5 text-left font-semibold">Product</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Price (KES)</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Stock</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Qty sold (good month)</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Price/pack (KES)</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Days OOS</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Days stock can last</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Est. lost revenue (KES)</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Order qty</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-3 py-2 font-medium">{row.productName}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.productPrice != null ? row.productPrice.toLocaleString() : "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.stock}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.qtyGood || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.price != null ? row.price.toLocaleString() : "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.daysOos || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.daysLast || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-amber-700 dark:text-amber-300">{row.lostRevenue ? row.lostRevenue.toLocaleString() : "—"}</td>
                    <td className="px-2 py-2">
                      <Input type="number" min={0} value={row.quantityOrdered} onChange={(e) => handleOrderQty(row.product_id, e.target.value)} className="h-9 w-20 rounded-lg text-right" />
                    </td>
                    <td className="px-2 py-2">
                      <Input type="number" min={0} value={row.bonusQuantity} onChange={(e) => handleBonusQty(row.product_id, e.target.value)} className="h-9 w-20 rounded-lg text-right" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tableRows.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">Complete the key products section above to see products here.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => loadData()} className="gap-2 rounded-full" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh table
            </Button>
            <Button onClick={() => setOrderModalOpen(true)} className="gap-2 rounded-full bg-blue-700 text-white hover:bg-blue-800">
              <ShoppingCart className="h-4 w-4" />
              Create / View order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription>Select distributor, procurement contact and special instructions. Share as PDF or copy for WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Distributor</Label>
                <select value={distributorName} onChange={(e) => setDistributorName(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50">
                  {MR_DISTRIBUTORS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {distributorName === "Other" && (
                <div className="space-y-2">
                  <Label>Other distributor name</Label>
                  <Input value={distributorOther} onChange={(e) => setDistributorOther(e.target.value)} placeholder="Type distributor" className="rounded-xl" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Telesales name</Label>
                <Input value={telesalesName} onChange={(e) => setTelesalesName(e.target.value)} placeholder="e.g. Mary" className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Procurement person</Label>
                <Input value={procurementName} onChange={(e) => setProcurementName(e.target.value)} placeholder="e.g. Charity Nakoru" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input value={procurementContact} onChange={(e) => setProcurementContact(e.target.value)} placeholder="e.g. 0790967263" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Special instructions</Label>
              <Textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="When to deliver, pack sizes..." className="min-h-[80px] rounded-xl" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/50">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Order summary (for letterhead)</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Date: {new Date().toLocaleDateString("en-GB")}</p>
              <p className="text-slate-600 dark:text-slate-300">Chemist: {pharmacy.name} | Region: {pharmacy.region} | Location: {pharmacy.location || "—"}</p>
              <p className="text-slate-600 dark:text-slate-300">Procurement: {procurementName || "—"} | Contact: {procurementContact || "—"}</p>
              <p className="text-slate-600 dark:text-slate-300">Supplier: {supplierDisplay}{telesalesName ? ` | Telesales: ${telesalesName}` : ""}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Items (not 0): {orderedItems.length ? orderedItems.map((i) => `${i.productName} (${i.quantityOrdered}+${i.bonusQuantity})`).join(", ") : "None yet"}</p>
              <p className="text-slate-600 dark:text-slate-300">MR: {mrName} | {mrContact || "—"}</p>
              {specialInstructions && <p className="mt-1 text-slate-600 dark:text-slate-300">Instructions: {specialInstructions}</p>}
            </div>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={copyOrderForWhatsApp} className="gap-2">
              <Share2 className="h-4 w-4" />
              Copy for WhatsApp
            </Button>
            <Button variant="outline" onClick={generateOrderPdf} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={saveOrder} disabled={saving} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marketing */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-50">
            <Megaphone className="h-5 w-5" />
            Marketing &amp; visit notes
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Merchandise used at outlet (qty and item), other marketing activity, next visit dates and what is expected, and feedback from the outlet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Wobblers (qty)</Label>
              <Input type="number" min={0} value={wobblers} onChange={(e) => setWobblers(parseInt(e.target.value, 10) || 0)} className="h-9 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Posters (qty)</Label>
              <Input type="number" min={0} value={posters} onChange={(e) => setPosters(parseInt(e.target.value, 10) || 0)} className="h-9 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Shelf talkers (qty)</Label>
              <Input type="number" min={0} value={shelfTalkers} onChange={(e) => setShelfTalkers(parseInt(e.target.value, 10) || 0)} className="h-9 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Flyers (qty)</Label>
              <Input type="number" min={0} value={flyers} onChange={(e) => setFlyers(parseInt(e.target.value, 10) || 0)} className="h-9 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Other marketing activity</Label>
            <Textarea value={otherActivity} onChange={(e) => setOtherActivity(e.target.value)} placeholder="e.g. product demo, display..." className="min-h-[60px] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Notes – next visit dates, what is expected, feedback from outlet</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" value={nextVisitDate} onChange={(e) => setNextVisitDate(e.target.value)} placeholder="Next visit date" className="rounded-xl" />
              <Input value={nextVisitNotes} onChange={(e) => setNextVisitNotes(e.target.value)} placeholder="What is expected from next visit" className="rounded-xl" />
            </div>
            <Textarea value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} placeholder="Feedback the MR got from them..." className="min-h-[80px] rounded-xl" />
          </div>
          <Button onClick={saveMarketing} disabled={saving} className="rounded-full bg-slate-700 text-white hover:bg-slate-800">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save marketing &amp; notes
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}
    </div>
  );
}
