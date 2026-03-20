/**
 * MR Field Intelligence - Region & Product Constants (Client Spec)
 */

// Regions - dropdown options
export const MR_REGIONS = [
  "Mt Kenya West_meru",
  "Mt.Kenya East",
  "Nyeri",
  "Mombasa",
  "Nakuru-Naivasha",
  "Kisii",
  "Nyanza",
  "Eldoret",
  "Nairobi",
] as const;

// Nairobi sub-regions (shown when region = Nairobi)
export const NAIROBI_SUB_REGIONS = [
  "CBD",
  "Upperhill",
  "Eastlands",
  "Thika",
  "Kiambu",
  "Ngong",
  "Rongai",
] as const;

// Reason for Out of Stock - for Supply Chain Attribution Report
export const REASON_FOR_OOS_OPTIONS = [
  "Wholesaler delayed",
  "Supplier out of stock",
  "Manufacturer stock-out",
  "Insufficient funds",
  "Credit limit reached",
  "Slow moving product",
  "Short expiry / quality concern",
  "Forgot to order",
  "Order placed but not delivered",
  "Import delay",
  "Demand spike",
  "Other",
] as const;

// Reason why pharmacy stocks the product (common options)
export const REASON_WHY_STOCK_OPTIONS = [
  "Doctor recommendations",
  "Patient demand",
  "Competitive pricing",
  "Margin / profitability",
  "Reliable supplier",
  "Marketing support",
  "Product efficacy",
  "Other",
] as const;

// Visit objectives (client labels)
export const VISIT_OBJECTIVES = [
  { value: "AUDIT", label: "Prescription Audit" },
  { value: "SALES", label: "Sales and campaigns" },
  { value: "CAMPAIGN", label: "Sales and campaigns" },
] as const;

// Distributors for order placement (Sales & Campaign)
export const MR_DISTRIBUTORS = [
  "Surgipharm",
  "MediLink",
  "PharmaWorld",
  "Other",
] as const;

export type MrRegion = (typeof MR_REGIONS)[number];
export type NairobiSubRegion = (typeof NAIROBI_SUB_REGIONS)[number];
