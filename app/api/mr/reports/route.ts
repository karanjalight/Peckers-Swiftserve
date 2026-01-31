import { NextResponse } from "next/server";
import { getMrAuth } from "@/lib/mr/supabase-server";

export async function GET() {
  const auth = await getMrAuth();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const isManager = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManager) {
    return NextResponse.json({ error: "Manager or Admin required" }, { status: 403 });
  }

  const { supabase } = auth;

  const [visitsRes, productAuditsRes, competitorAuditsRes, prescriptionAuditsRes, competitorMarketingRes] =
    await Promise.all([
      supabase
        .from("mr_visits")
        .select(
          "id, mr_id, check_in_time, check_out_time, visit_duration_minutes, patients_per_day, basket_value_per_patient, mr_pharmacies(name, region), mr_profiles!mr_id(full_name)"
        )
        .eq("status", "SUBMITTED")
        .order("check_in_time", { ascending: false })
        .limit(500),
      supabase
        .from("mr_product_audits")
        .select("id, visit_id, quantity_in_stock, do_substitute, substitute_with_and_why, reason_for_oos, days_oos, price_per_pack, mr_products(name), mr_visits(patients_per_day, basket_value_per_patient, mr_pharmacies(name, region))")
        .limit(1000),
      supabase
        .from("mr_competitor_audits")
        .select("competitor_name, competitor_stock, substitution_reason, price_per_pack, mr_product_audits(mr_products(name), mr_visits(mr_pharmacies(region)))")
        .limit(1000),
      supabase
        .from("mr_prescription_audits")
        .select("product_name, rx_per_month, mr_doctors(name, location), mr_visits(mr_pharmacies(region), mr_profiles!mr_id(full_name))")
        .limit(1000),
      supabase
        .from("mr_competitor_marketing")
        .select("competitor_name, activity_description, reason_it_works, activity_2_description, activity_2_reason")
        .limit(500),
    ]);

  const visits = visitsRes.data ?? [];
  const productAudits = productAuditsRes.data ?? [];
  const competitorAudits = competitorAuditsRes.data ?? [];
  const prescriptionAudits = prescriptionAuditsRes.data ?? [];
  const competitorMarketing = competitorMarketingRes.data ?? [];

  // A. Lost Sales Opportunity
  const lostSales: Array<{
    pharmacy: string;
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
      mr_visits?: { patients_per_day?: number; basket_value_per_patient?: number; mr_pharmacies?: { name?: string; region?: string } };
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

  // D. MR Productivity
  const mrProductivity = (visits as Array<{ visit_duration_minutes?: number | null; mr_profiles?: { full_name?: string }; mr_pharmacies?: { name?: string }; check_in_time?: string }>)
    .filter((v) => v.visit_duration_minutes != null)
    .map((v) => ({
      mr: v.mr_profiles?.full_name ?? "Unknown",
      pharmacy: v.mr_pharmacies?.name ?? "Unknown",
      checkIn: v.check_in_time,
      duration: v.visit_duration_minutes ?? 0,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 50);

  // E. Top Doctors
  const doctorRx: Record<string, { doctor: string; location: string; totalRx: number; products: Set<string>; region?: string }> = {};
  for (const pr of prescriptionAudits) {
    const p = pr as {
      product_name: string;
      rx_per_month?: number | null;
      mr_doctors?: { name?: string; location?: string } | null;
      mr_visits?: { mr_pharmacies?: { region?: string } };
    };
    const key = `${p.mr_doctors?.name ?? "—"}|${p.mr_doctors?.location ?? "—"}`;
    if (!doctorRx[key]) {
      doctorRx[key] = {
        doctor: p.mr_doctors?.name ?? "—",
        location: p.mr_doctors?.location ?? "—",
        totalRx: 0,
        products: new Set(),
        region: p.mr_visits?.mr_pharmacies?.region,
      };
    }
    doctorRx[key].totalRx += p.rx_per_month ?? 0;
    doctorRx[key].products.add(p.product_name);
  }
  const topDoctorsList = Object.values(doctorRx)
    .map((d) => ({ ...d, productCount: d.products.size }))
    .sort((a, b) => b.totalRx - a.totalRx)
    .slice(0, 20)
    .map(({ products, ...rest }) => ({ ...rest }));

  // F. Marketing Insights
  const marketingByCompetitor: Record<string, Array<{ activity: string; reason: string }>> = {};
  for (const cm of competitorMarketing) {
    const c = cm as {
      competitor_name: string;
      activity_description?: string | null;
      reason_it_works?: string | null;
      activity_2_description?: string | null;
      activity_2_reason?: string | null;
    };
    if (!marketingByCompetitor[c.competitor_name]) marketingByCompetitor[c.competitor_name] = [];
    if (c.activity_description) {
      marketingByCompetitor[c.competitor_name].push({
        activity: c.activity_description,
        reason: c.reason_it_works ?? "",
      });
    }
    if (c.activity_2_description) {
      marketingByCompetitor[c.competitor_name].push({
        activity: c.activity_2_description,
        reason: c.activity_2_reason ?? "",
      });
    }
  }

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

  return NextResponse.json({
    lostSales,
    substitutionThreat: substitutionThreatList,
    shareOfVoice,
    mrProductivity,
    topDoctors: topDoctorsList,
    marketingByCompetitor,
    comparativePricing,
    substitutionRateReport,
    supplyChainAttribution,
  });
}
