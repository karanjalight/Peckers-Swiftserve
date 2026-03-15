-- =============================================================================
-- Add doctor prescribing fields to mr_competitor_audits (per competitor entry)
-- =============================================================================
ALTER TABLE public.mr_competitor_audits
  ADD COLUMN IF NOT EXISTS doctor_prescribing TEXT,
  ADD COLUMN IF NOT EXISTS doctor_location TEXT,
  ADD COLUMN IF NOT EXISTS rx_per_month INT;

COMMENT ON COLUMN public.mr_competitor_audits.doctor_prescribing IS 'Doctor prescribing this competitor product';
COMMENT ON COLUMN public.mr_competitor_audits.doctor_location IS 'Doctor location (e.g. hospital, clinic)';
COMMENT ON COLUMN public.mr_competitor_audits.rx_per_month IS 'Prescriptions per month for this competitor product';
