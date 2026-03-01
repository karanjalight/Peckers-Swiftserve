"use client";

import { useState, useEffect } from "react";
import {
  createProductAudit,
  createPrescriptionAudit,
  createCompetitorMarketing,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { REASON_FOR_OOS_OPTIONS, REASON_WHY_STOCK_OPTIONS } from "@/lib/mr/constants";
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Check,
  Camera,
  Sparkles,
  Layers,
  User,
  MapPin,
  Hash,
  Building2,
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  Stethoscope,
  FileText,
  TrendingUp,
  ShoppingCart,
  Replace,
  AlertCircle,
} from "lucide-react";

type CompetitorEntry = {
  id: string;
  name: string;
  supplier: string;
  stock: string;
  stockSoldPerMonth: string;
  substitutionReason: string;
  pricePerPack: string;
  daysOut: string;
  reasonOutOfStock: string;
};

type PrescriptionEntry = {
  id: string;
  doctorName: string;
  doctorLocation: string;
  rxPerMonth: string;
  prescriptionImage: File | null;
};

type MarketingEntry = {
  id: string;
  competitorName: string;
  activity1Description: string;
  activity1Reason: string;
  activity2Description: string;
  activity2Reason: string;
};

function genId() {
  return Math.random().toString(36).slice(2, 11);
}

type Product = { id: string; name: string; price?: number | null; owned_by?: string | null };

const STEPS = ["product", "audit", "prescription", "marketing"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  product: "Choose product",
  audit: "Stock & pharmacy",
  prescription: "Prescription",
  marketing: "Competitor activity",
};

const MAX_COMPETITORS = 3;

export function MrVisitProductCycleForm({
  visitId,
  objective = "AUDIT",
  onSaved,
}: {
  visitId: string;
  objective?: string;
  onSaved?: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product audit
  const [qty, setQty] = useState(0);
  const [uspUnderstood, setUspUnderstood] = useState(false);
  const [pricePerPack, setPricePerPack] = useState("");
  const [reasonWhyStock, setReasonWhyStock] = useState("");
  const [supplier, setSupplier] = useState("");
  const [doSubstitute, setDoSubstitute] = useState(false);
  const [substituteWithAndWhy, setSubstituteWithAndWhy] = useState("");
  const [reasonForOos, setReasonForOos] = useState("");
  const [daysOos, setDaysOos] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);

  // Prescriptions (dynamic list)
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntry[]>([]);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);

  // Marketing (dynamic list)
  const [marketingActivities, setMarketingActivities] = useState<MarketingEntry[]>([]);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [editingMarketingId, setEditingMarketingId] = useState<string | null>(null);

  // Competitor modal (for product-audit competitors)
  const [competitorModalOpen, setCompetitorModalOpen] = useState(false);
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mr/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  function resetCycle() {
    setSelectedProduct(null);
    setStepIndex(0);
    setQty(0);
    setUspUnderstood(false);
    setPricePerPack("");
    setReasonWhyStock("");
    setSupplier("");
    setDoSubstitute(false);
    setSubstituteWithAndWhy("");
    setReasonForOos("");
    setDaysOos("");
    setCompetitors([]);
    setPrescriptions([]);
    setMarketingActivities([]);
    setPrescriptionModalOpen(false);
    setMarketingModalOpen(false);
    setCompetitorModalOpen(false);
    setEditingPrescriptionId(null);
    setEditingMarketingId(null);
    setEditingCompetitorId(null);
    setMessage(null);
  }

  async function handleSaveAll() {
    if (!selectedProduct) return;
    setLoading(true);
    setMessage(null);

    try {
      const competitorAudits = competitors.slice(0, MAX_COMPETITORS).map((c) => ({
        competitorName: c.name.trim() || c.supplier.trim() || "Competitor",
        supplier: c.supplier.trim() || undefined,
        competitorStock: c.stock ? parseInt(c.stock, 10) : undefined,
        stockSoldPerMonth: c.stockSoldPerMonth ? parseInt(c.stockSoldPerMonth, 10) : undefined,
        substitutionReason: c.substitutionReason.trim() || undefined,
        pricePerPack: c.pricePerPack ? parseFloat(c.pricePerPack) : undefined,
        daysOut: c.daysOut ? parseInt(c.daysOut, 10) : undefined,
        reasonOutOfStock: c.reasonOutOfStock.trim() || undefined,
      }));

      const productResult = await createProductAudit({
        visitId,
        productId: selectedProduct.id,
        quantityInStock: qty,
        uspUnderstood,
        reasonWhyStock: reasonWhyStock.trim() || undefined,
        supplier: supplier.trim() || undefined,
        doSubstitute,
        substituteWithAndWhy: substituteWithAndWhy.trim() || undefined,
        reasonForOos: reasonForOos.trim() || undefined,
        daysOos: daysOos ? parseInt(daysOos, 10) : undefined,
        pricePerPack: pricePerPack ? parseFloat(pricePerPack) : undefined,
        competitorAudits: competitorAudits.length > 0 ? competitorAudits : undefined,
      });

      if (!productResult.success) {
        setMessage({ type: "error", text: productResult.error ?? "Failed to save product audit" });
        setLoading(false);
        return;
      }

      for (const p of prescriptions) {
        if (!p.doctorName.trim() && !p.rxPerMonth && !p.prescriptionImage) continue;
        let doctorId: string | undefined;
        if (p.doctorName.trim()) {
          const dr = await findOrCreateDoctor(p.doctorName.trim(), p.doctorLocation.trim() || undefined);
          doctorId = dr.doctorId ?? undefined;
        }
        let imageUrl: string | undefined;
        if (p.prescriptionImage) {
          const fd = new FormData();
          fd.set("file", p.prescriptionImage);
          fd.set("visitId", visitId);
          const res = await fetch("/api/mr/upload-prescription", { method: "POST", body: fd });
          const data = await res.json();
          imageUrl = data.path;
        }
        await createPrescriptionAudit({
          visitId,
          doctorId,
          productName: selectedProduct.name,
          rxPerMonth: p.rxPerMonth ? parseInt(p.rxPerMonth, 10) : undefined,
          prescriptionImageUrl: imageUrl,
        });
      }

      for (const m of marketingActivities) {
        if (!m.competitorName.trim()) continue;
        await createCompetitorMarketing({
          visitId,
          competitorName: m.competitorName.trim(),
          activity1Description: m.activity1Description.trim() || undefined,
          activity1Reason: m.activity1Reason.trim() || undefined,
          activity2Description: m.activity2Description.trim() || undefined,
          activity2Reason: m.activity2Reason.trim() || undefined,
        });
      }

      setMessage({ type: "success", text: `${selectedProduct.name} — saved successfully.` });
      onSaved?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mr-visit-audit-saved"));
      }
      resetCycle();
    } catch (e) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;
  const canNext =
    (step === "product" && selectedProduct) ||
    (step === "audit" && true) ||
    (step === "prescription" && true) ||
    (step === "marketing" && true);

  const inputClass =
    "h-12 rounded-2xl bg-white dark:bg-background text-slate-900 dark:text-foreground placeholder:text-slate-500 dark:placeholder:text-muted-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-blue-500/30 transition";

  return (
    <div className="space-y-5">
      {/* Hero strip - white, no slate */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl cta-gradient">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-foreground">Add product — one round</h2>
          <p className="text-sm text-slate-600 dark:text-muted-foreground">
            Pick a product, then stock, prescriptions & competitor info. Perfect for mobile.
          </p>
        </div>
      </div>

      {/* Stepper - pills, minimal border */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setStepIndex(i)}
              className={`flex min-w-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium transition touch-manipulation ${
                i === stepIndex
                  ? "cta-gradient text-white shadow-md"
                  : i < stepIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "bg-white dark:bg-card text-muted-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              }`}
            >
              <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              <span className="sm:hidden">{i + 1}</span>
              {i < stepIndex && <Check className="h-3.5 w-3.5" />}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="mx-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Main content card - white, rounded, minimal border */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
        <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 bg-white dark:bg-card px-4 py-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            {STEP_LABELS[step]}
            {selectedProduct && step !== "product" && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">— {selectedProduct.name}</span>
            )}
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          {step === "product" && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
                <Layers className="h-4 w-4" />
                Tap a product to enter its audit, prescription and marketing in one round.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition touch-manipulation shadow-sm ${
                      selectedProduct?.id === p.id
                        ? "cta-gradient text-white ring-2 ring-blue-500/50"
                        : "bg-white dark:bg-background ring-1 ring-black/5 dark:ring-white/10 hover:ring-2 hover:ring-blue-400/30"
                    }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    {p.price != null && (
                      <span className="text-sm opacity-90">KES {p.price}</span>
                    )}
                    {p.owned_by && (
                      <span className="text-xs opacity-75">{p.owned_by}</span>
                    )}
                  </button>
                ))}
              </div>
              {products.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-600 dark:text-muted-foreground">No products available.</p>
              )}
            </div>
          )}

          {step === "audit" && selectedProduct && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 flex items-center gap-2 text-slate-900 dark:text-foreground">
                    <Layers className="h-4 w-4" />
                    Quantity stocked (packs)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-2 text-slate-900 dark:text-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Reason they stock
                  </Label>
                  <select
                    value={reasonWhyStock}
                    onChange={(e) => setReasonWhyStock(e.target.value)}
                    className={`${inputClass} w-full appearance-none px-4`}
                  >
                    <option value="">Optional</option>
                    {REASON_WHY_STOCK_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-2 text-foreground">
                  <Building2 className="h-4 w-4" />
                  Supplier
                </Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. DK Pharma"
                  className={inputClass}
                />
              </div>
              {objective === "AUDIT" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1.5 flex items-center gap-2 text-slate-900 dark:text-foreground">
                        <Hash className="h-4 w-4" />
                        Price per pack (KES)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={pricePerPack}
                        onChange={(e) => setPricePerPack(e.target.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 flex items-center gap-2 text-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Reason for out of stock
                      </Label>
                      <select
                        value={reasonForOos}
                        onChange={(e) => setReasonForOos(e.target.value)}
                        className={`${inputClass} w-full appearance-none px-4`}
                      >
                        <option value="">Optional</option>
                        {REASON_FOR_OOS_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 text-slate-900 dark:text-foreground">Days out of stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={daysOos}
                      onChange={(e) => setDaysOos(e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                    <input
                      type="checkbox"
                      id="doSubstitute"
                      checked={doSubstitute}
                      onChange={(e) => setDoSubstitute(e.target.checked)}
                      className="h-5 w-5 rounded-lg"
                    />
                    <Label htmlFor="doSubstitute" className="flex cursor-pointer items-center gap-2 text-slate-900 dark:text-foreground">
                      <Replace className="h-4 w-4" />
                      Do you substitute prescriptions?
                    </Label>
                  </div>
                  {doSubstitute && (
                    <div>
                      <Label className="mb-1.5 text-slate-900 dark:text-foreground">Substitute with and why</Label>
                      <Input
                        value={substituteWithAndWhy}
                        onChange={(e) => setSubstituteWithAndWhy(e.target.value)}
                        placeholder="Product and reason"
                        className={inputClass}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                <input
                  type="checkbox"
                  id="usp"
                  checked={uspUnderstood}
                  onChange={(e) => setUspUnderstood(e.target.checked)}
                  className="h-5 w-5 rounded-lg"
                />
                <Label htmlFor="usp" className="flex cursor-pointer items-center gap-2 text-slate-900 dark:text-foreground">
                  <Check className="h-4 w-4" />
                  Staff understand product USP?
                </Label>
              </div>

              {/* Dynamic competitors */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-slate-900 dark:text-foreground">
                    <Megaphone className="h-4 w-4" />
                    Competitors
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setEditingCompetitorId(null);
                      setCompetitorModalOpen(true);
                    }}
                    disabled={competitors.length >= MAX_COMPETITORS}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                {competitors.length >= MAX_COMPETITORS && (
                  <p className="mb-2 text-xs text-slate-600 dark:text-muted-foreground">Max {MAX_COMPETITORS} competitors.</p>
                )}
                <ul className="space-y-2">
                  {competitors.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-3 py-2"
                    >
                      <span className="truncate font-medium text-slate-900 dark:text-foreground">
                        {c.name.trim() || c.supplier.trim() || "Competitor"}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => {
                            setEditingCompetitorId(c.id);
                            setCompetitorModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-destructive"
                          onClick={() => setCompetitors((prev) => prev.filter((x) => x.id !== c.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === "prescription" && selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-800 dark:text-blue-200">
                <FileText className="h-4 w-4 shrink-0" />
                Product: <strong>{selectedProduct.name}</strong>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full cta-gradient"
                  onClick={() => {
                    setEditingPrescriptionId(null);
                    setPrescriptionModalOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add prescription
                </Button>
              </div>
              <ul className="space-y-2">
                {prescriptions.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Stethoscope className="h-4 w-4 shrink-0 text-slate-600 dark:text-muted-foreground" />
                      <span className="truncate font-medium">{p.doctorName || "No doctor"}</span>
                      {p.rxPerMonth && (
                        <span className="text-sm text-slate-600 dark:text-muted-foreground">{p.rxPerMonth} Rx/mo</span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          setEditingPrescriptionId(p.id);
                          setPrescriptionModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-destructive"
                        onClick={() => setPrescriptions((prev) => prev.filter((x) => x.id !== p.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "marketing" && selectedProduct && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full cta-gradient"
                  onClick={() => {
                    setEditingMarketingId(null);
                    setMarketingModalOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add competitor activity
                </Button>
              </div>
              <ul className="space-y-2">
                {marketingActivities.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Megaphone className="h-4 w-4 shrink-0 text-slate-600 dark:text-muted-foreground" />
                      <span className="truncate font-medium">{m.competitorName || "Competitor"}</span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          setEditingMarketingId(m.id);
                          setMarketingModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-destructive"
                        onClick={() => setMarketingActivities((prev) => prev.filter((x) => x.id !== m.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Competitor modal */}
      <CompetitorModal
        open={competitorModalOpen}
        onOpenChange={setCompetitorModalOpen}
        editingId={editingCompetitorId}
        competitors={competitors}
        setCompetitors={setCompetitors}
        onClose={() => {
          setCompetitorModalOpen(false);
          setEditingCompetitorId(null);
        }}
        inputClass={inputClass}
      />

      {/* Prescription modal */}
      <PrescriptionModal
        open={prescriptionModalOpen}
        onOpenChange={setPrescriptionModalOpen}
        editingId={editingPrescriptionId}
        prescriptions={prescriptions}
        setPrescriptions={setPrescriptions}
        onClose={() => {
          setPrescriptionModalOpen(false);
          setEditingPrescriptionId(null);
        }}
        inputClass={inputClass}
      />

      {/* Marketing modal */}
      <MarketingModal
        open={marketingModalOpen}
        onOpenChange={setMarketingModalOpen}
        editingId={editingMarketingId}
        activities={marketingActivities}
        setActivities={setMarketingActivities}
        onClose={() => {
          setMarketingModalOpen(false);
          setEditingMarketingId(null);
        }}
        inputClass={inputClass}
      />

      {/* Navigation - rounded CTA */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12 touch-manipulation rounded-2xl border-black/10 dark:border-white/10"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!isLastStep && (
            <Button
              type="button"
              size="lg"
              disabled={!canNext}
              className="min-h-12 touch-manipulation rounded-2xl cta-gradient"
              onClick={() => canNext && setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          )}
          {isLastStep && (
            <Button
              type="button"
              size="lg"
              disabled={loading}
              className="min-h-12 touch-manipulation rounded-2xl cta-gradient"
              onClick={handleSaveAll}
            >
              {loading ? (
                "Saving…"
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Save {selectedProduct?.name ?? "product"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CompetitorModal({
  open,
  onOpenChange,
  editingId,
  competitors,
  setCompetitors,
  onClose,
  inputClass,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: string | null;
  competitors: CompetitorEntry[];
  setCompetitors: (v: CompetitorEntry[] | ((prev: CompetitorEntry[]) => CompetitorEntry[])) => void;
  onClose: () => void;
  inputClass: string;
}) {
  const editing = editingId ? competitors.find((c) => c.id === editingId) : null;
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [stockSoldPerMonth, setStockSoldPerMonth] = useState("");
  const [substitutionReason, setSubstitutionReason] = useState("");
  const [pricePerPack, setPricePerPack] = useState("");
  const [daysOut, setDaysOut] = useState("");
  const [reasonOutOfStock, setReasonOutOfStock] = useState("");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSupplier(editing.supplier);
      setStock(editing.stock);
      setStockSoldPerMonth(editing.stockSoldPerMonth);
      setSubstitutionReason(editing.substitutionReason);
      setPricePerPack(editing.pricePerPack);
      setDaysOut(editing.daysOut);
      setReasonOutOfStock(editing.reasonOutOfStock);
    } else {
      setName("");
      setSupplier("");
      setStock("");
      setStockSoldPerMonth("");
      setSubstitutionReason("");
      setPricePerPack("");
      setDaysOut("");
      setReasonOutOfStock("");
    }
  }, [editing, open]);

  function handleAdd() {
    const entry: CompetitorEntry = {
      id: editingId ?? genId(),
      name,
      supplier,
      stock,
      stockSoldPerMonth,
      substitutionReason,
      pricePerPack,
      daysOut,
      reasonOutOfStock,
    };
    if (editingId) {
      setCompetitors((prev) => prev.map((c) => (c.id === editingId ? entry : c)));
    } else {
      setCompetitors((prev) => [...prev, entry]);
    }
    onClose();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white shadow-xl dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {editingId ? "Edit competitor" : "Add competitor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5">Competitor name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maalox"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Supplier</Label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1.5">Stock (packs)</Label>
              <Input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label className="mb-1.5">Sold/month</Label>
              <Input
                type="number"
                min={0}
                value={stockSoldPerMonth}
                onChange={(e) => setStockSoldPerMonth(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1.5">Price (KES)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={pricePerPack}
                onChange={(e) => setPricePerPack(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label className="mb-1.5">Days out</Label>
              <Input
                type="number"
                min={0}
                value={daysOut}
                onChange={(e) => setDaysOut(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Substitution reason</Label>
            <Input
              value={substitutionReason}
              onChange={(e) => setSubstitutionReason(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Reason out of stock</Label>
            <Input
              value={reasonOutOfStock}
              onChange={(e) => setReasonOutOfStock(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="rounded-2xl cta-gradient" onClick={handleAdd}>
            <Check className="mr-2 h-4 w-4" />
            {editingId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrescriptionModal({
  open,
  onOpenChange,
  editingId,
  prescriptions,
  setPrescriptions,
  onClose,
  inputClass,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: string | null;
  prescriptions: PrescriptionEntry[];
  setPrescriptions: (v: PrescriptionEntry[] | ((prev: PrescriptionEntry[]) => PrescriptionEntry[])) => void;
  onClose: () => void;
  inputClass: string;
}) {
  const editing = editingId ? prescriptions.find((p) => p.id === editingId) : null;
  const [doctorName, setDoctorName] = useState("");
  const [doctorLocation, setDoctorLocation] = useState("");
  const [rxPerMonth, setRxPerMonth] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);

  useEffect(() => {
    if (editing) {
      setDoctorName(editing.doctorName);
      setDoctorLocation(editing.doctorLocation);
      setRxPerMonth(editing.rxPerMonth);
      setPrescriptionImage(editing.prescriptionImage);
    } else {
      setDoctorName("");
      setDoctorLocation("");
      setRxPerMonth("");
      setPrescriptionImage(null);
    }
  }, [editing, open]);

  function handleAdd() {
    const entry: PrescriptionEntry = {
      id: editingId ?? genId(),
      doctorName,
      doctorLocation,
      rxPerMonth,
      prescriptionImage,
    };
    if (editingId) {
      setPrescriptions((prev) => prev.map((p) => (p.id === editingId ? entry : p)));
    } else {
      setPrescriptions((prev) => [...prev, entry]);
    }
    onClose();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white shadow-xl dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {editingId ? "Edit prescription" : "Add prescription"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 flex items-center gap-2">
              <User className="h-4 w-4" />
              Doctor name
            </Label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Paul Mwangi"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Doctor location
            </Label>
            <Input
              value={doctorLocation}
              onChange={(e) => setDoctorLocation(e.target.value)}
              placeholder="e.g. Kenyatta Hospital"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Rx per month
            </Label>
            <Input
              type="number"
              min={0}
              value={rxPerMonth}
              onChange={(e) => setRxPerMonth(e.target.value)}
              placeholder="Witnessed or shared"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Prescription image
            </Label>
            <Input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPrescriptionImage(e.target.files?.[0] ?? null)}
              className={`${inputClass} file:rounded-xl file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm`}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="rounded-2xl cta-gradient" onClick={handleAdd}>
            <Check className="mr-2 h-4 w-4" />
            {editingId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarketingModal({
  open,
  onOpenChange,
  editingId,
  activities,
  setActivities,
  onClose,
  inputClass,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: string | null;
  activities: MarketingEntry[];
  setActivities: (v: MarketingEntry[] | ((prev: MarketingEntry[]) => MarketingEntry[])) => void;
  onClose: () => void;
  inputClass: string;
}) {
  const editing = editingId ? activities.find((a) => a.id === editingId) : null;
  const [competitorName, setCompetitorName] = useState("");
  const [activity1Description, setActivity1Description] = useState("");
  const [activity1Reason, setActivity1Reason] = useState("");
  const [activity2Description, setActivity2Description] = useState("");
  const [activity2Reason, setActivity2Reason] = useState("");

  useEffect(() => {
    if (editing) {
      setCompetitorName(editing.competitorName);
      setActivity1Description(editing.activity1Description);
      setActivity1Reason(editing.activity1Reason);
      setActivity2Description(editing.activity2Description);
      setActivity2Reason(editing.activity2Reason);
    } else {
      setCompetitorName("");
      setActivity1Description("");
      setActivity1Reason("");
      setActivity2Description("");
      setActivity2Reason("");
    }
  }, [editing, open]);

  function handleAdd() {
    const entry: MarketingEntry = {
      id: editingId ?? genId(),
      competitorName,
      activity1Description,
      activity1Reason,
      activity2Description,
      activity2Reason,
    };
    if (editingId) {
      setActivities((prev) => prev.map((a) => (a.id === editingId ? entry : a)));
    } else {
      setActivities((prev) => [...prev, entry]);
    }
    onClose();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white shadow-xl dark:bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {editingId ? "Edit activity" : "Add competitor activity"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5">Competitor name</Label>
            <Input
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="e.g. Maalox"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Activity 1 (why they dispense)</Label>
            <Input
              value={activity1Description}
              onChange={(e) => setActivity1Description(e.target.value)}
              placeholder="e.g. Breakfast meeting every Tuesday"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Reason for activity 1</Label>
            <Input
              value={activity1Reason}
              onChange={(e) => setActivity1Reason(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Activity 2</Label>
            <Input
              value={activity2Description}
              onChange={(e) => setActivity2Description(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="mb-1.5">Reason for activity 2</Label>
            <Input
              value={activity2Reason}
              onChange={(e) => setActivity2Reason(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="rounded-2xl cta-gradient" onClick={handleAdd}>
            <Check className="mr-2 h-4 w-4" />
            {editingId ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
