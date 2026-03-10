"use server";

import { revalidatePath } from "next/cache";
import {
  getMrAuth,
  requireMrRole,
  requireManagerOrAdmin,
} from "@/lib/mr/supabase-server";
import type { VisitObjective } from "@/lib/mr/types";

// =============================================================================
// MR: CREATE PHARMACY AND CHECK IN (new pharmacy on-the-fly)
// =============================================================================
export async function mrCreatePharmacyAndCheckIn(input: {
  name: string;
  region: string;
  subRegion?: string | null;
  locationText?: string | null;
  procurementName?: string | null;
  procurementContact?: string | null;
  avgAttendantsPerDay?: number | null;
  avgOrderValue?: number | null;
  objective: VisitObjective;
  gpsLat?: number;
  gpsLng?: number;
}) {
  const auth = await requireMrRole();
  if (auth.error) return { success: false, error: auth.error, visitId: null };

  const { supabase } = auth;

  const { data: openVisit } = await supabase
    .from("mr_visits")
    .select("id")
    .eq("mr_id", auth.user.id)
    .eq("status", "OPEN")
    .maybeSingle();

  if (openVisit) {
    return { success: false, error: "You have an open visit. Check out first.", visitId: null };
  }

  const { data: pharmacy, error: phError } = await supabase
    .from("mr_pharmacies")
    .insert({
      name: input.name.trim(),
      region: input.region.trim(),
      sub_region: input.subRegion?.trim() ?? null,
      location_text: input.locationText?.trim() ?? null,
      procurement_name: input.procurementName?.trim() ?? null,
      procurement_contact: input.procurementContact?.trim() ?? null,
      avg_attendants_per_day: input.avgAttendantsPerDay ?? null,
      avg_order_value: input.avgOrderValue ?? null,
      created_by: null,
    })
    .select("id")
    .single();

  if (phError || !pharmacy) {
    return { success: false, error: phError?.message ?? "Failed to create pharmacy", visitId: null };
  }

  const { error: assignError } = await supabase.from("mr_pharmacy_assignments").insert({
    pharmacy_id: pharmacy.id,
    mr_id: auth.user.id,
  });

  if (assignError) {
    return { success: false, error: assignError.message, visitId: null };
  }

  const { data: visit, error: visitError } = await supabase
    .from("mr_visits")
    .insert({
      mr_id: auth.user.id,
      pharmacy_id: pharmacy.id,
      check_in_time: new Date().toISOString(),
      gps_lat: input.gpsLat ?? null,
      gps_lng: input.gpsLng ?? null,
      objective: input.objective,
      status: "OPEN",
    })
    .select("id, check_in_time")
    .single();

  if (visitError || !visit) {
    return { success: false, error: visitError?.message ?? "Failed to start visit", visitId: null };
  }

  revalidatePath("/mr");
  revalidatePath("/mr/pharmacies");
  revalidatePath(`/mr/visit/${visit.id}`);
  return { success: true, visitId: visit.id, checkInTime: visit.check_in_time };
}

// =============================================================================
// CHECK-IN (existing assigned pharmacy)
// =============================================================================
export async function mrCheckIn(input: {
  pharmacyId: string;
  objective: VisitObjective;
  gpsLat?: number;
  gpsLng?: number;
}) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  // Verify MR is assigned to this pharmacy
  const { data: assignment } = await supabase
    .from("mr_pharmacy_assignments")
    .select("id")
    .eq("mr_id", auth.user.id)
    .eq("pharmacy_id", input.pharmacyId)
    .single();

  if (!assignment) {
    return { success: false, error: "Pharmacy not assigned to you" };
  }

  // Check for existing OPEN visit (no double check-in)
  const { data: openVisit } = await supabase
    .from("mr_visits")
    .select("id")
    .eq("mr_id", auth.user.id)
    .eq("status", "OPEN")
    .single();

  if (openVisit) {
    return { success: false, error: "You have an open visit. Check out first." };
  }

  const { data: visit, error } = await supabase
    .from("mr_visits")
    .insert({
      mr_id: auth.user.id,
      pharmacy_id: input.pharmacyId,
      check_in_time: new Date().toISOString(),
      gps_lat: input.gpsLat ?? null,
      gps_lng: input.gpsLng ?? null,
      objective: input.objective,
      status: "OPEN",
    })
    .select("id, check_in_time")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mr");
  revalidatePath("/mr/pharmacies");
  revalidatePath(`/mr/visit/${visit.id}`);
  return { success: true, visitId: visit.id, checkInTime: visit.check_in_time };
}

// =============================================================================
// CHECK-OUT
// =============================================================================
export async function mrCheckOut(visitId: string) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { data: visit, error: fetchError } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (fetchError || !visit) {
    return { success: false, error: "Visit not found" };
  }

  if (visit.mr_id !== auth.user.id) {
    return { success: false, error: "Not your visit" };
  }

  if (visit.status === "SUBMITTED") {
    return { success: false, error: "Visit already submitted" };
  }

  const checkOutTime = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("mr_visits")
    .update({
      check_out_time: checkOutTime,
      status: "SUBMITTED",
    })
    .eq("id", visitId)
    .eq("mr_id", auth.user.id)
    .eq("status", "OPEN");

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/mr");
  revalidatePath("/mr/pharmacies");
  revalidatePath("/mr/history");
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// UPDATE VISIT NOTES (MR: own OPEN only; Manager/Admin: any visit)
// =============================================================================
export async function updateVisitNotes(visitId: string, notes: string) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) {
    return { success: false, error: "Visit not found" };
  }
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  let query = supabase
    .from("mr_visits")
    .update({ notes: notes.trim() || null })
    .eq("id", visitId);
  if (profile.role === "MR") {
    query = query.eq("mr_id", auth.user.id);
  }
  const { error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// UPDATE VISIT AUDIT METRICS (MR: own visit; Manager/Admin: any visit)
// =============================================================================
export async function updateVisitAuditMetrics(
  visitId: string,
  patientsPerDay: number | null,
  basketValuePerPatient: number | null
) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id, objective")
    .eq("id", visitId)
    .single();

  if (!visit) {
    return { success: false, error: "Visit not found" };
  }
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  let query = supabase
    .from("mr_visits")
    .update({
      patients_per_day: patientsPerDay ?? null,
      basket_value_per_patient: basketValuePerPatient ?? null,
    })
    .eq("id", visitId);
  if (profile.role === "MR") {
    query = query.eq("mr_id", auth.user.id);
  }
  const { error } = await query;

  if (error) return { success: false, error: error.message };

  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// PRODUCT AUDIT
// =============================================================================
export async function createProductAudit(input: {
  visitId: string;
  productId: string;
  quantityInStock: number;
  uspUnderstood: boolean;
  reasonWhyStock?: string | null;
  supplier?: string | null;
  quantitySoldGoodMonth?: number | null;
  doSubstitute?: boolean;
  substituteWithAndWhy?: string | null;
  reasonForOos?: string | null;
  daysOos?: number | null;
  pricePerPack?: number | null;
  competitorAudits?: Array<{
    competitorName: string;
    supplier?: string;
    competitorStock?: number;
    stockSoldPerMonth?: number;
    substitutionReason?: string;
    pricePerPack?: number;
    daysOut?: number;
    reasonOutOfStock?: string;
  }>;
}) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit) {
    return { success: false, error: "Visit not found" };
  }
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { data: productAudit, error: paError } = await supabase
    .from("mr_product_audits")
    .insert({
      visit_id: input.visitId,
      product_id: input.productId,
      quantity_in_stock: input.quantityInStock,
      usp_understood: input.uspUnderstood,
      reason_why_stock: input.reasonWhyStock ?? null,
      supplier: input.supplier ?? null,
      quantity_sold_good_month: input.quantitySoldGoodMonth ?? null,
      do_substitute: input.doSubstitute ?? false,
      substitute_with_and_why: input.substituteWithAndWhy ?? null,
      reason_for_oos: input.reasonForOos ?? null,
      days_oos: input.daysOos ?? null,
      price_per_pack: input.pricePerPack ?? null,
    })
    .select("id")
    .single();

  if (paError) {
    return { success: false, error: paError.message };
  }

  // Insert up to 3 competitor audits
  const audits = (input.competitorAudits ?? []).slice(0, 3);
  if (audits.length > 0) {
    const competitorRows = audits.map((c) => ({
      product_audit_id: productAudit.id,
      competitor_name: c.competitorName,
      supplier: c.supplier ?? null,
      competitor_stock: c.competitorStock ?? null,
      stock_sold_per_month: c.stockSoldPerMonth ?? null,
      substitution_reason: c.substitutionReason ?? null,
      price_per_pack: c.pricePerPack ?? null,
      days_out: c.daysOut ?? null,
      reason_out_of_stock: c.reasonOutOfStock ?? null,
    }));

    const { error: caError } = await supabase
      .from("mr_competitor_audits")
      .insert(competitorRows);

    if (caError) {
      return { success: false, error: caError.message };
    }
  }

  revalidatePath(`/mr/visit/${input.visitId}`);
  return { success: true, productAuditId: productAudit.id };
}

// =============================================================================
// GET VISIT AUDITS (for edit UI)
// =============================================================================
export async function getVisitAudits(visitId: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error, data: null };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found", data: null };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Not allowed", data: null };
  }

  const [productRes, prescriptionRes, marketingRes] = await Promise.all([
    supabase
      .from("mr_product_audits")
      .select(`
        id, visit_id, product_id, quantity_in_stock, usp_understood,
        reason_why_stock, supplier, quantity_sold_good_month, price_per_pack, days_oos, reason_for_oos,
        do_substitute, substitute_with_and_why,
        mr_products (id, name),
        mr_competitor_audits (id, competitor_name, supplier, competitor_stock, stock_sold_per_month, substitution_reason, price_per_pack, days_out, reason_out_of_stock)
      `)
      .eq("visit_id", visitId),
    supabase
      .from("mr_prescription_audits")
      .select("id, visit_id, doctor_id, product_name, rx_per_month, prescription_image_url, mr_doctors(id, name, location)")
      .eq("visit_id", visitId),
    supabase
      .from("mr_competitor_marketing")
      .select("id, visit_id, competitor_name, activity_description, reason_it_works, activity_2_description, activity_2_reason")
      .eq("visit_id", visitId),
  ]);

  return {
    success: true,
    error: null,
    data: {
      productAudits: productRes.data ?? [],
      prescriptionAudits: prescriptionRes.data ?? [],
      competitorMarketing: marketingRes.data ?? [],
    },
  };
}

// =============================================================================
// UPDATE PRODUCT AUDIT (and replace competitor audits)
// =============================================================================
export async function updateProductAudit(
  productAuditId: string,
  visitId: string,
  input: {
    productId: string;
    quantityInStock: number;
    uspUnderstood: boolean;
    reasonWhyStock?: string | null;
    supplier?: string | null;
    quantitySoldGoodMonth?: number | null;
    doSubstitute?: boolean;
    substituteWithAndWhy?: string | null;
    reasonForOos?: string | null;
    daysOos?: number | null;
    pricePerPack?: number | null;
    competitorAudits?: Array<{
      competitorName: string;
      supplier?: string;
      competitorStock?: number;
      stockSoldPerMonth?: number;
      substitutionReason?: string;
      pricePerPack?: number;
      daysOut?: number;
      reasonOutOfStock?: string;
    }>;
  }
) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { data: existing } = await supabase
    .from("mr_product_audits")
    .select("id")
    .eq("id", productAuditId)
    .eq("visit_id", visitId)
    .single();

  if (!existing) return { success: false, error: "Product audit not found" };

  const { error: updateError } = await supabase
    .from("mr_product_audits")
    .update({
      product_id: input.productId,
      quantity_in_stock: input.quantityInStock,
      usp_understood: input.uspUnderstood,
      reason_why_stock: input.reasonWhyStock ?? null,
      supplier: input.supplier ?? null,
      quantity_sold_good_month: input.quantitySoldGoodMonth ?? null,
      do_substitute: input.doSubstitute ?? false,
      substitute_with_and_why: input.substituteWithAndWhy ?? null,
      reason_for_oos: input.reasonForOos ?? null,
      days_oos: input.daysOos ?? null,
      price_per_pack: input.pricePerPack ?? null,
    })
    .eq("id", productAuditId)
    .eq("visit_id", visitId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: delError } = await supabase
    .from("mr_competitor_audits")
    .delete()
    .eq("product_audit_id", productAuditId);

  if (delError) return { success: false, error: delError.message };

  const audits = (input.competitorAudits ?? []).slice(0, 3);
  if (audits.length > 0) {
    const rows = audits.map((c) => ({
      product_audit_id: productAuditId,
      competitor_name: c.competitorName,
      supplier: c.supplier ?? null,
      competitor_stock: c.competitorStock ?? null,
      stock_sold_per_month: c.stockSoldPerMonth ?? null,
      substitution_reason: c.substitutionReason ?? null,
      price_per_pack: c.pricePerPack ?? null,
      days_out: c.daysOut ?? null,
      reason_out_of_stock: c.reasonOutOfStock ?? null,
    }));
    const { error: insError } = await supabase.from("mr_competitor_audits").insert(rows);
    if (insError) return { success: false, error: insError.message };
  }

  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// PRESCRIPTION AUDIT
// =============================================================================
export async function createPrescriptionAudit(input: {
  visitId: string;
  doctorId?: string | null;
  productName: string;
  rxPerMonth?: number | null;
  prescriptionImageUrl?: string | null;
}) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit) {
    return { success: false, error: "Visit not found" };
  }
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }
  const productName = (input.productName ?? "").trim();
  if (!productName) {
    return { success: false, error: "Product name is required so the prescription is linked to a product." };
  }

  const { error } = await supabase.from("mr_prescription_audits").insert({
    visit_id: input.visitId,
    doctor_id: input.doctorId ?? null,
    product_name: productName,
    rx_per_month: input.rxPerMonth ?? null,
    prescription_image_url: input.prescriptionImageUrl ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/mr/visit/${input.visitId}`);
  return { success: true };
}

// =============================================================================
// UPDATE PRESCRIPTION AUDIT
// =============================================================================
export async function updatePrescriptionAudit(
  auditId: string,
  visitId: string,
  input: {
    doctorId?: string | null;
    productName: string;
    rxPerMonth?: number | null;
    prescriptionImageUrl?: string | null;
  }
) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_prescription_audits")
    .update({
      doctor_id: input.doctorId ?? null,
      product_name: input.productName.trim(),
      rx_per_month: input.rxPerMonth ?? null,
      prescription_image_url: input.prescriptionImageUrl ?? null,
    })
    .eq("id", auditId)
    .eq("visit_id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// COMPETITOR MARKETING
// =============================================================================
export async function createCompetitorMarketing(input: {
  visitId: string;
  competitorName: string;
  activity1Description?: string | null;
  activity1Reason?: string | null;
  activity2Description?: string | null;
  activity2Reason?: string | null;
}) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit) {
    return { success: false, error: "Visit not found" };
  }
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase.from("mr_competitor_marketing").insert({
    visit_id: input.visitId,
    competitor_name: input.competitorName,
    activity_description: input.activity1Description ?? null,
    reason_it_works: input.activity1Reason ?? null,
    activity_2_description: input.activity2Description ?? null,
    activity_2_reason: input.activity2Reason ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/mr/visit/${input.visitId}`);
  return { success: true };
}

// =============================================================================
// UPDATE COMPETITOR MARKETING
// =============================================================================
export async function updateCompetitorMarketing(
  id: string,
  visitId: string,
  input: {
    competitorName: string;
    activity1Description?: string | null;
    activity1Reason?: string | null;
    activity2Description?: string | null;
    activity2Reason?: string | null;
  }
) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_competitor_marketing")
    .update({
      competitor_name: input.competitorName.trim(),
      activity_description: input.activity1Description ?? null,
      reason_it_works: input.activity1Reason ?? null,
      activity_2_description: input.activity2Description ?? null,
      activity_2_reason: input.activity2Reason ?? null,
    })
    .eq("id", id)
    .eq("visit_id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// DELETE: product audit (cascades to competitor_audits), prescription, marketing, visit
// =============================================================================
export async function deleteProductAudit(visitId: string, productAuditId: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_product_audits")
    .delete()
    .eq("id", productAuditId)
    .eq("visit_id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

export async function deleteCompetitorAudit(competitorAuditId: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };

  const { supabase } = auth;
  const { data: ca } = await supabase
    .from("mr_competitor_audits")
    .select("id, mr_product_audits(visit_id)")
    .eq("id", competitorAuditId)
    .single();

  if (!ca) return { success: false, error: "Competitor audit not found" };

  const { error } = await supabase
    .from("mr_competitor_audits")
    .delete()
    .eq("id", competitorAuditId);

  if (error) return { success: false, error: error.message };
  const pa = ca.mr_product_audits as { visit_id?: string } | null;
  if (pa?.visit_id) revalidatePath(`/mr/visit/${pa.visit_id}`);
  return { success: true };
}

export async function deletePrescriptionAudit(visitId: string, auditId: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_prescription_audits")
    .delete()
    .eq("id", auditId)
    .eq("visit_id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

export async function deleteCompetitorMarketing(visitId: string, id: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (!isManagerOrAdmin && visit.mr_id !== auth.user.id) {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_competitor_marketing")
    .delete()
    .eq("id", id)
    .eq("visit_id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

export async function deleteVisit(visitId: string) {
  const auth = await getMrAuth();
  if (auth.error) return { success: false, error: auth.error };
  const { supabase, profile } = auth;
  const isManagerOrAdmin = profile.role === "MANAGER" || profile.role === "ADMIN";

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit) return { success: false, error: "Visit not found" };
  if (profile.role === "MR" && visit.mr_id !== auth.user.id) {
    return { success: false, error: "You can only delete your own visits" };
  }
  // Manager/Admin scope enforced by RLS

  const { error } = await supabase.from("mr_visits").delete().eq("id", visitId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/mr/visit");
  revalidatePath("/mr/pharmacies");
  revalidatePath("/mr/dashboard");
  revalidatePath("/mr/history");
  return { success: true };
}

// =============================================================================
// CREATE OR GET DOCTOR
// =============================================================================
export async function findOrCreateDoctor(name: string, location?: string) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error, doctorId: null };
  }
  const role = auth.profile.role;
  if (role !== "MR" && role !== "MANAGER" && role !== "ADMIN") {
    return { success: false, error: "Not authorized", doctorId: null };
  }

  const { supabase } = auth;

  const { data: existing } = await supabase
    .from("mr_doctors")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { success: true, doctorId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("mr_doctors")
    .insert({ name, location: location ?? null })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message, doctorId: null };
  }

  return { success: true, doctorId: created.id };
}

// =============================================================================
// MANAGER: CREATE PHARMACY
// =============================================================================
export async function createPharmacy(input: {
  name: string;
  region: string;
  subRegion?: string | null;
  locationText?: string | null;
  procurementName?: string | null;
  procurementContact?: string | null;
  avgAttendantsPerDay?: number | null;
  avgOrderValue?: number | null;
}) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) {
    return { success: false, error: auth.error, pharmacyId: null };
  }

  const { supabase } = auth;
  const isManager = auth.profile.role === "MANAGER";

  const { data: pharmacy, error } = await supabase
    .from("mr_pharmacies")
    .insert({
      name: input.name.trim(),
      region: input.region.trim(),
      sub_region: input.subRegion?.trim() ?? null,
      location_text: input.locationText?.trim() ?? null,
      procurement_name: input.procurementName?.trim() ?? null,
      procurement_contact: input.procurementContact?.trim() ?? null,
      avg_attendants_per_day: input.avgAttendantsPerDay ?? null,
      avg_order_value: input.avgOrderValue ?? null,
      created_by: isManager ? auth.user.id : null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message, pharmacyId: null };
  }

  revalidatePath("/mr/pharmacies");
  return { success: true, pharmacyId: pharmacy.id };
}

// =============================================================================
// UPDATE PHARMACY (Manager/Admin, or MR assigned to pharmacy)
// =============================================================================
export async function updatePharmacy(
  pharmacyId: string,
  input: {
    name: string;
    region: string;
    subRegion?: string | null;
    locationText?: string | null;
    procurementName?: string | null;
    procurementContact?: string | null;
    avgAttendantsPerDay?: number | null;
    avgOrderValue?: number | null;
  }
) {
  const auth = await getMrAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase, profile, user } = auth;
  const role = profile.role;

  let canEdit = false;
  if (role === "ADMIN" || role === "MANAGER") {
    canEdit = true;
  } else if (role === "MR") {
    const { data: assignment } = await supabase
      .from("mr_pharmacy_assignments")
      .select("id")
      .eq("pharmacy_id", pharmacyId)
      .eq("mr_id", user.id)
      .maybeSingle();
    canEdit = !!assignment;
  }

  if (!canEdit) {
    return { success: false, error: "Not authorized to edit this pharmacy" };
  }

  const { error } = await supabase
    .from("mr_pharmacies")
    .update({
      name: input.name.trim(),
      region: input.region.trim(),
      sub_region: input.subRegion?.trim() ?? null,
      location_text: input.locationText?.trim() ?? null,
      procurement_name: input.procurementName?.trim() ?? null,
      procurement_contact: input.procurementContact?.trim() ?? null,
      avg_attendants_per_day: input.avgAttendantsPerDay ?? null,
      avg_order_value: input.avgOrderValue ?? null,
    })
    .eq("id", pharmacyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mr/pharmacies");
  revalidatePath(`/mr/pharmacies/${pharmacyId}`);
  return { success: true };
}

// =============================================================================
// MANAGER: DELETE PHARMACY
// =============================================================================
export async function deletePharmacy(pharmacyId: string) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from("mr_pharmacies")
    .delete()
    .eq("id", pharmacyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mr/pharmacies");
  return { success: true };
}

// =============================================================================
// MANAGER: ASSIGN / UNASSIGN MR TO PHARMACY
// =============================================================================
export async function assignMrToPharmacy(pharmacyId: string, mrId: string) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { error } = await supabase.from("mr_pharmacy_assignments").insert({
    pharmacy_id: pharmacyId,
    mr_id: mrId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mr/pharmacies");
  revalidatePath(`/mr/pharmacies/${pharmacyId}`);
  return { success: true };
}

export async function unassignMrFromPharmacy(pharmacyId: string, mrId: string) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from("mr_pharmacy_assignments")
    .delete()
    .eq("pharmacy_id", pharmacyId)
    .eq("mr_id", mrId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mr/pharmacies");
  revalidatePath(`/mr/pharmacies/${pharmacyId}`);
  return { success: true };
}

// =============================================================================
// PRODUCTS (Managers & Admins) - CRUD for mr_products
// =============================================================================

export async function createMrProduct(input: {
  name: string;
  sku?: string | null;
  isCompanyProduct: boolean;
  price?: number | null;
  ownedBy?: string | null;
}) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) return { success: false, error: auth.error, id: null };

  const { supabase } = auth;

  const { data, error } = await supabase
    .from("mr_products")
    .insert({
      name: input.name.trim(),
      sku: input.sku?.trim() || null,
      is_company_product: input.isCompanyProduct,
      price: input.price ?? null,
      owned_by: input.ownedBy?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message, id: null };

  revalidatePath("/mr/products");
  return { success: true, id: data.id };
}

export async function updateMrProduct(
  id: string,
  input: { name: string; sku?: string | null; isCompanyProduct: boolean; price?: number | null; ownedBy?: string | null }
) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const { supabase } = auth;

  const { error } = await supabase
    .from("mr_products")
    .update({
      name: input.name.trim(),
      sku: input.sku?.trim() || null,
      is_company_product: input.isCompanyProduct,
      price: input.price ?? null,
      owned_by: input.ownedBy?.trim() || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mr/products");
  return { success: true };
}

export async function deleteMrProduct(id: string) {
  const auth = await requireManagerOrAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const { supabase } = auth;

  const { error } = await supabase.from("mr_products").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/mr/products");
  return { success: true };
}
