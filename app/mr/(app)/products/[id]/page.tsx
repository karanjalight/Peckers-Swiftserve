import { notFound, redirect } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/mr/supabase-server";
import { MrProductIntelligenceClient } from "./MrProductIntelligenceClient";

type KpiSummary = {
  totalVisits: number;
  doctorsPrescribing: number;
  competitorMentions: number;
  totalDaysOos: number;
  marketSentiment: "Positive" | "Neutral" | "Negative";
};

type PrescriberRow = {
  doctorName: string;
  specialty?: string | null;
  hospital: string;
  rxPerMonth: number | null;
  lastVisit: string | null;
  mrName: string | null;
};

type CompetitorRow = {
  competitorName: string;
  supplier: string | null;
  mentions: number;
  avgPricePerPack: number | null;
  pressure: "High" | "Medium" | "Low";
  notesSample?: string | null;
   marketingEvents: number;
};

type StockLocationRow = {
  pharmacyName: string;
  region: string;
  oosEvents: number;
  totalDaysOos: number;
  currentStock: number | null;
  lastAudit: string | null;
  avgQtyGoodMonth: number | null;
  avgPricePerPack: number | null;
  volumeLoss: number;
  revenueLoss: number;
};

type StockSummary = {
  totalDaysOos: number;
  mostAffectedRegion: string | null;
  doctorsReportingOos: number;
  locationsWithOos: StockLocationRow[];
};

type ActivityRow = {
  label: string;
  detail: string;
  meta: string;
  tone: "warning" | "info" | "danger";
  date: string | null;
  pharmacy: string | null;
  region: string | null;
  mrName: string | null;
};

type FeedbackRow = {
  mrName: string | null;
  doctorName: string | null;
  pharmacyName: string | null;
  visitDate: string | null;
  notes: string;
  sentiment: "Positive" | "Neutral" | "Negative";
};

export type ProductIntelligenceData = {
  kpis: KpiSummary;
  prescribers: PrescriberRow[];
  competitors: CompetitorRow[];
  stock: StockSummary;
  activities: ActivityRow[];
  feedback: FeedbackRow[];
  charts: {
    rxByMonth: { name: string; prescriptions: number }[];
    competitorMentionsByMonth: { name: string; mentions: number }[];
    oosByMonth: { name: string; daysOos: number }[];
  };
};

export default async function MrProductDetailIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireManagerOrAdmin();
  if (auth.error) redirect("/mr/login");

  const { supabase } = auth;

  const { data: product } = await supabase
    .from("mr_products")
    .select("id, name, sku, owned_by")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // Date window: last 90 days
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  const fromIso = from.toISOString();

  // Fetch underlying audits & visits we need to build product-level analytics
  const [
    productAuditsRes,
    prescriptionAuditsRes,
    competitorAuditsRes,
    competitorMarketingRes,
  ] = await Promise.all([
    supabase
      .from("mr_product_audits")
      .select(
        `
        id,
        visit_id,
        quantity_in_stock,
        days_oos,
        quantity_sold_good_month,
        price_per_pack,
        mr_visits(
          check_in_time,
          notes,
          mr_pharmacies(name, region),
          mr_profiles!mr_id(full_name)
        )
      `
      )
      .eq("product_id", id),
    supabase
      .from("mr_prescription_audits")
      .select(
        `
        id,
        visit_id,
        product_name,
        rx_per_month,
        mr_doctors(name, location),
        mr_visits(
          check_in_time,
          mr_pharmacies(name, region),
          mr_profiles!mr_id(full_name)
        )
      `
      )
      .ilike("product_name", product.name),
    supabase
      .from("mr_competitor_audits")
      .select(
        `
        id,
        competitor_name,
        supplier,
        competitor_stock,
        stock_sold_per_month,
        substitution_reason,
        price_per_pack,
        days_out,
        reason_out_of_stock,
        mr_product_audits(
          id,
          mr_products(name),
          mr_visits(
            check_in_time,
            mr_pharmacies(name, region)
          )
        )
      `
      )
      .limit(1000),
    supabase
      .from("mr_competitor_marketing")
      .select(
        `
        id,
        visit_id,
        competitor_name,
        activity_description,
        reason_it_works,
        activity_2_description,
        activity_2_reason,
        mr_visits(
          check_in_time,
          mr_pharmacies(name, region),
          mr_profiles!mr_id(full_name)
        )
      `
      )
      .limit(500),
  ]);

  const productAudits = (productAuditsRes.data ?? []) as unknown as Array<{
    id: string;
    visit_id: string;
    quantity_in_stock: number;
    days_oos: number | null;
    quantity_sold_good_month: number | null;
    price_per_pack: number | null;
    mr_visits: {
      check_in_time: string;
      notes: string | null;
      mr_pharmacies: { name: string | null; region: string | null } | null;
      mr_profiles: { full_name: string | null } | null;
    } | null;
  }>;

  const prescriptionAudits = (prescriptionAuditsRes.data ?? []) as unknown as Array<{
    id: string;
    visit_id: string;
    product_name: string;
    rx_per_month: number | null;
    mr_doctors:
      | { name: string | null; location: string | null }
      | null;
    mr_visits: {
      check_in_time: string;
      mr_pharmacies: { name: string | null; region: string | null } | null;
      mr_profiles: { full_name: string | null } | null;
    } | null;
  }>;

  const competitorAudits = (competitorAuditsRes.data ?? []) as unknown as Array<{
    id: string;
    competitor_name: string;
    supplier: string | null;
    competitor_stock: number | null;
    stock_sold_per_month: number | null;
    substitution_reason: string | null;
    price_per_pack: number | null;
    days_out: number | null;
    reason_out_of_stock: string | null;
    mr_product_audits: {
      id: string;
      mr_products: { name: string | null } | null;
      mr_visits:
        | {
            check_in_time: string;
            mr_pharmacies: {
              name: string | null;
              region: string | null;
            } | null;
          }
        | null;
    } | null;
  }>;

  const competitorMarketing = (competitorMarketingRes.data ?? []) as unknown as Array<{
    id: string;
    visit_id: string;
    competitor_name: string;
    activity_description: string | null;
    reason_it_works: string | null;
    activity_2_description: string | null;
    activity_2_reason: string | null;
    mr_visits:
      | {
          check_in_time: string;
          mr_pharmacies: { name: string | null; region: string | null } | null;
          mr_profiles: { full_name: string | null } | null;
        }
      | null;
  }>;

  // Restrict everything to last 90 days based on visit check_in_time
  const isWithinWindow = (checkIn: string | null | undefined) =>
    !!checkIn && new Date(checkIn) >= from;

  const productAuditVisits = productAudits.filter((pa) =>
    isWithinWindow(pa.mr_visits?.check_in_time)
  );
  const prescriptionVisits = prescriptionAudits.filter((pr) =>
    isWithinWindow(pr.mr_visits?.check_in_time)
  );

  const visitIdsForProduct = new Set<string>([
    ...productAuditVisits.map((p) => p.visit_id),
    ...prescriptionVisits.map((p) => p.visit_id),
  ]);

  // ---- KPIs ----
  const totalVisits = visitIdsForProduct.size;

  const doctorIdsForProduct = new Set<string>();
  for (const p of prescriptionVisits) {
    const docKey = `${p.mr_doctors?.name ?? "—"}|${p.mr_doctors?.location ?? "—"}`;
    doctorIdsForProduct.add(docKey);
  }
  const doctorsPrescribing = doctorIdsForProduct.size;

  const productNameLower = product.name.trim().toLowerCase();
  const competitorAuditsForProduct = competitorAudits.filter((c) => {
    const prodName =
      c.mr_product_audits?.mr_products?.name?.trim().toLowerCase() ?? "";
    const checkIn = c.mr_product_audits?.mr_visits?.check_in_time;
    return prodName === productNameLower && isWithinWindow(checkIn);
  });
  const competitorMentions = competitorAuditsForProduct.length;

  const totalDaysOos = productAuditVisits.reduce((sum, pa) => {
    const d = pa.days_oos ?? 0;
    return sum + (d > 0 ? d : 0);
  }, 0);

  // Approximate substitution rate for this product
  const totalRxForProduct = prescriptionVisits.reduce(
    (sum, p) => sum + (p.rx_per_month ?? 0),
    0
  );
  const substitutionEventsForProduct = competitorAuditsForProduct.length;
  const substitutionRate =
    totalRxForProduct > 0
      ? (substitutionEventsForProduct / totalRxForProduct) * 100
      : 0;

  let marketSentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
  if (substitutionRate < 10 && totalDaysOos <= 5) {
    marketSentiment = "Positive";
  } else if (substitutionRate > 30 || totalDaysOos > 20) {
    marketSentiment = "Negative";
  }

  const kpis: KpiSummary = {
    totalVisits,
    doctorsPrescribing,
    competitorMentions,
    totalDaysOos,
    marketSentiment,
  };

  // ---- Prescribers table (aggregate per doctor) ----
  const prescriberMap: Record<
    string,
    {
      doctorName: string;
      specialty?: string | null;
      hospital: string;
      rxPerMonth: number;
      lastVisit: string | null;
      mrName: string | null;
    }
  > = {};

  for (const p of prescriptionVisits) {
    const doc = p.mr_doctors;
    const v = p.mr_visits;
    const key = `${doc?.name ?? "—"}|${doc?.location ?? "—"}`;
    const existing = prescriberMap[key];
    const rx = p.rx_per_month ?? 0;
    const visitTime = v?.check_in_time ?? null;

    if (!existing) {
      prescriberMap[key] = {
        doctorName: doc?.name ?? "—",
        specialty: null,
        hospital: v?.mr_pharmacies?.name ?? "—",
        rxPerMonth: rx,
        lastVisit: visitTime,
        mrName: v?.mr_profiles?.full_name ?? null,
      };
    } else {
      existing.rxPerMonth += rx;
      if (
        visitTime &&
        (!existing.lastVisit || new Date(visitTime) > new Date(existing.lastVisit))
      ) {
        existing.lastVisit = visitTime;
        existing.hospital = v?.mr_pharmacies?.name ?? existing.hospital;
        existing.mrName = v?.mr_profiles?.full_name ?? existing.mrName;
      }
    }
  }

  const prescribers: PrescriberRow[] = Object.values(prescriberMap).sort(
    (a, b) => (b.rxPerMonth ?? 0) - (a.rxPerMonth ?? 0)
  );

  // ---- Competitor analysis ----
  const competitorMap: Record<
    string,
    {
      supplier: string | null;
      mentions: number;
      prices: number[];
      notes: string | null;
      marketingEvents: number;
    }
  > = {};
  for (const c of competitorAuditsForProduct) {
    const key = c.competitor_name;
    if (!competitorMap[key]) {
      competitorMap[key] = {
        supplier: c.supplier,
        mentions: 0,
        prices: [],
        notes: c.substitution_reason,
        marketingEvents: 0,
      };
    }
    competitorMap[key].mentions += 1;
    if (c.price_per_pack != null) {
      competitorMap[key].prices.push(c.price_per_pack);
    }
  }

  // Attach marketing insights per competitor (from marketingForProduct)
  const marketingForProduct = competitorMarketing.filter((cm) =>
    visitIdsForProduct.has(cm.visit_id)
  );
  for (const cm of marketingForProduct) {
    const key = cm.competitor_name;
    if (!competitorMap[key]) {
      competitorMap[key] = {
        supplier: null,
        mentions: 0,
        prices: [],
        notes: null,
        marketingEvents: 0,
      };
    }
    if (
      (cm.activity_description && cm.activity_description.trim() !== "") ||
      (cm.activity_2_description && cm.activity_2_description.trim() !== "")
    ) {
      competitorMap[key].marketingEvents += 1;
    }
  }
  const competitors: CompetitorRow[] = Object.entries(competitorMap).map(
    ([name, data]) => {
      const avgPrice =
        data.prices.length > 0
          ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length
          : null;
      const pressure: "High" | "Medium" | "Low" =
        data.mentions >= 10 ? "High" : data.mentions >= 4 ? "Medium" : "Low";
      return {
        competitorName: name,
        supplier: data.supplier ?? null,
        mentions: data.mentions,
        avgPricePerPack: avgPrice,
        pressure,
        notesSample: data.notes,
        marketingEvents: data.marketingEvents,
      };
    }
  );

  // ---- Stock insights ----
  const stockByPharmacy: Record<
    string,
    {
      pharmacyName: string;
      region: string;
      events: number;
      days: number;
      latestAuditAt: string | null;
      latestQuantity: number | null;
      qtySum: number;
      qtyCount: number;
      priceSum: number;
      priceCount: number;
      volumeLossSum: number;
      revenueLossSum: number;
    }
  > = {};
  for (const pa of productAuditVisits) {
    const days = pa.days_oos ?? 0;
    const qty = pa.quantity_sold_good_month ?? 0;
    const price = pa.price_per_pack ?? null;
    const v = pa.mr_visits;
    const phName = v?.mr_pharmacies?.name ?? "Unknown";
    const region = v?.mr_pharmacies?.region ?? "Unknown";
    const key = `${phName}::${region}`;
    if (!stockByPharmacy[key]) {
      stockByPharmacy[key] = {
        pharmacyName: phName,
        region,
        events: 0,
        days: 0,
        latestAuditAt: null,
        latestQuantity: null,
        qtySum: 0,
        qtyCount: 0,
        priceSum: 0,
        priceCount: 0,
        volumeLossSum: 0,
        revenueLossSum: 0,
      };
    }
    // Count an "event" only when there is an OOS recorded
    if (days > 0) {
      stockByPharmacy[key].events += 1;
      stockByPharmacy[key].days += days;
      const qtyGood = Number(qty) || 0;
      const pricePerPack = price != null ? Number(price) : null;
      if (qtyGood > 0) {
        stockByPharmacy[key].qtySum += qtyGood;
        stockByPharmacy[key].qtyCount += 1;
      }
      if (pricePerPack != null) {
        stockByPharmacy[key].priceSum += pricePerPack;
        stockByPharmacy[key].priceCount += 1;
      }
      if (qtyGood > 0 && pricePerPack != null) {
        const volumeLoss = (days / 30) * qtyGood;
        const revenueLoss = volumeLoss * pricePerPack;
        stockByPharmacy[key].volumeLossSum += volumeLoss;
        stockByPharmacy[key].revenueLossSum += revenueLoss;
      }
    }
    const auditTime = v?.check_in_time ?? null;
    if (
      auditTime &&
      (!stockByPharmacy[key].latestAuditAt ||
        new Date(auditTime) > new Date(stockByPharmacy[key].latestAuditAt))
    ) {
      stockByPharmacy[key].latestAuditAt = auditTime;
      stockByPharmacy[key].latestQuantity = pa.quantity_in_stock ?? null;
    }
  }
  const locationsWithOos: StockLocationRow[] = Object.values(stockByPharmacy)
    .sort((a, b) => b.days - a.days)
    .map((row) => ({
      pharmacyName: row.pharmacyName,
      region: row.region,
      oosEvents: row.events,
      totalDaysOos: row.days,
      currentStock: row.latestQuantity ?? null,
      lastAudit: row.latestAuditAt,
      avgQtyGoodMonth:
        row.qtyCount > 0 ? row.qtySum / row.qtyCount : null,
      avgPricePerPack:
        row.priceCount > 0 ? row.priceSum / row.priceCount : null,
      volumeLoss: row.volumeLossSum,
      revenueLoss: row.revenueLossSum,
    }));

  const regionDays: Record<string, number> = {};
  for (const row of locationsWithOos) {
    regionDays[row.region] = (regionDays[row.region] ?? 0) + row.totalDaysOos;
  }
  const mostAffectedRegion =
    Object.entries(regionDays).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // Doctors reporting OOS: distinct doctors on visits where this product had days_oos > 0
  const visitsWithOos = new Set(
    productAuditVisits
      .filter((pa) => (pa.days_oos ?? 0) > 0)
      .map((pa) => pa.visit_id)
  );
  const doctorsReportingOosSet = new Set<string>();
  for (const p of prescriptionVisits) {
    if (!visitsWithOos.has(p.visit_id)) continue;
    const key = `${p.mr_doctors?.name ?? "—"}|${p.mr_doctors?.location ?? "—"}`;
    doctorsReportingOosSet.add(key);
  }

  const stock: StockSummary = {
    totalDaysOos,
    mostAffectedRegion,
    doctorsReportingOos: doctorsReportingOosSet.size,
    locationsWithOos,
  };

  // ---- Charts data (by month) ----
  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const rxByMonthMap: Record<string, number> = {};
  for (const p of prescriptionVisits) {
    const v = p.mr_visits;
    if (!v?.check_in_time) continue;
    const key = monthKey(v.check_in_time);
    const rx = p.rx_per_month ?? 0;
    if (rx <= 0) continue;
    rxByMonthMap[key] = (rxByMonthMap[key] ?? 0) + rx;
  }

  const competitorMentionsByMonthMap: Record<string, number> = {};
  for (const c of competitorAuditsForProduct) {
    const v = c.mr_product_audits?.mr_visits;
    if (!v?.check_in_time) continue;
    const key = monthKey(v.check_in_time);
    competitorMentionsByMonthMap[key] =
      (competitorMentionsByMonthMap[key] ?? 0) + 1;
  }

  const oosByMonthMap: Record<string, number> = {};
  for (const pa of productAuditVisits) {
    const v = pa.mr_visits;
    if (!v?.check_in_time) continue;
    const key = monthKey(v.check_in_time);
    const days = pa.days_oos ?? 0;
    if (days <= 0) continue;
    oosByMonthMap[key] = (oosByMonthMap[key] ?? 0) + days;
  }

  const charts = {
    rxByMonth: Object.entries(rxByMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, prescriptions]) => ({ name, prescriptions })),
    competitorMentionsByMonth: Object.entries(competitorMentionsByMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, mentions]) => ({ name, mentions })),
    oosByMonth: Object.entries(oosByMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, daysOos]) => ({ name, daysOos })),
  };

  // ---- Competitor activity feed ----
  const activities: ActivityRow[] = marketingForProduct
    .filter(
      (cm) =>
        (cm.activity_description && cm.activity_description.trim() !== "") ||
        (cm.activity_2_description && cm.activity_2_description.trim() !== "")
    )
    .slice(0, 20)
    .map((cm, index) => {
      const v = cm.mr_visits;
      const who = v?.mr_profiles?.full_name ?? "MR";
      const where = v?.mr_pharmacies?.name ?? "Unknown pharmacy";
      const baseMeta = `Reported by ${who} · ${where}`;
      const first =
        cm.activity_description ??
        cm.activity_2_description ??
        "Competitor activity";
      const reason = cm.reason_it_works ?? cm.activity_2_reason ?? "";
      const detail = reason ? `${first} — ${reason}` : first;
      const tone: ActivityRow["tone"] =
        index % 3 === 0 ? "warning" : index % 3 === 1 ? "info" : "danger";
      return {
        label: cm.competitor_name,
        detail,
        meta: baseMeta,
        tone,
        date: v?.check_in_time ?? null,
        pharmacy: v?.mr_pharmacies?.name ?? null,
        region: v?.mr_pharmacies?.region ?? null,
        mrName: v?.mr_profiles?.full_name ?? null,
      };
    });

  // ---- Feedback (from visit notes) ----
  const feedback: FeedbackRow[] = [];
  for (const pa of productAuditVisits) {
    const v = pa.mr_visits;
    if (!v?.notes) continue;
    const visitId = pa.visit_id;
    // Try to find a doctor for this visit from prescription audits
    const relatedPrescriptions = prescriptionVisits.filter(
      (p) => p.visit_id === visitId
    );
    const firstRx = relatedPrescriptions[0];
    const mrName = v.mr_profiles?.full_name ?? null;
    const doctorName = firstRx?.mr_doctors?.name ?? null;
    const pharmacyName = v.mr_pharmacies?.name ?? null;
    const visitDate = v.check_in_time ?? null;
    const notes = v.notes ?? "";
    const lower = notes.toLowerCase();
    let sentiment: FeedbackRow["sentiment"] = "Neutral";
    if (lower.includes("excellent") || lower.includes("good") || lower.includes("happy")) {
      sentiment = "Positive";
    } else if (
      lower.includes("poor") ||
      lower.includes("bad") ||
      lower.includes("concern") ||
      lower.includes("issue")
    ) {
      sentiment = "Negative";
    }
    feedback.push({
      mrName,
      doctorName,
      pharmacyName,
      visitDate,
      notes,
      sentiment,
    });
  }

  const data: ProductIntelligenceData = {
    kpis,
    prescribers,
    competitors,
    stock,
    activities,
    feedback,
    charts,
  };

  return (
    <MrProductIntelligenceClient
      product={{
        id: product.id,
        name: product.name,
        sku: product.sku,
        owned_by: product.owned_by,
      }}
      data={data}
    />
  );
}

