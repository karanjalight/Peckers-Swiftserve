"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MR_REGIONS, NAIROBI_SUB_REGIONS } from "@/lib/mr/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  MapPin,
  MapPinHouse,
  Megaphone,
  Phone,
  Search,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";

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

export function CampaignVisitClient({ currentMr }: { currentMr: MrUser }) {
  const searchParams = useSearchParams();
  const pharmacyIdFromUrl = searchParams.get("pharmacyId") ?? undefined;

  const [region, setRegion] = useState<string>(currentMr.region || "");
  const [subRegion, setSubRegion] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacyIdFromUrl || "ph-1",
  );
  const [distributor, setDistributor] = useState<(typeof DISTRIBUTORS)[number]>("Surgipharm");
  const [otherDistributor, setOtherDistributor] = useState("");
  const [telesalesName, setTelesalesName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [nextVisitGoal, setNextVisitGoal] = useState("");
  const [feedback, setFeedback] = useState("");

  const [orderQtyByProduct, setOrderQtyByProduct] = useState<Record<string, number>>({
    p1: calculateRecommendedOrder(DUMMY_PRODUCTS[0].currentStock, DUMMY_PRODUCTS[0].qtyGoodMonth),
    p2: 0,
    p3: 0,
  });
  const [bonusQtyByProduct, setBonusQtyByProduct] = useState<Record<string, number>>({
    p1: 2,
    p2: 0,
    p3: 0,
  });

  const [merchandise, setMerchandise] = useState({
    wobblers: 0,
    posters: 0,
    shelfTalkers: 0,
    flyers: 0,
  });

  const filteredPharmacies = useMemo(() => {
    return DUMMY_PHARMACIES.filter((p) => {
      if (region && p.region !== region) return false;
      if (region === "Nairobi" && subRegion && p.subRegion !== subRegion) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    });
  }, [region, subRegion, search]);

  const selectedPharmacy = useMemo(
    () => filteredPharmacies.find((p) => p.id === selectedPharmacyId) ?? filteredPharmacies[0] ?? null,
    [filteredPharmacies, selectedPharmacyId],
  );

  const campaignMetrics = useMemo(() => {
    const rows = DUMMY_PRODUCTS.map((p) => {
      const coverageDays = calculateDaysCoverage(p.currentStock, p.qtyGoodMonth);
      const lostRevenue = calculateLostRevenue(p.daysOos, p.qtyGoodMonth, p.pricePerPack);
      const recOrder = calculateRecommendedOrder(p.currentStock, p.qtyGoodMonth);
      const orderQty = orderQtyByProduct[p.id] ?? 0;
      const bonusQty = bonusQtyByProduct[p.id] ?? 0;
      const lineValue = orderQty * p.pricePerPack;
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
  }, [orderQtyByProduct, bonusQtyByProduct]);

  const handleOrderQtyChange = (id: string, value: string) => {
    const n = Number(value);
    setOrderQtyByProduct((prev) => ({ ...prev, [id]: Number.isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const handleBonusQtyChange = (id: string, value: string) => {
    const n = Number(value);
    setBonusQtyByProduct((prev) => ({ ...prev, [id]: Number.isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const handleMerchandiseChange = (key: keyof typeof merchandise, value: string) => {
    const n = Number(value);
    setMerchandise((prev) => ({ ...prev, [key]: Number.isNaN(n) ? 0 : Math.max(0, n) }));
  };

  const shareSummaryText = useMemo(() => {
    if (!selectedPharmacy) return "";
    const { rows, totalOrderValue, totalLostRevenue } = campaignMetrics;
    const orderedLines = rows.filter((r) => r.orderQty > 0);
    const header = `Order for ${selectedPharmacy.name} (${selectedPharmacy.region}${
      selectedPharmacy.subRegion ? " - " + selectedPharmacy.subRegion : ""
    })`;
    const lines = orderedLines.map(
      (r) => `${r.name}: ${r.orderQty} packs${r.bonusQty ? ` + ${r.bonusQty} bonus` : ""} @ KES ${
        r.pricePerPack
      } = KES ${r.lineValue.toLocaleString()}`,
    );
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

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 via-white to-slate-50/70 px-3 py-4 sm:px-4 sm:py-6 dark:from-black dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full  flex-col gap-5 sm:gap-6">
        <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-blue-900 via-indigo-600 to-violet-800 text-white shadow-xl">
          <CardContent className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Megaphone className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold sm:text-2xl">
                  Campaign visit – sales & activation
                </h1>
                <p className="max-w-xl text-xs text-sky-100 sm:text-sm">
                  Guided campaign call: outlet profile, key products, financial impact and a shareable
                  order summary in one flow.
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-col items-end gap-2 text-xs text-sky-100/90 sm:mt-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Objective: Sales & Campaign</span>
              </div>
              <p className="text-[11px] sm:text-xs">
                MR: <span className="font-semibold">{currentMr.name}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <MapPinHouse className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Select outlet for campaign visit
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Filter by region, then search or pick the pharmacy you are visiting now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Region
                    </label>
                    <select
                      value={region}
                      onChange={(e) => {
                        setRegion(e.target.value);
                        setSubRegion("");
                      }}
                      className="h-9 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 focus:border-transparent focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    >
                      <option value="">All regions</option>
                      {MR_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  {region === "Nairobi" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        Nairobi sub-region
                      </label>
                      <select
                        value={subRegion}
                        onChange={(e) => setSubRegion(e.target.value)}
                        className="h-9 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 focus:border-transparent focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      >
                        <option value="">All sub-regions</option>
                        {NAIROBI_SUB_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Search by name or location
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="e.g. Salama, Donholm"
                        className="h-9 w-full rounded-2xl border-slate-200 pl-7 pr-3 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Pharmacy
                  </label>
                  <select
                    value={selectedPharmacy?.id ?? ""}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 focus:border-transparent focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                  >
                    {filteredPharmacies.length === 0 && (
                      <option value="">No pharmacies match these filters</option>
                    )}
                    {filteredPharmacies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} • {p.region}
                        {p.subRegion ? ` / ${p.subRegion}` : ""} • {p.location}
                      </option>
                    ))}
                  </select>
                  {filteredPharmacies.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showing {filteredPharmacies.length} outlet
                      {filteredPharmacies.length > 1 ? "s" : ""} in this region.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Outlet profile
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Quick snapshot to guide your conversation: volume, fast movers, minimum reorder
                  levels and last visit notes.
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
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                          KES 145,000
                        </p>
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
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Previous visit notes
                        </p>
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                          Focused on Ulgicid and SwiftPain availability. Outlet requested more
                          educational materials for new staff and better visibility for antacids near
                          the counter.
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Contact & staffing snapshot
                        </p>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a pharmacy above to see its outlet profile.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <Target className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Key products – stock, impact & order
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Maximum 10 key products. The system estimates days of cover, lost sales and a
                  recommended order so you can guide the outlet financially.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="hidden bg-slate-100/80 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700/80 sm:grid sm:grid-cols-[1.5fr_repeat(7,minmax(0,0.9fr))]">
                    <div className="px-3 py-2.5">Product</div>
                    <div className="px-2 py-2.5 text-center">Current</div>
                    <div className="px-2 py-2.5 text-center">Good month</div>
                    <div className="px-2 py-2.5 text-center">Days OOS</div>
                    <div className="px-2 py-2.5 text-center">Days cover</div>
                    <div className="px-2 py-2.5 text-center">Lost sales (KES)</div>
                    <div className="px-2 py-2.5 text-center">Rec. order</div>
                    <div className="px-2 py-2.5 text-center">Order</div>
                    <div className="px-2 py-2.5 text-center">Bonus</div>
                  </div>
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {campaignMetrics.rows.map((row) => (
                      <div
                        key={row.id}
                        className="grid gap-y-1 bg-white/60 px-3 py-2 text-[11px] text-slate-700 ring-1 ring-slate-100/60 last:border-b-0 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800/80 sm:grid-cols-[1.5fr_repeat(7,minmax(0,0.9fr))] sm:items-center sm:px-2 sm:py-1.5"
                      >
                        <div className="space-y-0.5 sm:px-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                            {row.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Min reorder: {row.minReorderQty} packs · Price: KES{" "}
                            {row.pricePerPack.toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 sm:mt-0 sm:block sm:px-1">
                          <span className="font-semibold">{row.currentStock}</span>
                          <span className="hidden text-[10px] text-slate-500 sm:inline">
                            packs
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 sm:mt-0 sm:block sm:px-1">
                          <span className="font-semibold">{row.qtyGoodMonth}</span>
                          <span className="hidden text-[10px] text-slate-500 sm:inline">
                            packs / good month
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 sm:mt-0 sm:block sm:px-1">
                          <span className="font-semibold">{row.daysOos || 0}</span>
                          <span className="hidden text-[10px] text-slate-500 sm:inline">
                            days
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 sm:mt-0 sm:block sm:px-1">
                          <span className="font-semibold">
                            {row.coverageDays ? `${row.coverageDays}` : "—"}
                          </span>
                          <span className="hidden text-[10px] text-slate-500 sm:inline">
                            days cover
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 sm:mt-0 sm:block sm:px-1">
                          <span className="font-semibold">
                            {row.lostRevenue
                              ? `KES ${row.lostRevenue.toLocaleString()}`
                              : "—"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1 text-emerald-700 sm:mt-0 sm:block sm:px-1 dark:text-emerald-300">
                          <span className="font-semibold">
                            {row.recOrder ? `${row.recOrder}` : "—"}
                          </span>
                          <span className="hidden text-[10px] text-slate-500 sm:inline dark:text-slate-400">
                            packs suggested
                          </span>
                        </div>
                        <div className="mt-1 sm:mt-0 sm:px-1">
                          <Input
                            type="number"
                            min={0}
                            value={row.orderQty}
                            onChange={(e) => handleOrderQtyChange(row.id, e.target.value)}
                            className="h-8 w-full rounded-xl border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                        <div className="mt-1 sm:mt-0 sm:px-1">
                          <Input
                            type="number"
                            min={0}
                            value={row.bonusQty}
                            onChange={(e) => handleBonusQtyChange(row.id, e.target.value)}
                            className="h-8 w-full rounded-xl border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-xs ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Financial story you can tell
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      {financialStory || "Fill in days out of stock and good month sales to see an impact story you can share."}
                    </p>
                  </div>
                  <div className="grid gap-1.5 text-[11px] sm:text-xs">
                    <div className="inline-flex items-center justify-end gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        Order value: KES {campaignMetrics.totalOrderValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="inline-flex items-center justify-end gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
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
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Distributor, payment & instructions
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Capture where this order will go, how it will be paid and any delivery notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Distributor
                    </label>
                    <select
                      value={distributor}
                      onChange={(e) => setDistributor(e.target.value as (typeof DISTRIBUTORS)[number])}
                      className="h-9 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 focus:border-transparent focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    >
                      {DISTRIBUTORS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  {distributor === "Other" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Other distributor name
                        </label>
                        <Input
                          value={otherDistributor}
                          onChange={(e) => setOtherDistributor(e.target.value)}
                          placeholder="Type distributor"
                          className="h-9 rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Telesales contact name
                        </label>
                        <Input
                          value={telesalesName}
                          onChange={(e) => setTelesalesName(e.target.value)}
                          placeholder="e.g. Mary, telesales"
                          className="h-9 rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Special instructions (delivery, split invoice, etc.)
                  </label>
                  <Textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="When to deliver, pack sizes, who should receive goods..."
                    className="min-h-[72px] rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Next visit date
                    </label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="date"
                        value={nextVisitDate}
                        onChange={(e) => setNextVisitDate(e.target.value)}
                        className="h-9 w-full rounded-2xl border-slate-200 pl-7 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      What should be different next visit?
                    </label>
                    <Input
                      value={nextVisitGoal}
                      onChange={(e) => setNextVisitGoal(e.target.value)}
                      placeholder="e.g. Ulgicid always in stock, SwiftPain visibility improved"
                      className="h-9 rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Feedback from outlet
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any concerns, competitor activity, service feedback..."
                    className="min-h-[60px] rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <Megaphone className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  Marketing & merchandising
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                  Tick what you left behind and any campaign activity you executed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Merchandise deployed (qty)
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="space-y-0.5">
                        <p className="text-slate-600 dark:text-slate-300">Wobblers</p>
                        <Input
                          type="number"
                          min={0}
                          value={merchandise.wobblers}
                          onChange={(e) => handleMerchandiseChange("wobblers", e.target.value)}
                          className="h-8 rounded-2xl border-slate-200 px-2 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-slate-600 dark:text-slate-300">Posters</p>
                        <Input
                          type="number"
                          min={0}
                          value={merchandise.posters}
                          onChange={(e) => handleMerchandiseChange("posters", e.target.value)}
                          className="h-8 rounded-2xl border-slate-200 px-2 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-slate-600 dark:text-slate-300">Shelf talkers</p>
                        <Input
                          type="number"
                          min={0}
                          value={merchandise.shelfTalkers}
                          onChange={(e) => handleMerchandiseChange("shelfTalkers", e.target.value)}
                          className="h-8 rounded-2xl border-slate-200 px-2 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-slate-600 dark:text-slate-300">Flyers</p>
                        <Input
                          type="number"
                          min={0}
                          value={merchandise.flyers}
                          onChange={(e) => handleMerchandiseChange("flyers", e.target.value)}
                          className="h-8 rounded-2xl border-slate-200 px-2 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Other marketing activity
                    </p>
                    <Textarea
                      placeholder="CPD session, product demo, sponsorship, display rearranged..."
                      className="min-h-[72px] rounded-2xl border-slate-200 text-xs ring-1 ring-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700/80"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-blue-200/80 bg-blue-50 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-50">
                  <BadgeCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  Shareable order summary (dummy)
                </CardTitle>
                <CardDescription className="text-xs text-blue-900/80 dark:text-blue-100/80">
                  This is a mock summary to test the flow. In production it can be turned into a PDF
                  or image and shared via WhatsApp or email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-white/80 px-3 py-2.5 text-xs text-slate-800 ring-1 ring-blue-200/80 dark:bg-slate-950/70 dark:text-slate-100 dark:ring-blue-900/60">
                  <pre className="max-h-48 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                    {shareSummaryText || "Fill in order quantities above to generate a shareable summary."}
                  </pre>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-blue-900/80 dark:text-blue-100/80">
                    Copy this text into WhatsApp group, email, or export to PDF.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-2xl bg-blue-900 px-3 text-[11px] font-semibold text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                      onClick={() => {
                        if (!shareSummaryText) return;
                        navigator.clipboard
                          .writeText(shareSummaryText)
                          .catch(() => undefined);
                      }}
                    >
                      Copy summary
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-2xl border-blue-300 bg-white px-3 text-[11px] font-semibold text-blue-900 hover:bg-blue-50 dark:border-blue-800 dark:bg-transparent dark:text-blue-100 dark:hover:bg-blue-950/40"
                    >
                      Download PDF (stub)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

