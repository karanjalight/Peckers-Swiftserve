import type {
  AuditedPharmacyDetailRow,
  OutOfStockDetailRow,
  RegionalAuditSummaryRow,
} from "@/lib/mr/presentation-reports";
import type {
  OosRatioPerProductRow,
  PharmacyMarketShareRow,
  TopPrescribersPerProductRow,
} from "@/lib/mr/presentation-reports-advanced";

export type PresentationReportsProps = {
  regionalAuditSummary: RegionalAuditSummaryRow[];
  auditedPharmaciesDetail: AuditedPharmacyDetailRow[];
  outOfStockDetail: OutOfStockDetailRow[];
  oosRatioPerProduct: OosRatioPerProductRow[];
  pharmacyMarketShareEstimate: PharmacyMarketShareRow[];
  topPrescribersPerProduct: TopPrescribersPerProductRow[];
};
