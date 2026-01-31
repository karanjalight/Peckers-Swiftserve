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
import { Package, FileText, Megaphone } from "lucide-react";
import { REASON_FOR_OOS_OPTIONS } from "@/lib/mr/constants";

const EMPTY_COMPETITOR = {
  name: "",
  stock: "",
  substitutionReason: "",
  pricePerPack: "",
};

export function MrVisitAuditForm({
  visitId,
  objective = "AUDIT",
}: {
  visitId: string;
  objective?: string;
}) {
  const [step, setStep] = useState<"product" | "prescription" | "marketing">("product");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(0);
  const [uspUnderstood, setUspUnderstood] = useState(false);
  const [pricePerPack, setPricePerPack] = useState("");
  const [doSubstitute, setDoSubstitute] = useState(false);
  const [substituteWithAndWhy, setSubstituteWithAndWhy] = useState("");
  const [reasonForOos, setReasonForOos] = useState("");
  const [daysOos, setDaysOos] = useState("");
  const [competitors, setCompetitors] = useState([
    { ...EMPTY_COMPETITOR },
    { ...EMPTY_COMPETITOR },
    { ...EMPTY_COMPETITOR },
  ]);

  const [doctorName, setDoctorName] = useState("");
  const [doctorLocation, setDoctorLocation] = useState("");
  const [productName, setProductName] = useState("");
  const [rxPerMonth, setRxPerMonth] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);

  const [compName, setCompName] = useState("");
  const [activity1Desc, setActivity1Desc] = useState("");
  const [activity1Reason, setActivity1Reason] = useState("");
  const [activity2Desc, setActivity2Desc] = useState("");
  const [activity2Reason, setActivity2Reason] = useState("");

  useEffect(() => {
    fetch("/api/mr/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  function resetProductForm() {
    setSelectedProduct("");
    setQty(0);
    setUspUnderstood(false);
    setPricePerPack("");
    setDoSubstitute(false);
    setSubstituteWithAndWhy("");
    setReasonForOos("");
    setDaysOos("");
    setCompetitors([{ ...EMPTY_COMPETITOR }, { ...EMPTY_COMPETITOR }, { ...EMPTY_COMPETITOR }]);
  }

  function resetMarketingForm() {
    setCompName("");
    setActivity1Desc("");
    setActivity1Reason("");
    setActivity2Desc("");
    setActivity2Reason("");
  }

  async function handleProductAudit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const competitorAudits = competitors
      .filter((c) => c.name.trim())
      .map((c) => ({
        competitorName: c.name.trim(),
        competitorStock: c.stock ? parseInt(c.stock, 10) : undefined,
        substitutionReason: c.substitutionReason.trim() || undefined,
        pricePerPack: c.pricePerPack ? parseFloat(c.pricePerPack) : undefined,
      }));

    const result = await createProductAudit({
      visitId,
      productId: selectedProduct,
      quantityInStock: qty,
      uspUnderstood,
      doSubstitute,
      substituteWithAndWhy: substituteWithAndWhy.trim() || undefined,
      reasonForOos: reasonForOos.trim() || undefined,
      daysOos: daysOos ? parseInt(daysOos, 10) : undefined,
      pricePerPack: pricePerPack ? parseFloat(pricePerPack) : undefined,
      competitorAudits: competitorAudits.length > 0 ? competitorAudits : undefined,
    });
    setLoading(false);
    if (result.success) {
      setMessage("Product audit saved.");
      resetProductForm();
    } else {
      setMessage(result.error ?? "Failed");
    }
  }

  async function handlePrescriptionAudit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    let doctorId: string | undefined;
    if (doctorName) {
      const dr = await findOrCreateDoctor(doctorName, doctorLocation);
      doctorId = dr.doctorId ?? undefined;
    }
    let imageUrl: string | undefined;
    if (prescriptionImage) {
      const fd = new FormData();
      fd.set("file", prescriptionImage);
      fd.set("visitId", visitId);
      const res = await fetch("/api/mr/upload-prescription", { method: "POST", body: fd });
      const data = await res.json();
      imageUrl = data.path;
    }
    const result = await createPrescriptionAudit({
      visitId,
      doctorId,
      productName,
      rxPerMonth: rxPerMonth ? parseInt(rxPerMonth, 10) : undefined,
      prescriptionImageUrl: imageUrl,
    });
    setLoading(false);
    if (result.success) {
      setMessage("Prescription audit saved.");
      setDoctorName("");
      setDoctorLocation("");
      setProductName("");
      setRxPerMonth("");
      setPrescriptionImage(null);
    } else {
      setMessage(result.error ?? "Failed");
    }
  }

  async function handleCompetitorMarketing(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await createCompetitorMarketing({
      visitId,
      competitorName: compName,
      activity1Description: activity1Desc.trim() || undefined,
      activity1Reason: activity1Reason.trim() || undefined,
      activity2Description: activity2Desc.trim() || undefined,
      activity2Reason: activity2Reason.trim() || undefined,
    });
    setLoading(false);
    if (result.success) {
      setMessage("Competitor marketing saved.");
      resetMarketingForm();
    } else {
      setMessage(result.error ?? "Failed");
    }
  }

  const isAudit = objective === "AUDIT";

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        {(["product", "prescription", "marketing"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              step === s
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {s === "product" && <Package className="mr-1 inline h-4 w-4" />}
            {s === "prescription" && <FileText className="mr-1 inline h-4 w-4" />}
            {s === "marketing" && <Megaphone className="mr-1 inline h-4 w-4" />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`rounded p-2 text-sm ${
            message.includes("saved") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {step === "product" && (
        <form onSubmit={handleProductAudit} className="space-y-4 rounded-lg border bg-white p-4">
          <h3 className="font-medium">Product Audit</h3>
          <p className="text-sm text-slate-500">
            Select one product at a time, enter quantity stocked (packs), and add up to 3 main competitors.
          </p>
          <div>
            <Label>Product</Label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
          {isAudit && (
            <>
              <div>
                <Label>Price per pack (KES)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={pricePerPack}
                  onChange={(e) => setPricePerPack(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reason for Out of Stock</Label>
                <select
                  value={reasonForOos}
                  onChange={(e) => setReasonForOos(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
                >
                  <option value="">Select reason (optional)</option>
                  {REASON_FOR_OOS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Days Out of Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={daysOos}
                  onChange={(e) => setDaysOos(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="doSubstitute"
                  checked={doSubstitute}
                  onChange={(e) => setDoSubstitute(e.target.checked)}
                />
                <Label htmlFor="doSubstitute">Do you substitute prescriptions?</Label>
              </div>
              {doSubstitute && (
                <div>
                  <Label>What do you substitute with and why?</Label>
                  <Input
                    value={substituteWithAndWhy}
                    onChange={(e) => setSubstituteWithAndWhy(e.target.value)}
                    placeholder="Product and reason"
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usp"
              checked={uspUnderstood}
              onChange={(e) => setUspUnderstood(e.target.checked)}
            />
            <Label htmlFor="usp">Staff understand Product USP?</Label>
          </div>
          <div className="border-t pt-4">
            <Label className="text-slate-600">Up to 3 main competitors (name, stock, reason, price)</Label>
            {competitors.map((c, i) => (
              <div key={i} className="mt-2 grid gap-2 rounded border p-3 sm:grid-cols-2">
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
                  placeholder="Stock (packs)"
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
                  placeholder="Substitution reason"
                  value={c.substitutionReason}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = { ...next[i], substitutionReason: e.target.value };
                    setCompetitors(next);
                  }}
                  className="sm:col-span-2"
                />
                <Input
                  placeholder="Price per pack (KES)"
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
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Audit"}
          </Button>
        </form>
      )}

      {step === "prescription" && (
        <form onSubmit={handlePrescriptionAudit} className="space-y-4 rounded-lg border bg-white p-4">
          <h3 className="font-medium">Prescription Audit (Top 10 Drs per Pharmacy)</h3>
          <p className="text-sm text-slate-500">
            Name of Dr, Location, Product prescribed, Rx per month. Add prescription images as evidence.
          </p>
          <div>
            <Label>Doctor name</Label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Paul Mwangi"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Doctor location</Label>
            <Input
              value={doctorLocation}
              onChange={(e) => setDoctorLocation(e.target.value)}
              placeholder="e.g. Kenyatta, Mbagathi Hospital"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Product prescribed</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              placeholder="e.g. Ulgicid, Maalox"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Rx per month (witnessed or info shared)</Label>
            <Input
              type="number"
              min={0}
              value={rxPerMonth}
              onChange={(e) => setRxPerMonth(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Prescription image (evidence)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPrescriptionImage(e.target.files?.[0] ?? null)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Prescription"}
          </Button>
        </form>
      )}

      {step === "marketing" && (
        <form onSubmit={handleCompetitorMarketing} className="space-y-4 rounded-lg border bg-white p-4">
          <h3 className="font-medium">Competitor Marketing Activity</h3>
          <p className="text-sm text-slate-500">
            What is the competition doing? Activity 1 and Activity 2 (why do you dispense).
          </p>
          <div>
            <Label>Competitor</Label>
            <Input
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              required
              placeholder="e.g. Maalox"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Activity 1 (why do you dispense)</Label>
            <Input
              value={activity1Desc}
              onChange={(e) => setActivity1Desc(e.target.value)}
              placeholder="e.g. Breakfast meeting every Tuesday"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason for Activity 1</Label>
            <Input
              value={activity1Reason}
              onChange={(e) => setActivity1Reason(e.target.value)}
              placeholder="e.g. Communicating on easy to carry"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Activity 2 (why do you dispense)</Label>
            <Input
              value={activity2Desc}
              onChange={(e) => setActivity2Desc(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Reason for Activity 2</Label>
            <Input
              value={activity2Reason}
              onChange={(e) => setActivity2Reason(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
