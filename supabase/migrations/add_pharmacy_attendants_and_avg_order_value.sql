-- =============================================================================
-- Pharmacy: avg_order_value (avg_attendants_per_day already exists)
-- =============================================================================

ALTER TABLE public.mr_pharmacies
  ADD COLUMN IF NOT EXISTS avg_order_value NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_pharmacies.avg_attendants_per_day IS 'How many people/customers attended per day (average)';
COMMENT ON COLUMN public.mr_pharmacies.avg_order_value IS 'Average order value in KES';
