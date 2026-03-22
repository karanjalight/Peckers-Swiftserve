"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MR_REGIONS, NAIROBI_SUB_REGIONS } from "@/lib/mr/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  MapPin,
  MapPinHouse,
  Megaphone,
  PackagePlus,
  Phone,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";
import { DRAFT_STORAGE_KEY, MR_COMMISSION_RATE, newLineId } from "./components/log-sales-constants";
import { LogSalesToastHost } from "./components/LogSalesToastHost";
import { LogSalesSummaryPanel } from "./components/LogSalesSummaryPanel";
import { PharmacyCombobox } from "./components/PharmacyCombobox";
import { SaleLineCard, type LineFieldErrors, type SaleLine } from "./components/SaleLineCard";
import type { CatalogProduct } from "./components/ProductCombobox";

type MrUser = {
  id: string;
  name: string;
  region: string;
};

type DummyPharmacy = {
  id: string;
  name: string;
  region: string;
  subRegion?: string | null;
  location: string;
  procurementName: string;
  procurementContact: string;
  avgAttendantsPerDay: number;
};

type DummyProduct = {
  id: string;
  name: string;
  minReorderQty: number;
  qtyGoodMonth: number;
  currentStock: number;
  daysOos: number;
  pricePerPack: number;
};

const DUMMY_PHARMACIES: DummyPharmacy[] = [
  {
    id: "ph-1",
    name: "Salama Chemist",
    region: "Nairobi",
    subRegion: "CBD",
    location: "Moi Avenue, opposite Naivas",
    procurementName: "Jane Wanjiru",
    procurementContact: "+254 700 111111",
    avgAttendantsPerDay: 4,
  },
  {
    id: "ph-2",
    name: "Topcare Pharmacy",
    region: "Nairobi",
    subRegion: "Eastlands",
    location: "Donholm, near Shell",
    procurementName: "Peter Otieno",
    procurementContact: "+254 700 222222",
    avgAttendantsPerDay: 3,
  },
  {
    id: "ph-3",
    name: "Nyanza Chemist",
    region: "Nyanza",
    subRegion: null,
    location: "Kisumu CBD, Oginga Odinga Street",
    procurementName: "Achieng A.",
    procurementContact: "+254 700 333333",
    avgAttendantsPerDay: 5,
  },
];

const DUMMY_PRODUCTS: DummyProduct[] = [
  {
    id: "p1",
    name: "Ulgicid 200ml",
    minReorderQty: 24,
    qtyGoodMonth: 60,
    currentStock: 8,
    daysOos: 10,
    pricePerPack: 250,
  },
  {
    id: "p2",
    name: "Peckers Cough Syrup",
    minReorderQty: 18,
    qtyGoodMonth: 40,
    currentStock: 20,
    daysOos: 0,
    pricePerPack: 300,
  },
  {
    id: "p3",
    name: "SwiftPain 400mg",
    minReorderQty: 30,
    qtyGoodMonth: 80,
    currentStock: 12,
    daysOos: 3,
    pricePerPack: 120,
  },
];

const DISTRIBUTORS = ["Surgipharm", "MediLink", "PharmaWorld", "Other"] as const;

const PRODUCT_CATALOG: CatalogProduct[] = DUMMY_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  pricePerPack: p.pricePerPack,
}));

function calculateDaysCoverage(currentStock: number, qtyGoodMonth: number): number {
  if (!currentStock || !qtyGoodMonth) return 0;
  const daily = qtyGoodMonth / 30;
  if (!daily) return 0;
  return Math.round((currentStock / daily) * 10) / 10;
}

function calculateLostRevenue(daysOos: number, qtyGoodMonth: number, pricePerPack: number): number {
  if (!daysOos || !qtyGoodMonth || !pricePerPack) return 0;
  const daily = qtyGoodMonth / 30;
  return Math.round(daily * daysOos * pricePerPack);
}

function calculateRecommendedOrder(currentStock: number, qtyGoodMonth: number, targetDays = 45): number {
  if (!qtyGoodMonth) return 0;
  const daily = qtyGoodMonth / 30;
  if (!daily) return 0;
  const targetQty = daily * targetDays;
  const additional = targetQty - currentStock;
  return Math.max(0, Math.round(additional));
}

type DraftPayload = {
  saleLines: SaleLine[];
  region: string;
  subRegion: string;
  selectedPharmacyId: string;
  distributor: (typeof DISTRIBUTORS)[number];
  otherDistributor: string;
  telesalesName: string;
  specialInstructions: string;
  nextVisitDate: string;
  nextVisitGoal: string;
  feedback: string;
  merchandise: { wobblers: number; posters: number; shelfTalkers: number; flyers: number };
  saleLogDate: string;
};

function validateSaleSubmission(lines: SaleLine[]): {
  ok: boolean;
  byId: Record<string, LineFieldErrors>;
  global?: string;
} {
  if (lines.length === 0) {
    return {
      ok: false,
      byId: {},
      global: "Add at least one sale line, or use Save draft to keep progress.",
    };
  }
  const byId: Record<string, LineFieldErrors> = {};
  let ok = true;
  for (const line of lines) {
    const e: LineFieldErrors = {};
    if (!line.productId) {
      e.product = "Select a product";
      ok = false;
    }
    if (line.quantityOrdered < 0) {
      e.quantity = "Quantity cannot be negative";
      ok = false;
    }
    if (!line.unitPrice || line.unitPrice <= 0) {
      e.price = "Enter a valid unit price";
      ok = false;
    }
    if (Object.keys(e).length) byId[line.id] = e;
  }
  const hasPositiveQty = lines.some((l) => l.productId && l.quantityOrdered > 0);
  if (!hasPositiveQty) {
    return {
      ok: false,
      byId,
      global: "Enter a quantity greater than zero for at least one product.",
    };
  }
  return { ok, byId };
}

export function CampaignVisitClient({ currentMr }: { currentMr: MrUser }) {
  const searchParams = useSearchParams();
  const pharmacyIdFromUrl = searchParams.get("pharmacyId") ?? undefined;

  const [region, setRegion] = useState<string>(currentMr.region || "");
  const [subRegion, setSubRegion] = useState<string>("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacyIdFromUrl || "ph-1",
  );
  const [saleLogDate, setSaleLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [distributor, setDistributor] = useState<(typeof DISTRIBUTORS)[number]>("Surgipharm");
  const [otherDistributor, setOtherDistributor] = useState("");
  const [telesalesName, setTelesalesName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [nextVisitGoal, setNextVisitGoal] = useState("");
  const [feedback, setFeedback] = useState("");

  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [lineErrors, setLineErrors] = useState<Record<string, LineFieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [merchandise, setMerchandise] = useState({
    wobblers: 0,
    posters: 0,
    shelfTalkers: 0,
    flyers: 0,
  });

  const [intelOpen, setIntelOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (pharmacyIdFromUrl) setSelectedPharmacyId(pharmacyIdFromUrl);
  }, [pharmacyIdFromUrl]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY(currentMr.id));
      if (raw) {
        const d = JSON.parse(raw) as Partial<DraftPayload>;
        if (d.saleLines && Array.isArray(d.saleLines)) setSaleLines(d.saleLines);
        if (typeof d.region === "string") setRegion(d.region);
        if (typeof d.subRegion === "string") setSubRegion(d.subRegion);
        if (typeof d.selectedPharmacyId === "string") setSelectedPharmacyId(d.selectedPharmacyId);
        if (d.distributor && DISTRIBUTORS.includes(d.distributor as (typeof DISTRIBUTORS)[number]))
          setDistributor(d.distributor as (typeof DISTRIBUTORS)[number]);
        if (typeof d.otherDistributor === "string") setOtherDistributor(d.otherDistributor);
        if (typeof d.telesalesName === "string") setTelesalesName(d.telesalesName);
        if (typeof d.specialInstructions === "string") setSpecialInstructions(d.specialInstructions);
        if (typeof d.nextVisitDate === "string") setNextVisitDate(d.nextVisitDate);
        if (typeof d.nextVisitGoal === "string") setNextVisitGoal(d.nextVisitGoal);
        if (typeof d.feedback === "string") setFeedback(d.feedback);
        if (d.merchandise && typeof d.merchandise === "object") {
          setMerchandise((prev) => ({
            wobblers: Number(d.merchandise?.wobblers) || prev.wobblers,
            posters: Number(d.merchandise?.posters) || prev.posters,
            shelfTalkers: Number(d.merchandise?.shelfTalkers) || prev.shelfTalkers,
            flyers: Number(d.merchandise?.flyers) || prev.flyers,
          }));
        }
        if (typeof d.saleLogDate === "string") setSaleLogDate(d.saleLogDate);
      }
    } catch {
      /* ignore */
    }
    setDraftHydrated(true);
  }, [currentMr.id]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const filteredPharmacies = useMemo(() => {
    return DUMMY_PHARMACIES.filter((p) => {
      if (region && p.region !== region) return false;
      if (region === "Nairobi" && subRegion && p.subRegion !== subRegion) return false;
      return true;
    });
  }, [region, subRegion]);

  const selectedPharmacy = useMemo(() => {
    const match = filteredPharmacies.find((p) => p.id === selectedPharmacyId);
    return match ?? filteredPharmacies[0] ?? null;
  }, [filteredPharmacies, selectedPharmacyId]);

  useEffect(() => {
    if (!draftHydrated) return;
    if (filteredPharmacies.length === 0) return;
    if (!filteredPharmacies.some((p) => p.id === selectedPharmacyId)) {
      setSelectedPharmacyId(filteredPharmacies[0].id);
    }
  }, [draftHydrated, filteredPharmacies, selectedPharmacyId]);

  const campaignMetrics = useMemo(() => {
    const orderQtyByProduct: Record<string, number> = {};
    const bonusQtyByProduct: Record<string, number> = {};
    const lineValueByProduct: Record<string, number> = {};
    for (const line of saleLines) {
      if (!line.productId) continue;
      orderQtyByProduct[line.productId] =
        (orderQtyByProduct[line.productId] ?? 0) + line.quantityOrdered;
      bonusQtyByProduct[line.productId] =
        (bonusQtyByProduct[line.productId] ?? 0) + line.bonusQuantity;
      lineValueByProduct[line.productId] =
        (lineValueByProduct[line.productId] ?? 0) + line.quantityOrdered * line.unitPrice;
    }

    const rows = DUMMY_PRODUCTS.map((p) => {
      const coverageDays = calculateDaysCoverage(p.currentStock, p.qtyGoodMonth);
      const lostRevenue = calculateLostRevenue(p.daysOos, p.qtyGoodMonth, p.pricePerPack);
      const recOrder = calculateRecommendedOrder(p.currentStock, p.qtyGoodMonth);
      const orderQty = orderQtyByProduct[p.id] ?? 0;
      const bonusQty = bonusQtyByProduct[p.id] ?? 0;
      const lineValue = lineValueByProduct[p.id] ?? 0;
      return {
        ...p,
        coverageDays,
        lostRevenue,
        recOrder,
        orderQty,
        bonusQty,
        lineValue,
      };
    });
    const totalOrderValue = rows.reduce((sum, r) => sum + r.lineValue, 0);
    const totalLostRevenue = rows.reduce((sum, r) => sum + r.lostRevenue, 0);
    return { rows, totalOrderValue, totalLostRevenue };
  }, [saleLines]);

  const shareSummaryText = useMemo(() => {
    if (!selectedPharmacy) return "";
    const { rows, totalOrderValue, totalLostRevenue } = campaignMetrics;
    const orderedLines = rows.filter((r) => r.orderQty > 0);
    const header = `Order for ${selectedPharmacy.name} (${selectedPharmacy.region}${
      selectedPharmacy.subRegion ? " - " + selectedPharmacy.subRegion : ""
    })`;
    const lines = orderedLines.map((r) => {
      const unitDisplay =
        r.orderQty > 0 ? Math.round(r.lineValue / r.orderQty) : r.pricePerPack;
      return `${r.name}: ${r.orderQty} packs${r.bonusQty ? ` + ${r.bonusQty} bonus` : ""} @ KES ${unitDisplay} = KES ${r.lineValue.toLocaleString()}`;
    });
    return [
      header,
      `Total order value: KES ${totalOrderValue.toLocaleString()}`,
      totalLostRevenue
        ? `Estimated lost sales from OOS: ~KES ${totalLostRevenue.toLocaleString()}`
        : undefined,
      "",
      ...lines,
      "",
      `MR: ${currentMr.name}`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [campaignMetrics, currentMr.name, selectedPharmacy]);

  const financialStory = useMemo(() => {
    const highlight = campaignMetrics.rows.find((r) => r.lostRevenue > 0) ?? campaignMetrics.rows[0];
    if (!highlight) return "";
    if (!selectedPharmacy) return "";
    if (!highlight.lostRevenue) return "";
    return `I noticed ${highlight.name} has been out of stock for about ${highlight.daysOos} days at ${
      selectedPharmacy.name
    }. Based on your average sales, that means you may have lost around KES ${highlight.lostRevenue.toLocaleString()} in revenue. Let’s increase your order slightly so you don’t lose that opportunity again.`;
  }, [campaignMetrics.rows, selectedPharmacy]);

  const uniqueProductIds = useMemo(
    () => new Set(saleLines.map((l) => l.productId).filter(Boolean)),
    [saleLines],
  );

  const estimatedCommission = Math.round(campaignMetrics.totalOrderValue * MR_COMMISSION_RATE);

  const handleMerchandiseChange = (key: keyof typeof merchandise, value: string) => {
    const n = Number(value);
    setMerchandise((prev) => ({ ...prev, [key]: Number.isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const addSaleLine = () => {
    setFormError(null);
    setSaleLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        productId: "",
        quantityOrdered: 0,
        bonusQuantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeSaleLine = (id: string) => {
    setSaleLines((prev) => prev.filter((l) => l.id !== id));
    setLineErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFormError(null);
  };

  const updateLine = (id: string, patch: Partial<SaleLine>) => {
    setSaleLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const persistDraft = () => {
    const payload: DraftPayload = {
      saleLines,
      region,
      subRegion,
      selectedPharmacyId,
      distributor,
      otherDistributor,
      telesalesName,
      specialInstructions,
      nextVisitDate,
      nextVisitGoal,
      feedback,
      merchandise,
      saleLogDate,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY(currentMr.id), JSON.stringify(payload));
  };

  const handleSaveDraft = () => {
    persistDraft();
    setToastMessage("Draft saved on this device.");
    setFormError(null);
  };

  const handleSubmitSales = async () => {
    const { ok, byId, global } = validateSaleSubmission(saleLines);
    setLineErrors(byId);
    setFormError(global ?? null);
    if (!ok) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 650));
    setSubmitting(false);
    localStorage.removeItem(DRAFT_STORAGE_KEY(currentMr.id));
    setToastMessage("Sales submitted successfully (demo — no server call).");
    setLineErrors({});
    setFormError(null);
  };

  const formattedLogDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-KE", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(saleLogDate + "T12:00:00"));
    } catch {
      return saleLogDate;
    }
  }, [saleLogDate]);

  return (
    <div className="min-h-svh bg-slate-50/80 pb-28 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50 lg:pb-10">
      <LogSalesToastHost message={toastMessage} onDismiss={dismissToast} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* A. Header */}
        <header className="mb-8 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-900/[0.03] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Field reporting
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                Log sales
              </h1>
              <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
                {selectedPharmacy ? (
                  <>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedPharmacy.name}
                    </span>
                    <span className="text-slate-400"> · </span>
                    {formattedLogDate}
                  </>
                ) : (
                  <>Choose a pharmacy and date for this log.</>
                )}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-[11rem]">
                <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sale date
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={saleLogDate}
                    onChange={(e) => setSaleLogDate(e.target.value)}
                    className="h-11 rounded-xl border-slate-200/90 pl-10 text-sm shadow-sm dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-[2] flex-col gap-2 sm:flex-row sm:items-end">
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:items-end">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Region
                    </label>
                    <select
                      value={region}
                      onChange={(e) => {
                        setRegion(e.target.value);
                        setSubRegion("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">All regions</option>
                      {MR_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  {region === "Nairobi" ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Sub-region
                      </label>
                      <select
                        value={subRegion}
                        onChange={(e) => setSubRegion(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="">All</option>
                        {NAIROBI_SUB_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Pharmacy
                  </label>
                  <PharmacyCombobox
                    pharmacies={filteredPharmacies}
                    value={selectedPharmacy?.id ?? ""}
                    onChange={setSelectedPharmacyId}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={addSaleLine}
                className="h-11 shrink-0 rounded-xl bg-emerald-600 px-5 text-sm font-semibold shadow-md shadow-emerald-900/15 transition hover:bg-emerald-700"
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                Add sale
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* B. Sales entry + secondary */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Sales entry</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Card-based lines — tab through fields for fast entry.
                  </p>
                </div>
              </div>

              {formError ? (
                <div
                  className="mb-4 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {saleLines.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                        <Target className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        No sale lines yet
                      </p>
                      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                        Add a line for each product sold. Search the catalog, set quantity and price — totals
                        update instantly.
                      </p>
                      <Button
                        type="button"
                        onClick={addSaleLine}
                        className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      >
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Add your first sale
                      </Button>
                    </motion.div>
                  ) : (
                    saleLines.map((line, index) => (
                      <motion.div
                        key={line.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      >
                        <SaleLineCard
                          line={line}
                          catalog={PRODUCT_CATALOG}
                          index={index}
                          errors={lineErrors[line.id] ?? {}}
                          onProductChange={(productId, defaultPrice) =>
                            updateLine(line.id, { productId, unitPrice: defaultPrice })
                          }
                          onQuantityChange={(n) => updateLine(line.id, { quantityOrdered: n })}
                          onBonusChange={(n) => updateLine(line.id, { bonusQuantity: n })}
                          onUnitPriceChange={(unitPrice) => updateLine(line.id, { unitPrice })}
                          onRemove={() => removeSaleLine(line.id)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>

            <Collapsible open={intelOpen} onOpenChange={setIntelOpen}>
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-900/50 [&[data-state=open]>svg]:rotate-180">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Target className="h-4 w-4 text-slate-500" />
                      Product intelligence (reference)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Stock cover, lost sales estimate and suggested order — same data as before.
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="hidden bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300 sm:grid sm:grid-cols-[1.5fr_repeat(7,minmax(0,0.9fr))]">
                        <div className="px-3 py-2.5">Product</div>
                        <div className="px-2 py-2.5 text-center">Current</div>
                        <div className="px-2 py-2.5 text-center">Good month</div>
                        <div className="px-2 py-2.5 text-center">Days OOS</div>
                        <div className="px-2 py-2.5 text-center">Days cover</div>
                        <div className="px-2 py-2.5 text-center">Lost (KES)</div>
                        <div className="px-2 py-2.5 text-center">Rec.</div>
                        <div className="px-2 py-2.5 text-center">Order</div>
                        <div className="px-2 py-2.5 text-center">Bonus</div>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {campaignMetrics.rows.map((row) => (
                          <div
                            key={row.id}
                            className="grid gap-y-1 bg-white/80 px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-950/40 dark:text-slate-200 sm:grid-cols-[1.5fr_repeat(7,minmax(0,0.9fr))] sm:items-center"
                          >
                            <div className="space-y-0.5 sm:px-1">
                              <p className="text-xs font-semibold">{row.name}</p>
                              <p className="text-[10px] text-slate-500">
                                Min reorder: {row.minReorderQty} · List KES {row.pricePerPack.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Current</span>
                              <span className="font-semibold">{row.currentStock}</span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Good mo.</span>
                              <span className="font-semibold">{row.qtyGoodMonth}</span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">OOS</span>
                              <span className="font-semibold">{row.daysOos || 0}</span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Cover</span>
                              <span className="font-semibold">
                                {row.coverageDays ? `${row.coverageDays}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Lost</span>
                              <span className="font-semibold">
                                {row.lostRevenue ? `KES ${row.lostRevenue.toLocaleString()}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between text-emerald-700 sm:block sm:px-1 sm:text-center dark:text-emerald-300">
                              <span className="text-slate-500 sm:hidden sm:text-inherit">Rec.</span>
                              <span className="font-semibold">
                                {row.recOrder ? `${row.recOrder}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Order</span>
                              <span className="font-semibold tabular-nums">{row.orderQty}</span>
                            </div>
                            <div className="flex justify-between sm:block sm:px-1 sm:text-center">
                              <span className="text-slate-500 sm:hidden">Bonus</span>
                              <span className="font-semibold tabular-nums">{row.bonusQty}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50/90 px-4 py-3 text-xs dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-slate-600 dark:text-slate-300">
                        {financialStory ||
                          "Fill in days out of stock and good month sales to see an impact story you can share."}
                      </p>
                      <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40">
                          <CircleDollarSign className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            Order value: KES {campaignMetrics.totalOrderValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
                          <TrendingDown className="h-3.5 w-3.5" />
                          <span>
                            Lost sales risk:{" "}
                            {campaignMetrics.totalLostRevenue
                              ? `~KES ${campaignMetrics.totalLostRevenue.toLocaleString()}`
                              : "add OOS days"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-900/50 [&[data-state=open]>svg]:rotate-180">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <MapPinHouse className="h-4 w-4 text-slate-500" />
                      Outlet, distributor & campaign details
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Profile snapshot, logistics, next visit, merchandising and shareable summary.
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                    <Card className="rounded-2xl border-slate-200/80 shadow-none dark:border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          Outlet profile
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Quick snapshot to guide your conversation.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedPharmacy ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-700/80">
                                <p className="font-medium text-slate-600 dark:text-slate-300">
                                  Historical order volume
                                </p>
                                <p className="mt-1 text-lg font-semibold">KES 145,000</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Average per month (last 6 months)
                                </p>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-700/80">
                                <p className="font-medium text-slate-600 dark:text-slate-300">
                                  Fast moving products
                                </p>
                                <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                  <li>• SwiftPain 400mg – 80 packs / month</li>
                                  <li>• Ulgicid 200ml – 60 packs / month</li>
                                  <li>• Peckers Cough – 40 packs / month</li>
                                </ul>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-700/80">
                                <p className="font-medium text-slate-600 dark:text-slate-300">
                                  Minimum reorder by quantity
                                </p>
                                <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                  <li>• Ulgicid – 24 packs</li>
                                  <li>• SwiftPain – 30 packs</li>
                                  <li>• Cough Syrup – 18 packs</li>
                                </ul>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium">Previous visit notes</p>
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                                  Focused on Ulgicid and SwiftPain availability. Outlet requested more
                                  educational materials for new staff and better visibility for antacids near
                                  the counter.
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium">Contact & staffing</p>
                                <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-700/80">
                                  <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-medium">{selectedPharmacy.procurementName}</span>
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    {selectedPharmacy.procurementContact}
                                  </p>
                                  <p className="mt-1.5 text-[11px] text-slate-500">
                                    Attendants per day:{" "}
                                    <span className="font-semibold">
                                      {selectedPharmacy.avgAttendantsPerDay || "—"}
                                    </span>
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Location: {selectedPharmacy.location}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">Select a pharmacy in the header.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-none dark:border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          Distributor, payment & instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Distributor</label>
                          <select
                            value={distributor}
                            onChange={(e) => setDistributor(e.target.value as (typeof DISTRIBUTORS)[number])}
                            className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950"
                          >
                            {DISTRIBUTORS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        {distributor === "Other" ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium">Other distributor</label>
                              <Input
                                value={otherDistributor}
                                onChange={(e) => setOtherDistributor(e.target.value)}
                                placeholder="Name"
                                className="h-11 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium">Telesales contact</label>
                              <Input
                                value={telesalesName}
                                onChange={(e) => setTelesalesName(e.target.value)}
                                placeholder="e.g. Mary"
                                className="h-11 rounded-xl"
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Special instructions</label>
                          <Textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Delivery, split invoice…"
                            className="min-h-[72px] rounded-xl"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">Next visit date</label>
                            <Input
                              type="date"
                              value={nextVisitDate}
                              onChange={(e) => setNextVisitDate(e.target.value)}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">Goal next visit</label>
                            <Input
                              value={nextVisitGoal}
                              onChange={(e) => setNextVisitGoal(e.target.value)}
                              placeholder="e.g. Ulgicid always in stock"
                              className="h-11 rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Feedback from outlet</label>
                          <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Concerns, competitor activity…"
                            className="min-h-[60px] rounded-xl"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200/80 shadow-none dark:border-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <Megaphone className="h-4 w-4 text-slate-500" />
                          Marketing & merchandising
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {(
                              [
                                ["wobblers", "Wobblers"],
                                ["posters", "Posters"],
                                ["shelfTalkers", "Shelf talkers"],
                                ["flyers", "Flyers"],
                              ] as const
                            ).map(([key, label]) => (
                              <div key={key} className="space-y-0.5">
                                <p className="text-slate-600 dark:text-slate-300">{label}</p>
                                <Input
                                  type="number"
                                  min={0}
                                  value={merchandise[key]}
                                  onChange={(e) => handleMerchandiseChange(key, e.target.value)}
                                  className="h-9 rounded-xl"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium">Other marketing activity</p>
                            <Textarea
                              placeholder="CPD session, demo, display rearranged…"
                              className="min-h-[72px] rounded-xl"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-emerald-200/60 bg-emerald-50/40 shadow-none dark:border-emerald-900/40 dark:bg-emerald-950/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                          <BadgeCheck className="h-4 w-4" />
                          Shareable order summary (dummy)
                        </CardTitle>
                        <CardDescription className="text-xs text-emerald-900/80 dark:text-emerald-100/80">
                          Mock summary for WhatsApp / email — same copy logic as before.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-xl bg-white/90 px-3 py-2.5 text-xs ring-1 ring-emerald-200/80 dark:bg-slate-950/70 dark:ring-emerald-900/50">
                          <pre className="max-h-48 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                            {shareSummaryText || "Add sale lines to generate a shareable summary."}
                          </pre>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
                            onClick={() => {
                              if (!shareSummaryText) return;
                              void navigator.clipboard.writeText(shareSummaryText);
                              setToastMessage("Summary copied to clipboard.");
                            }}
                          >
                            Copy summary
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-9 rounded-xl">
                            Download PDF (stub)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* C. Summary — desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <LogSalesSummaryPanel
                totalAmount={campaignMetrics.totalOrderValue}
                productCount={uniqueProductIds.size}
                lineCount={saleLines.length}
                estimatedCommission={estimatedCommission}
                submitting={submitting}
                onSubmit={handleSubmitSales}
                onSaveDraft={handleSaveDraft}
              />
              <p className="mt-4 flex items-center gap-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                Demo flow — totals sync with sale lines and intelligence table.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              KES {campaignMetrics.totalOrderValue.toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-3 text-xs"
              onClick={handleSaveDraft}
            >
              Draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-semibold hover:bg-emerald-700"
              onClick={handleSubmitSales}
              disabled={submitting}
            >
              {submitting ? "…" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
