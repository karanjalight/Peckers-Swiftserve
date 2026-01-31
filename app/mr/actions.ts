"use server";

import { revalidatePath } from "next/cache";
import { requireMrRole, requireManagerOrAdmin } from "@/lib/mr/supabase-server";
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
// UPDATE VISIT NOTES (MR only, OPEN visits only)
// =============================================================================
export async function updateVisitNotes(visitId: string, notes: string) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", visitId)
    .single();

  if (!visit || visit.mr_id !== auth.user.id || visit.status !== "OPEN") {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_visits")
    .update({ notes: notes.trim() || null })
    .eq("id", visitId)
    .eq("mr_id", auth.user.id)
    .eq("status", "OPEN");

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/mr/visit/${visitId}`);
  return { success: true };
}

// =============================================================================
// UPDATE VISIT AUDIT METRICS (AUDIT objective: patients/day, basket value)
// =============================================================================
export async function updateVisitAuditMetrics(
  visitId: string,
  patientsPerDay: number | null,
  basketValuePerPatient: number | null
) {
  const auth = await requireMrRole();
  if (auth.error) return { success: false, error: auth.error };

  const { supabase } = auth;

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id, objective")
    .eq("id", visitId)
    .single();

  if (!visit || visit.mr_id !== auth.user.id || visit.status !== "OPEN") {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase
    .from("mr_visits")
    .update({
      patients_per_day: patientsPerDay ?? null,
      basket_value_per_patient: basketValuePerPatient ?? null,
    })
    .eq("id", visitId)
    .eq("mr_id", auth.user.id)
    .eq("status", "OPEN");

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
  doSubstitute?: boolean;
  substituteWithAndWhy?: string | null;
  reasonForOos?: string | null;
  daysOos?: number | null;
  pricePerPack?: number | null;
  competitorAudits?: Array<{
    competitorName: string;
    competitorStock?: number;
    substitutionReason?: string;
    pricePerPack?: number;
  }>;
}) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  // Verify visit is OPEN and belongs to MR
  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit || visit.mr_id !== auth.user.id || visit.status !== "OPEN") {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { data: productAudit, error: paError } = await supabase
    .from("mr_product_audits")
    .insert({
      visit_id: input.visitId,
      product_id: input.productId,
      quantity_in_stock: input.quantityInStock,
      usp_understood: input.uspUnderstood,
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
      competitor_stock: c.competitorStock ?? null,
      substitution_reason: c.substitutionReason ?? null,
      price_per_pack: c.pricePerPack ?? null,
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
// PRESCRIPTION AUDIT
// =============================================================================
export async function createPrescriptionAudit(input: {
  visitId: string;
  doctorId?: string | null;
  productName: string;
  rxPerMonth?: number | null;
  prescriptionImageUrl?: string | null;
}) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit || visit.mr_id !== auth.user.id || visit.status !== "OPEN") {
    return { success: false, error: "Invalid or closed visit" };
  }

  const { error } = await supabase.from("mr_prescription_audits").insert({
    visit_id: input.visitId,
    doctor_id: input.doctorId ?? null,
    product_name: input.productName,
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
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  const { supabase } = auth;

  const { data: visit } = await supabase
    .from("mr_visits")
    .select("id, status, mr_id")
    .eq("id", input.visitId)
    .single();

  if (!visit || visit.mr_id !== auth.user.id || visit.status !== "OPEN") {
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
// CREATE OR GET DOCTOR
// =============================================================================
export async function findOrCreateDoctor(name: string, location?: string) {
  const auth = await requireMrRole();
  if (auth.error) {
    return { success: false, error: auth.error, doctorId: null };
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
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message, id: null };

  revalidatePath("/mr/products");
  return { success: true, id: data.id };
}

export async function updateMrProduct(
  id: string,
  input: { name: string; sku?: string | null; isCompanyProduct: boolean }
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
