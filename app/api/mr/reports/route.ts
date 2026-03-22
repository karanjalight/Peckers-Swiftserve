import { NextRequest, NextResponse } from "next/server";
import { getMrAuth } from "@/lib/mr/supabase-server";
import { fetchAllByRange } from "@/lib/mr/fetch-all-paginated";

export async function GET(request: NextRequest) {
  const auth = await getMrAuth();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const isManager = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManager) {
    return NextResponse.json({ error: "Manager or Admin required" }, { status: 403 });
  }

  const { supabase } = auth;
  const searchParams = request.nextUrl.searchParams;
  const statusParam = searchParams.get("status") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const regionParam = searchParams.get("region") ?? undefined;
  const mrIdParam = searchParams.get("mrId") ?? undefined;

  const DAYS_OPEN_PER_MONTH = 26;

  const buildVisitsQuery = (rangeFrom: number, rangeTo: number) => {
    let visitsQuery = supabase
      .from("mr_visits")
      .select(
        "id, mr_id, check_in_time, check_out_time, visit_duration_minutes, patients_per_day, basket_value_per_patient, mr_pharmacies(name, region), mr_profiles!mr_id(full_name)"
      )
      .order("check_in_time", { ascending: false })
      .range(rangeFrom, rangeTo);
    if (statusParam && statusParam !== "ALL") visitsQuery = visitsQuery.eq("status", statusParam);
    else if (!statusParam) visitsQuery = visitsQuery.eq("status", "SUBMITTED");
    if (mrIdParam) visitsQuery = visitsQuery.eq("mr_id", mrIdParam);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      visitsQuery = visitsQuery.gte("check_in_time", from.toISOString());
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      visitsQuery = visitsQuery.lte("check_in_time", to.toISOString());
    }
    return visitsQuery;
  };

  const role = auth.profile.role as string;
  const [visitsRes, productAuditsRes, competitorAuditsRes, prescriptionAuditsRes, competitorMarketingRes, catalogProductsRes, pharmaciesRes, mrProfilesRes] =
    await Promise.all([
      fetchAllByRange((from, to) => buildVisitsQuery(from, to)),
      fetchAllByRange((from, to) =>
        supabase
          .from("mr_product_audits")
          .select(
            "id, visit_id, quantity_in_stock, reason_why_stock, supplier, do_substitute, substitute_with_and_why, reason_for_oos, days_oos, price_per_pack, mr_products(name), mr_visits(patients_per_day, basket_value_per_patient, mr_pharmacies(id, name, region))"
          )
          .range(from, to)
      ),
      fetchAllByRange((from, to) =>
        supabase
          .from("mr_competitor_audits")
          .select(
            "competitor_name, supplier, competitor_stock, stock_sold_per_month, substitution_reason, price_per_pack, days_out, reason_out_of_stock, doctor_prescribing, doctor_location, rx_per_month, mr_product_audits(mr_products(name), mr_visits(mr_pharmacies(region)))"
          )
          .range(from, to)
      ),
      fetchAllByRange((from, to) =>
        supabase
          .from("mr_prescription_audits")
          .select(
            "visit_id, product_name, rx_per_month, mr_doctors(name, location), mr_visits(mr_pharmacies(region), mr_profiles!mr_id(full_name))"
          )
          .range(from, to)
      ),
      fetchAllByRange((from, to) =>
        supabase
          .from("mr_competitor_marketing")
          .select(
            "id, visit_id, competitor_name, activity_description, reason_it_works, activity_2_description, activity_2_reason, mr_visits(check_in_time, mr_pharmacies(name, region))"
          )
          .range(from, to)
      ),
      supabase.from("mr_products").select("id, name"),
      supabase
        .from("mr_pharmacies")
        .select("id, name, region, avg_attendants_per_day, avg_order_value"),
      role === "ADMIN"
        ? supabase.from("mr_profiles").select("id, full_name").eq("role", "MR").order("full_name")
        : supabase.from("mr_profiles").select("id, full_name").eq("role", "MR").eq("manager_id", auth.user.id).order("full_name"),
    ]);

  let visits = (visitsRes.data ?? []) as Array<{
    mr_pharmacies?: { name?: string; region?: string } | null;
    [k: string]: unknown;
  }>;
  if (regionParam && visits.length > 0) {
    visits = visits.filter((v) => {
      const ph = Array.isArray(v.mr_pharmacies) ? v.mr_pharmacies[0] : v.mr_pharmacies;
      return (ph as { region?: string } | null)?.region === regionParam;
    });
  }
  const pharmacies = (pharmaciesRes.data ?? []) as Array<{
    id: string;
    name: string;
    region: string | null;
    avg_attendants_per_day?: number | null;
    avg_order_value?: number | null;
  }>;
  const productAudits = productAuditsRes.data ?? [];
  const competitorAudits = competitorAuditsRes.data ?? [];
  const prescriptionAudits = prescriptionAuditsRes.data ?? [];
  const competitorMarketing = competitorMarketingRes.data ?? [];
  const catalogProducts = (catalogProductsRes.data ?? []) as Array<{ id: string; name: string }>;

  // Region coverage: which regions are active and which pharmacies in each
  const regionCoverageMap: Record<string, { pharmacies: Set<string>; visits: number }> = {};
  for (const v of visits) {
    const row = v as {
      mr_pharmacies?: { name?: string; region?: string } | null;
    };
    const ph = row.mr_pharmacies;
    const region = ph?.region ?? "Unknown";
    const pharmacyName = ph?.name ?? "Unknown";
    if (!regionCoverageMap[region]) {
      regionCoverageMap[region] = { pharmacies: new Set<string>(), visits: 0 };
    }
    regionCoverageMap[region].visits += 1;
    regionCoverageMap[region].pharmacies.add(pharmacyName);
  }
  const regionCoverage = Object.entries(regionCoverageMap).map(([region, val]) => ({
    region,
    visits: val.visits,
    pharmacies: Array.from(val.pharmacies),
  }));

  // A. Lost Sales Opportunity
  const lostSales: Array<{
    pharmacy: string;
    pharmacyId: string | null;
    region: string;
    product: string;
    daysOos: number;
    patientsPerDay: number;
    basketValue: number;
    lostRevenue: number;
  }> = [];
  for (const pa of productAudits) {
    const p = pa as unknown as {
      quantity_in_stock: number;
      days_oos?: number | null;
      mr_products?: { name: string } | null;
      mr_visits?: { patients_per_day?: number; basket_value_per_patient?: number; mr_pharmacies?: { id?: string; name?: string; region?: string } };
    };
    if (p.quantity_in_stock === 0 && (p.days_oos ?? 0) > 0) {
      const vRaw = p.mr_visits;
      const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
      const ph = v?.mr_pharmacies;
      const patients = v?.patients_per_day ?? 0;
      const basket = v?.basket_value_per_patient ?? 0;
      const days = p.days_oos ?? 1;
      if (patients > 0 && basket > 0) {
        lostSales.push({
          pharmacy: ph?.name ?? "Unknown",
          pharmacyId: ph?.id ?? null,
          region: ph?.region ?? "Unknown",
          product: (Array.isArray(p.mr_products) ? p.mr_products[0] : p.mr_products)?.name ?? "Unknown",
          daysOos: days,
          patientsPerDay: patients,
          basketValue: basket,
          lostRevenue: patients * basket * days,
        });
      }
    }
  }

  // Stock-out pharmacy list (where at least one audited product was out of stock)
  const stockOutByPharmacy: Record<
    string,
    { pharmacy: string; pharmacyId: string | null; region: string; oosAudits: number; totalDaysOos: number; productSet: Set<string> }
  > = {};
  for (const pa of productAudits) {
    const p = pa as unknown as {
      quantity_in_stock: number;
      days_oos?: number | null;
      mr_products?: { name: string } | null;
      mr_visits?: { mr_pharmacies?: { id?: string; name?: string; region?: string } | Array<{ id?: string; name?: string; region?: string }> } | { mr_pharmacies?: { id?: string; name?: string; region?: string } }[] | null;
    };
    if (p.quantity_in_stock !== 0) continue;
    const vRaw = p.mr_visits;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    const phRaw = v?.mr_pharmacies;
    const ph = Array.isArray(phRaw) ? phRaw[0] : phRaw;
    const pharmacyName = ph?.name ?? "Unknown";
    const region = ph?.region ?? "Unknown";
    const key = `${pharmacyName}::${region}`;
    if (!stockOutByPharmacy[key]) {
      stockOutByPharmacy[key] = {
        pharmacy: pharmacyName,
        pharmacyId: ph?.id ?? null,
        region,
        oosAudits: 0,
        totalDaysOos: 0,
        productSet: new Set<string>(),
      };
    }
    const days = p.days_oos ?? 0;
    stockOutByPharmacy[key].oosAudits += 1;
    stockOutByPharmacy[key].totalDaysOos += days;
    const prod = (Array.isArray(p.mr_products) ? p.mr_products[0] : p.mr_products)?.name;
    if (prod) stockOutByPharmacy[key].productSet.add(prod);
  }
  const stockOutPharmacies = Object.values(stockOutByPharmacy).map((row) => ({
    pharmacy: row.pharmacy,
    pharmacyId: row.pharmacyId,
    region: row.region,
    oosAudits: row.oosAudits,
    distinctProducts: row.productSet.size,
    totalDaysOos: row.totalDaysOos,
  }));

  // B. Substitution Threat Index
  const substitutionThreat: Record<string, { count: number; competitors: Record<string, number> }> = {};
  for (const ca of competitorAudits) {
    const c = ca as { substitution_reason?: string | null; competitor_name: string };
    const reason = (c.substitution_reason?.trim() || "Other") as string;
    if (!substitutionThreat[reason]) substitutionThreat[reason] = { count: 0, competitors: {} };
    substitutionThreat[reason].count++;
    substitutionThreat[reason].competitors[c.competitor_name] =
      (substitutionThreat[reason].competitors[c.competitor_name] ?? 0) + 1;
  }
  const substitutionThreatList = Object.entries(substitutionThreat)
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      topCompetitor: Object.entries(data.competitors).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—",
    }))
    .sort((a, b) => b.count - a.count);

  // C. Share of Voice
  const sovByProduct: Record<string, number> = {};
  let totalRx = 0;
  for (const pr of prescriptionAudits) {
    const p = pr as { product_name: string; rx_per_month?: number | null };
    const rx = p.rx_per_month ?? 0;
    sovByProduct[p.product_name] = (sovByProduct[p.product_name] ?? 0) + rx;
    totalRx += rx;
  }
  const shareOfVoice = Object.entries(sovByProduct)
    .map(([product, rx]) => ({
      product,
      prescribed: rx,
      share: totalRx > 0 ? Math.round((rx / totalRx) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.prescribed - a.prescribed);

  // D. MR Productivity — one row per visit so "Visits per MR" matches Visit History (count all visits; duration optional)
  const mrProductivity = (visits as Array<{ visit_duration_minutes?: number | null; mr_profiles?: { full_name?: string }; mr_pharmacies?: { name?: string }; check_in_time?: string }>)
    .map((v) => ({
      mr: v.mr_profiles?.full_name ?? "Unknown",
      pharmacy: v.mr_pharmacies?.name ?? "Unknown",
      checkIn: v.check_in_time,
      duration: v.visit_duration_minutes ?? 0,
    }))
    .sort((a, b) => (b.checkIn ?? "").localeCompare(a.checkIn ?? ""));

  // E. Top Doctors — join prescription_audits to product via MR visit flow.
  // Build visit -> product names from product_audits (products reviewed at that visit).
  const visitToProductNames: Record<string, Map<string, string>> = {};
  for (const pa of productAudits) {
    const row = pa as { visit_id?: string; mr_products?: { name: string }[] | { name: string } | null };
    const visitId = row.visit_id;
    if (!visitId) continue;
    const name = (Array.isArray(row.mr_products) ? row.mr_products[0] : row.mr_products)?.name?.trim();
    if (!name) continue;
    if (!visitToProductNames[visitId]) visitToProductNames[visitId] = new Map();
    visitToProductNames[visitId].set(name.toLowerCase(), name);
  }
  const catalogNameByLower: Map<string, string> = new Map();
  for (const prod of catalogProducts) {
    const n = (prod.name ?? "").trim();
    if (n) catalogNameByLower.set(n.toLowerCase(), n);
  }
  const resolveProductForPrescription = (visitId: string | undefined, productNameRaw: string): string => {
    const t = (productNameRaw ?? "").trim();
    if (!t) return "";
    const keyLower = t.toLowerCase();
    if (visitId && visitToProductNames[visitId]) {
      const canonical = visitToProductNames[visitId].get(keyLower);
      if (canonical) return canonical;
    }
    return catalogNameByLower.get(keyLower) ?? t;
  };
  const doctorRx: Record<string, { doctor: string; location: string; totalRx: number; products: Set<string>; region?: string }> = {};
  for (const pr of prescriptionAudits) {
    const p = pr as Record<string, unknown>;
    const visitId = (p.visit_id as string) ?? undefined;
    const rawProductName = typeof p.product_name === "string" ? p.product_name : (p.product_name != null ? String(p.product_name) : "");
    const productName = resolveProductForPrescription(visitId, rawProductName) || rawProductName.trim() || "Product (not specified)";
    const doc = (Array.isArray(p.mr_doctors) ? p.mr_doctors[0] : p.mr_doctors) as { name?: string; location?: string } | null | undefined;
    const visits = (Array.isArray(p.mr_visits) ? p.mr_visits[0] : p.mr_visits) as { mr_pharmacies?: { region?: string } } | null | undefined;
    const key = `${doc?.name ?? "—"}|${doc?.location ?? "—"}`;
    if (!doctorRx[key]) {
      doctorRx[key] = {
        doctor: doc?.name ?? "—",
        location: doc?.location ?? "—",
        totalRx: 0,
        products: new Set(),
        region: visits?.mr_pharmacies?.region,
      };
    }
    doctorRx[key].totalRx += (p.rx_per_month as number) ?? 0;
    doctorRx[key].products.add(productName);
  }
  const topDoctorsList = Object.values(doctorRx)
    .map((d) => ({
      doctor: d.doctor,
      location: d.location,
      region: d.region,
      totalRx: d.totalRx,
      productCount: d.products.size,
      products: Array.from(d.products).sort(),
    }))
    .sort((a, b) => b.totalRx - a.totalRx);

  // F. Marketing Insights
  const marketingByCompetitor: Record<string, Array<{ activity: string; reason: string }>> = {};
  const marketingInsightRows: Array<{
    id: string;
    visitId: string;
    competitorName: string;
    slot: "Activity 1" | "Activity 2";
    activity: string;
    reason: string;
    pharmacyName: string;
    region: string;
    visitDate: string;
  }> = [];
  const mentionCountByCompetitor: Record<string, number> = {};

  for (const cm of competitorMarketing) {
    const c = cm as {
      id: string;
      visit_id: string;
      competitor_name: string;
      activity_description?: string | null;
      reason_it_works?: string | null;
      activity_2_description?: string | null;
      activity_2_reason?: string | null;
      mr_visits?:
        | { check_in_time?: string; mr_pharmacies?: { name?: string; region?: string } | { name?: string; region?: string }[] | null }
        | { check_in_time?: string; mr_pharmacies?: { name?: string; region?: string } | { name?: string; region?: string }[] | null }[]
        | null;
    };
    if (!marketingByCompetitor[c.competitor_name]) marketingByCompetitor[c.competitor_name] = [];
    const vRaw = c.mr_visits;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    const phRaw = v?.mr_pharmacies;
    const ph = Array.isArray(phRaw) ? phRaw[0] : phRaw;
    const pharmacyName = ph?.name ?? "—";
    const region = ph?.region ?? "—";
    const visitDate = v?.check_in_time ?? "";

    const bump = (name: string) => {
      mentionCountByCompetitor[name] = (mentionCountByCompetitor[name] ?? 0) + 1;
    };

    if (c.activity_description?.trim()) {
      marketingByCompetitor[c.competitor_name].push({
        activity: c.activity_description,
        reason: c.reason_it_works ?? "",
      });
      marketingInsightRows.push({
        id: `${c.id}-a1`,
        visitId: c.visit_id,
        competitorName: c.competitor_name,
        slot: "Activity 1",
        activity: c.activity_description.trim(),
        reason: (c.reason_it_works ?? "").trim(),
        pharmacyName,
        region,
        visitDate,
      });
      bump(c.competitor_name);
    }
    if (c.activity_2_description?.trim()) {
      marketingByCompetitor[c.competitor_name].push({
        activity: c.activity_2_description,
        reason: c.activity_2_reason ?? "",
      });
      marketingInsightRows.push({
        id: `${c.id}-a2`,
        visitId: c.visit_id,
        competitorName: c.competitor_name,
        slot: "Activity 2",
        activity: c.activity_2_description.trim(),
        reason: (c.activity_2_reason ?? "").trim(),
        pharmacyName,
        region,
        visitDate,
      });
      bump(c.competitor_name);
    }
  }

  marketingInsightRows.sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  const marketingCompetitorMentions = Object.entries(mentionCountByCompetitor)
    .map(([competitor, mentions]) => ({ competitor, mentions }))
    .sort((a, b) => b.mentions - a.mentions);

  // G. Comparative Pricing
  const pricingByProductRegion: Record<string, Record<string, { auditPrices: number[]; competitorPrices: number[] }>> = {};
  for (const pa of productAudits) {
    const p = pa as unknown as {
      price_per_pack?: number | null;
      mr_products?: { name: string } | null;
      mr_visits?: { mr_pharmacies?: { region?: string } };
    };
    const mp = p.mr_products;
    const product = (Array.isArray(mp) ? mp[0] : mp)?.name ?? "Unknown";
    const v = p.mr_visits;
    const region = (Array.isArray(v) ? v[0] : v)?.mr_pharmacies?.region ?? "Unknown";
    if (!pricingByProductRegion[product]) pricingByProductRegion[product] = {};
    if (!pricingByProductRegion[product][region]) {
      pricingByProductRegion[product][region] = { auditPrices: [], competitorPrices: [] };
    }
    if (p.price_per_pack != null) pricingByProductRegion[product][region].auditPrices.push(p.price_per_pack);
  }
  for (const ca of competitorAudits) {
    const c = ca as {
      price_per_pack?: number | null;
      mr_product_audits?: { mr_products?: { name: string }; mr_visits?: { mr_pharmacies?: { region?: string } } };
    };
    const pa = c.mr_product_audits as { mr_products?: { name: string }; mr_visits?: { mr_pharmacies?: { region?: string } } } | undefined;
    const product = pa?.mr_products?.name ?? "Unknown";
    const region = pa?.mr_visits?.mr_pharmacies?.region ?? "Unknown";
    if (c.price_per_pack != null && pricingByProductRegion[product]?.[region]) {
      pricingByProductRegion[product][region].competitorPrices.push(c.price_per_pack);
    }
  }
  const comparativePricing = Object.entries(pricingByProductRegion).flatMap(([product, regions]) =>
    Object.entries(regions).map(([region, data]) => {
      const avgAudit = data.auditPrices.length ? data.auditPrices.reduce((a, b) => a + b, 0) / data.auditPrices.length : null;
      const avgComp = data.competitorPrices.length ? data.competitorPrices.reduce((a, b) => a + b, 0) / data.competitorPrices.length : null;
      return {
        product,
        region,
        avgAuditPrice: avgAudit,
        avgCompetitorPrice: avgComp,
        difference: avgAudit != null && avgComp != null ? avgAudit - avgComp : null,
      };
    })
  );

  // H. Substitution Rate
  const productRx: Record<string, number> = {};
  const productSubstituted: Record<string, { count: number; rivals: Record<string, number> }> = {};
  for (const pr of prescriptionAudits) {
    const p = pr as { product_name: string; rx_per_month?: number | null };
    productRx[p.product_name] = (productRx[p.product_name] ?? 0) + (p.rx_per_month ?? 0);
  }
  for (const ca of competitorAudits) {
    const c = ca as {
      competitor_name: string;
      substitution_reason?: string | null;
      mr_product_audits?: { mr_products?: { name: string } };
    };
    const pa = c.mr_product_audits as { mr_products?: { name: string } } | undefined;
    const product = pa?.mr_products?.name ?? "Audit Product";
    if (!productSubstituted[product]) productSubstituted[product] = { count: 0, rivals: {} };
    productSubstituted[product].count++;
    const rivalKey = `${c.competitor_name}${c.substitution_reason ? ` (${c.substitution_reason})` : ""}`;
    productSubstituted[product].rivals[rivalKey] = (productSubstituted[product].rivals[rivalKey] ?? 0) + 1;
  }
  const allProducts = new Set([...Object.keys(productRx), ...Object.keys(productSubstituted)]);
  const substitutionRateReport = Array.from(allProducts).map((product) => {
    const prescribed = productRx[product] ?? 0;
    const sub = productSubstituted[product];
    const substituted = sub?.count ?? 0;
    const rate = prescribed > 0 ? Math.round((substituted / prescribed) * 1000) / 10 : 0;
    const topRival = sub ? Object.entries(sub.rivals).sort(([, a], [, b]) => b - a)[0] : null;
    return {
      product,
      prescribed,
      substituted,
      rate,
      mainRival: topRival?.[0] ?? "—",
    };
  });

  // Most vulnerable products to substitution (highest substitution rate with meaningful Rx)
  const vulnerableProducts = substitutionRateReport
    .filter((p) => p.prescribed > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 20);

  // I. Supply Chain Attribution
  const oosReasons: Record<string, number> = {};
  for (const pa of productAudits) {
    const p = pa as { quantity_in_stock: number; reason_for_oos?: string | null };
    if (p.quantity_in_stock === 0 && p.reason_for_oos) {
      const reason = (p.reason_for_oos.trim() || "Not specified") as string;
      oosReasons[reason] = (oosReasons[reason] ?? 0) + 1;
    }
  }
  const supplyChainAttribution = Object.entries(oosReasons).map(([name, value]) => ({ name, value }));

  // Pharmacy value from master data (people attended per day × average order value × 26 days)
  const pharmacyValuesFromMaster = pharmacies
    .filter(
      (p) =>
        p.avg_attendants_per_day != null &&
        p.avg_attendants_per_day > 0 &&
        p.avg_order_value != null &&
        p.avg_order_value > 0
    )
    .map((p) => ({
      pharmacyId: p.id,
      pharmacy: p.name,
      region: p.region ?? "—",
      avgAttendantsPerDay: p.avg_attendants_per_day!,
      avgOrderValue: p.avg_order_value!,
      estimatedMonthlyValue:
        (p.avg_attendants_per_day ?? 0) * (p.avg_order_value ?? 0) * DAYS_OPEN_PER_MONTH,
    }))
    .sort((a, b) => b.estimatedMonthlyValue - a.estimatedMonthlyValue);

  const pharmacyList = pharmacies as Array<{ region?: string | null }>;
  const regionSet = new Set(pharmacyList.map((p) => p.region).filter(Boolean));
  const regionOptions = Array.from(regionSet).sort() as string[];
  const mrOptions = (mrProfilesRes?.data ?? []).map((p: { id: string; full_name: string }) => ({ id: p.id, full_name: p.full_name }));

  return NextResponse.json({
    lostSales,
    substitutionThreat: substitutionThreatList,
    shareOfVoice,
    mrProductivity,
    topDoctors: topDoctorsList,
    marketingByCompetitor,
    marketingInsightRows,
    marketingCompetitorMentions,
    comparativePricing,
    substitutionRateReport,
    supplyChainAttribution,
    regionCoverage,
    stockOutPharmacies,
    vulnerableProducts,
    pharmacyValuesFromMaster,
    regionOptions,
    mrOptions,
  });
}
