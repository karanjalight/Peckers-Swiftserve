/**
 * MR Field Intelligence - Type definitions
 */

export type VisitObjective = "AUDIT" | "SALES" | "CAMPAIGN";
export type VisitStatus = "OPEN" | "SUBMITTED";

export interface MrPharmacy {
  id: string;
  name: string;
  region: string;
  sub_region: string | null;
  location_text: string | null;
  procurement_name: string | null;
  procurement_contact: string | null;
  avg_attendants_per_day: number | null;
  created_by: string | null;
}

export interface MrVisit {
  id: string;
  mr_id: string;
  pharmacy_id: string;
  check_in_time: string;
  check_out_time: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  visit_duration_minutes: number | null;
  objective: VisitObjective;
  status: VisitStatus;
  notes: string | null;
  patients_per_day?: number | null;
  basket_value_per_patient?: number | null;
  created_at: string;
}

export interface MrProduct {
  id: string;
  name: string;
  sku: string | null;
  is_company_product: boolean;
}

export interface MrProductAudit {
  id: string;
  visit_id: string;
  product_id: string;
  quantity_in_stock: number;
  usp_understood: boolean;
  do_substitute?: boolean;
  substitute_with_and_why?: string | null;
  reason_for_oos?: string | null;
  days_oos?: number | null;
  price_per_pack?: number | null;
}

export interface MrCompetitorAudit {
  id: string;
  product_audit_id: string;
  competitor_name: string;
  competitor_stock: number | null;
  substitution_reason: string | null;
  price_per_pack?: number | null;
}

export interface MrDoctor {
  id: string;
  name: string;
  location: string | null;
}

export interface MrPrescriptionAudit {
  id: string;
  visit_id: string;
  doctor_id: string | null;
  product_name: string;
  rx_per_month: number | null;
  prescription_image_url: string | null;
}

export interface MrCompetitorMarketing {
  id: string;
  visit_id: string;
  competitor_name: string;
  activity_description: string | null;
  reason_it_works: string | null;
  activity_2_description?: string | null;
  activity_2_reason?: string | null;
}
