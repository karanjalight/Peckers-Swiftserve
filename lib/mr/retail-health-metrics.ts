import type { AuditVisitRow } from "./presentation-reports";

export type RetailHealthMetrics = {
  totalAuditVisits: number;
  visitsWithBasketValue: number;
  visitsWithPatients: number;
  /** Mean basket value per patient (KES) where captured */
  avgBasketValueKes: number | null;
  /** Mean patients per day where captured */
  avgPatientsPerDay: number | null;
};

/**
 * Aggregates retail signals from submitted AUDIT visits (basket + patient flow).
 */
export function computeRetailHealthMetrics(
  auditVisits: AuditVisitRow[]
): RetailHealthMetrics {
  const totalAuditVisits = auditVisits.length;

  const basketVals: number[] = [];
  const patientVals: number[] = [];

  for (const v of auditVisits) {
    const b = v.basket_value_per_patient;
    if (b != null && Number(b) > 0) {
      basketVals.push(Number(b));
    }
    const p = v.patients_per_day;
    if (p != null && p > 0) {
      patientVals.push(p);
    }
  }

  const avgBasketValueKes =
    basketVals.length > 0
      ? Math.round(
          (basketVals.reduce((a, x) => a + x, 0) / basketVals.length) * 100
        ) / 100
      : null;

  const avgPatientsPerDay =
    patientVals.length > 0
      ? Math.round(
          (patientVals.reduce((a, x) => a + x, 0) / patientVals.length) * 10
        ) / 10
      : null;

  return {
    totalAuditVisits,
    visitsWithBasketValue: basketVals.length,
    visitsWithPatients: patientVals.length,
    avgBasketValueKes,
    avgPatientsPerDay,
  };
}
