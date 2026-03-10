"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getVisitAudits,
  updateProductAudit,
  updatePrescriptionAudit,
  updateCompetitorMarketing,
  deleteProductAudit,
  deletePrescriptionAudit,
  deleteCompetitorMarketing,
  findOrCreateDoctor,
} from "@/app/mr/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REASON_FOR_OOS_OPTIONS, REASON_WHY_STOCK_OPTIONS } from "@/lib/mr/constants";
import { Pencil, Trash2 } from "lucide-react";

const EMPTY_COMPETITOR = {
  name: "",
  supplier: "",
  stock: "",
  stockSoldPerMonth: "",
  substitutionReason: "",
  pricePerPack: "",
  daysOut: "",
  reasonOutOfStock: "",
};

type ProductAuditRow = {
  id: string;
  visit_id: string;
  product_id: string;
  quantity_in_stock: number;
  usp_understood: boolean;
  reason_why_stock?: string | null;
  supplier?: string | null;
  quantity_sold_good_month?: number | null;
  price_per_pack?: number | null;
  days_oos?: number | null;
  reason_for_oos?: string | null;
  do_substitute?: boolean;
  substitute_with_and_why?: string | null;
  mr_products: { id: string; name: string } | { id: string; name: string }[] | null;
  mr_competitor_audits: Array<{
    id?: string;
    competitor_name: string;
    supplier?: string | null;
    competitor_stock?: number | null;
    stock_sold_per_month?: number | null;
    substitution_reason?: string | null;
    price_per_pack?: number | null;
    days_out?: number | null;
    reason_out_of_stock?: string | null;
  }>;
};

type PrescriptionRow = {
  id: string;
  visit_id: string;
  doctor_id?: string | null;
  product_name: string;
  rx_per_month?: number | null;
  prescription_image_url?: string | null;
  mr_doctors: { id: string; name: string; location: string | null } | { id: string; name: string; location: string | null }[] | null;
};

type MarketingRow = {
  id: string;
  visit_id: string;
  competitor_name: string;
  activity_description?: string | null;
  reason_it_works?: string | null;
  activity_2_description?: string | null;
  activity_2_reason?: string | null;
};

export function MrVisitEditExistingData({
  visitId,
  objective = "AUDIT",
}: {
  visitId: string;
  objective?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    productAudits: ProductAuditRow[];
    prescriptionAudits: PrescriptionRow[];
    competitorMarketing: MarketingRow[];
  } | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string; price?: number | null; owned_by?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<ProductAuditRow | null>(null);
  const [editPrescription, setEditPrescription] = useState<PrescriptionRow | null>(null);
  const [editMarketing, setEditMarketing] = useState<MarketingRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getVisitAudits(visitId).then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
    fetch("/api/mr/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, [visitId]);

  useEffect(() => {
    const onSaved = () => refresh();
    window.addEventListener("mr-visit-audit-saved", onSaved);
    return () => window.removeEventListener("mr-visit-audit-saved", onSaved);
  }, [visitId]);

  function refresh() {
    getVisitAudits(visitId).then((res) => {
      if (res.success && res.data) setData(res.data);
    });
    router.refresh();
  }

  if (loading || !data) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 dark:bg-card dark:text-muted-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        Loading existing data…
      </div>
    );
  }

  const hasAny =
    data.productAudits.length > 0 ||
    data.prescriptionAudits.length > 0 ||
    data.competitorMarketing.length > 0;

  if (!hasAny) return null;

  return (
    <div className="grid gap-6 hidden">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Edit existing data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Change or correct any product audit, prescription audit, or competitor marketing entry already added to this visit. Click Edit next to an item to open the form.
        </p>
      </div>
      {message && (
        <div
          className={`rounded-2xl p-3 text-sm shadow-sm ${
            message.includes("saved") || message.includes("Updated")
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {data.productAudits.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
          <h4 className="mb-1 font-medium text-slate-900 dark:text-foreground">Product audits</h4>
          <p className="mb-3 text-sm text-slate-600 dark:text-muted-foreground">Update stock, supplier, price, or competitor details for a product.</p>
          <ul className="space-y-2">
            {data.productAudits.map((pa) => {
              const productName = (() => {
                const mp = pa.mr_products;
                const p = Array.isArray(mp) ? mp[0] : mp;
                return p?.name ?? "—";
              })();
              return (
                <li
                  key={pa.id}
                  className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm">
                    <strong>{productName}</strong> — Stock: {pa.quantity_in_stock}
                    {pa.supplier ? ` • ${pa.supplier}` : ""}
                    {pa.quantity_sold_good_month != null ? ` • ${pa.quantity_sold_good_month} sold/good mo` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditProduct(pa)}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId !== null}
                      onClick={async () => {
                        if (!confirm("Delete this product audit and its competitor entries? This cannot be undone.")) return;
                        setDeletingId(pa.id);
                        setMessage("");
                        const res = await deleteProductAudit(visitId, pa.id);
                        setDeletingId(null);
                        if (res.success) {
                          setMessage("Product audit deleted.");
                          refresh();
                        } else {
                          setMessage(res.error ?? "Failed to delete");
                        }
                      }}
                    >
                      {deletingId === pa.id ? "…" : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {data.prescriptionAudits.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
          <h4 className="mb-1 font-medium text-foreground">Prescription audits</h4>
          <p className="mb-3 text-sm text-muted-foreground">Update doctor, product, or prescriptions per month.</p>
          <ul className="space-y-2">
            {data.prescriptionAudits.map((pa) => {
              const doc = Array.isArray(pa.mr_doctors) ? pa.mr_doctors[0] : pa.mr_doctors;
              return (
                <li
                  key={pa.id}
                  className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2"
                >
                  <span className="text-sm">
                    {doc?.name ?? "—"} — {pa.product_name}
                    {pa.rx_per_month != null ? ` • ${pa.rx_per_month} Rx/mo` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditPrescription(pa)}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId !== null}
                      onClick={async () => {
                        if (!confirm("Delete this prescription audit? This cannot be undone.")) return;
                        setDeletingId(pa.id);
                        setMessage("");
                        const res = await deletePrescriptionAudit(visitId, pa.id);
                        setDeletingId(null);
                        if (res.success) {
                          setMessage("Prescription audit deleted.");
                          refresh();
                        } else {
                          setMessage(res.error ?? "Failed to delete");
                        }
                      }}
                    >
                      {deletingId === pa.id ? "…" : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {data.competitorMarketing.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
          <h4 className="mb-1 font-medium text-slate-900 dark:text-foreground">Competitor marketing</h4>
          <p className="mb-3 text-sm text-slate-600 dark:text-muted-foreground">Update competitor name or activity details.</p>
          <ul className="space-y-2">
            {data.competitorMarketing.map((cm) => (
              <li
                key={cm.id}
                className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2"
              >
                <span className="text-sm font-medium">{cm.competitor_name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMarketing(cm)}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deletingId !== null}
                    onClick={async () => {
                      if (!confirm("Delete this competitor marketing entry? This cannot be undone.")) return;
                      setDeletingId(cm.id);
                      setMessage("");
                      const res = await deleteCompetitorMarketing(visitId, cm.id);
                      setDeletingId(null);
                      if (res.success) {
                        setMessage("Competitor marketing deleted.");
                        refresh();
                      } else {
                        setMessage(res.error ?? "Failed to delete");
                      }
                    }}
                  >
                    {deletingId === cm.id ? "…" : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editProduct && (
        <EditProductAuditDialog
          visitId={visitId}
          objective={objective}
          products={products}
          row={editProduct}
          saving={saving}
          onSavingChange={setSaving}
          onMessage={setMessage}
          onClose={() => setEditProduct(null)}
          onSuccess={() => {
            setMessage("Product audit updated.");
            setEditProduct(null);
            refresh();
          }}
        />
      )}
      {editPrescription && (
        <EditPrescriptionDialog
          visitId={visitId}
          row={editPrescription}
          saving={saving}
          onSavingChange={setSaving}
          onMessage={setMessage}
          onClose={() => setEditPrescription(null)}
          onSuccess={() => {
            setMessage("Prescription audit updated.");
            setEditPrescription(null);
            refresh();
          }}
        />
      )}
      {editMarketing && (
        <EditMarketingDialog
          visitId={visitId}
          row={editMarketing}
          saving={saving}
          onSavingChange={setSaving}
          onMessage={setMessage}
          onClose={() => setEditMarketing(null)}
          onSuccess={() => {
            setMessage("Competitor marketing updated.");
            setEditMarketing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function EditProductAuditDialog({
  visitId,
  objective,
  products,
  row,
  saving,
  onSavingChange,
  onMessage,
  onClose,
  onSuccess,
}: {
  visitId: string;
  objective: string;
  products: { id: string; name: string; price?: number | null; owned_by?: string | null }[];
  row: ProductAuditRow;
  saving: boolean;
  onSavingChange: (v: boolean) => void;
  onMessage: (m: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const comps = Array.isArray(row.mr_competitor_audits) ? row.mr_competitor_audits : [];
  const [productId, setProductId] = useState(row.product_id);
  const [qty, setQty] = useState(row.quantity_in_stock);
  const [uspUnderstood, setUspUnderstood] = useState(row.usp_understood);
  const [reasonWhyStock, setReasonWhyStock] = useState(row.reason_why_stock ?? "");
  const [supplier, setSupplier] = useState(row.supplier ?? "");
  const [quantitySoldGoodMonth, setQuantitySoldGoodMonth] = useState(row.quantity_sold_good_month?.toString() ?? "");
  const [pricePerPack, setPricePerPack] = useState(row.price_per_pack?.toString() ?? "");
  const [reasonForOos, setReasonForOos] = useState(row.reason_for_oos ?? "");
  const [daysOos, setDaysOos] = useState(row.days_oos?.toString() ?? "");
  const [doSubstitute, setDoSubstitute] = useState(row.do_substitute ?? false);
  const [substituteWithAndWhy, setSubstituteWithAndWhy] = useState(row.substitute_with_and_why ?? "");
  const [competitors, setCompetitors] = useState(() => {
    const arr = [
      { ...EMPTY_COMPETITOR },
      { ...EMPTY_COMPETITOR },
      { ...EMPTY_COMPETITOR },
    ];
    comps.forEach((c, i) => {
      if (i < 3) {
        arr[i] = {
          name: c.competitor_name ?? "",
          supplier: c.supplier ?? "",
          stock: c.competitor_stock?.toString() ?? "",
          stockSoldPerMonth: c.stock_sold_per_month?.toString() ?? "",
          substitutionReason: c.substitution_reason ?? "",
          pricePerPack: c.price_per_pack?.toString() ?? "",
          daysOut: c.days_out?.toString() ?? "",
          reasonOutOfStock: c.reason_out_of_stock ?? "",
        };
      }
    });
    return arr;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSavingChange(true);
    onMessage("");
    const competitorAudits = competitors
      .filter((c) => c.name.trim() || c.supplier.trim())
      .map((c) => ({
        competitorName: c.name.trim() || c.supplier.trim() || "Competitor",
        supplier: c.supplier.trim() || undefined,
        competitorStock: c.stock ? parseInt(c.stock, 10) : undefined,
        stockSoldPerMonth: c.stockSoldPerMonth ? parseInt(c.stockSoldPerMonth, 10) : undefined,
        substitutionReason: c.substitutionReason.trim() || undefined,
        pricePerPack: c.pricePerPack ? parseFloat(c.pricePerPack) : undefined,
        daysOut: c.daysOut ? parseInt(c.daysOut, 10) : undefined,
        reasonOutOfStock: c.reasonOutOfStock.trim() || undefined,
      }));
    const result = await updateProductAudit(row.id, visitId, {
      productId,
      quantityInStock: qty,
      uspUnderstood,
      reasonWhyStock: reasonWhyStock.trim() || undefined,
      supplier: supplier.trim() || undefined,
      quantitySoldGoodMonth: quantitySoldGoodMonth ? parseInt(quantitySoldGoodMonth, 10) : undefined,
      doSubstitute,
      substituteWithAndWhy: substituteWithAndWhy.trim() || undefined,
      reasonForOos: reasonForOos.trim() || undefined,
      daysOos: daysOos ? parseInt(daysOos, 10) : undefined,
      pricePerPack: pricePerPack ? parseFloat(pricePerPack) : undefined,
      competitorAudits: competitorAudits.length > 0 ? competitorAudits : undefined,
    });
    onSavingChange(false);
    if (result.success) onSuccess();
    else onMessage(result.error ?? "Failed to update");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit product audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Product</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.price != null ? ` (KES ${p.price})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Quantity stocked (packs)</Label>
            <Input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason why they stock</Label>
            <select
              value={reasonWhyStock}
              onChange={(e) => setReasonWhyStock(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">Select (optional)</option>
              {REASON_WHY_STOCK_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Supplier</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Quantity sold in a good month</Label>
              <Input
                type="number"
                min={0}
                value={quantitySoldGoodMonth}
                onChange={(e) => setQuantitySoldGoodMonth(e.target.value)}
                placeholder="Packs"
                className="mt-1"
              />
            </div>
          </div>
          <>
            <div>
              <Label>Price per pack (KES)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={pricePerPack}
                onChange={(e) => setPricePerPack(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reason for OOS</Label>
              <select
                value={reasonForOos}
                onChange={(e) => setReasonForOos(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="">Select (optional)</option>
                {REASON_FOR_OOS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Days OOS</Label>
              <Input
                type="number"
                min={0}
                value={daysOos}
                onChange={(e) => setDaysOos(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="doSub"
                checked={doSubstitute}
                onChange={(e) => setDoSubstitute(e.target.checked)}
              />
              <Label htmlFor="doSub">Do you substitute?</Label>
            </div>
            {doSubstitute && (
              <div>
                <Label>Substitute with and why</Label>
                <Input
                  value={substituteWithAndWhy}
                  onChange={(e) => setSubstituteWithAndWhy(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usp"
              checked={uspUnderstood}
              onChange={(e) => setUspUnderstood(e.target.checked)}
            />
            <Label htmlFor="usp">Staff understand USP?</Label>
          </div>
          <div className="border-t pt-4">
            <Label>Competitors (up to 3)</Label>
            {competitors.map((c, i) => (
              <div key={i} className="mt-2 grid gap-2 rounded border p-2 sm:grid-cols-2">
                <Input
                  placeholder="Competitor name"
                  value={c.name}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = { ...next[i], name: e.target.value };
                    setCompetitors(next);
                  }}
                />
                <Input
                  placeholder="Supplier"
                  value={c.supplier}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = { ...next[i], supplier: e.target.value };
                    setCompetitors(next);
                  }}
                />
                <Input
                  placeholder="Stock"
                  type="number"
                  min={0}
                  value={c.stock}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = { ...next[i], stock: e.target.value };
                    setCompetitors(next);
                  }}
                />
                <Input
                  placeholder="Price (KES)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={c.pricePerPack}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = { ...next[i], pricePerPack: e.target.value };
                    setCompetitors(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPrescriptionDialog({
  visitId,
  row,
  saving,
  onSavingChange,
  onMessage,
  onClose,
  onSuccess,
}: {
  visitId: string;
  row: PrescriptionRow;
  saving: boolean;
  onSavingChange: (v: boolean) => void;
  onMessage: (m: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const doc = Array.isArray(row.mr_doctors) ? row.mr_doctors[0] : row.mr_doctors;
  const [doctorName, setDoctorName] = useState(doc?.name ?? "");
  const [doctorLocation, setDoctorLocation] = useState(doc?.location ?? "");
  const [productName, setProductName] = useState(row.product_name);
  const [rxPerMonth, setRxPerMonth] = useState(row.rx_per_month?.toString() ?? "");
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSavingChange(true);
    onMessage("");
    let doctorId: string | undefined;
    if (doctorName.trim()) {
      const dr = await findOrCreateDoctor(doctorName.trim(), doctorLocation.trim() || undefined);
      doctorId = dr.doctorId ?? undefined;
    }
    let imageUrl: string | undefined = row.prescription_image_url ?? undefined;
    if (prescriptionImage) {
      const fd = new FormData();
      fd.set("file", prescriptionImage);
      fd.set("visitId", visitId);
      const res = await fetch("/api/mr/upload-prescription", { method: "POST", body: fd });
      const data = await res.json();
      imageUrl = data.path;
    }
    const result = await updatePrescriptionAudit(row.id, visitId, {
      doctorId: doctorId ?? null,
      productName: productName.trim(),
      rxPerMonth: rxPerMonth ? parseInt(rxPerMonth, 10) : null,
      prescriptionImageUrl: imageUrl,
    });
    onSavingChange(false);
    if (result.success) onSuccess();
    else onMessage(result.error ?? "Failed to update");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit prescription audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Doctor name</Label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr. Name"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Doctor location</Label>
            <Input
              value={doctorLocation}
              onChange={(e) => setDoctorLocation(e.target.value)}
              placeholder="Location"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Product prescribed</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Rx per month</Label>
            <Input
              type="number"
              min={0}
              value={rxPerMonth}
              onChange={(e) => setRxPerMonth(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Prescription image (optional, replaces existing)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPrescriptionImage(e.target.files?.[0] ?? null)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMarketingDialog({
  visitId,
  row,
  saving,
  onSavingChange,
  onMessage,
  onClose,
  onSuccess,
}: {
  visitId: string;
  row: MarketingRow;
  saving: boolean;
  onSavingChange: (v: boolean) => void;
  onMessage: (m: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [compName, setCompName] = useState(row.competitor_name);
  const [activity1Desc, setActivity1Desc] = useState(row.activity_description ?? "");
  const [activity1Reason, setActivity1Reason] = useState(row.reason_it_works ?? "");
  const [activity2Desc, setActivity2Desc] = useState(row.activity_2_description ?? "");
  const [activity2Reason, setActivity2Reason] = useState(row.activity_2_reason ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSavingChange(true);
    onMessage("");
    const result = await updateCompetitorMarketing(row.id, visitId, {
      competitorName: compName.trim(),
      activity1Description: activity1Desc.trim() || null,
      activity1Reason: activity1Reason.trim() || null,
      activity2Description: activity2Desc.trim() || null,
      activity2Reason: activity2Reason.trim() || null,
    });
    onSavingChange(false);
    if (result.success) onSuccess();
    else onMessage(result.error ?? "Failed to update");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit competitor marketing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Competitor</Label>
            <Input
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Activity 1 (why do you dispense)</Label>
            <Input
              value={activity1Desc}
              onChange={(e) => setActivity1Desc(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason for Activity 1</Label>
            <Input
              value={activity1Reason}
              onChange={(e) => setActivity1Reason(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Activity 2</Label>
            <Input
              value={activity2Desc}
              onChange={(e) => setActivity2Desc(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason for Activity 2</Label>
            <Input
              value={activity2Reason}
              onChange={(e) => setActivity2Reason(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
