-- Ensure mr_visits has basket_value_per_patient (and patients_per_day) for schema cache / APIs
-- Idempotent: safe if mr_full_feature_schema or mr_full_feature_client_requirements already added them

ALTER TABLE public.mr_visits
  ADD COLUMN IF NOT EXISTS patients_per_day INT,
  ADD COLUMN IF NOT EXISTS basket_value_per_patient NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_visits.patients_per_day IS 'How many patients pharmacy serves per day (AUDIT only)';
COMMENT ON COLUMN public.mr_visits.basket_value_per_patient IS 'Average basket value per patient in KES (AUDIT only)';
