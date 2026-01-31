-- =============================================================================
-- Add full-feature columns to mr_product_audits, mr_competitor_audits,
-- mr_competitor_marketing (if missing). Fixes schema cache errors.
-- =============================================================================

-- mr_product_audits: substitution, OOS, pricing
ALTER TABLE public.mr_product_audits
  ADD COLUMN IF NOT EXISTS do_substitute BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS substitute_with_and_why TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_oos TEXT,
  ADD COLUMN IF NOT EXISTS days_oos INT,
  ADD COLUMN IF NOT EXISTS price_per_pack NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_product_audits.do_substitute IS 'Do they substitute prescriptions for this product?';
COMMENT ON COLUMN public.mr_product_audits.substitute_with_and_why IS 'What do they substitute with and why';
COMMENT ON COLUMN public.mr_product_audits.reason_for_oos IS 'Reason for out of stock (Supply Chain report)';
COMMENT ON COLUMN public.mr_product_audits.days_oos IS 'Days product was out of stock';
COMMENT ON COLUMN public.mr_product_audits.price_per_pack IS 'Price per pack in KES (comparative pricing)';

-- mr_competitor_audits: price for comparative pricing
ALTER TABLE public.mr_competitor_audits
  ADD COLUMN IF NOT EXISTS price_per_pack NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_competitor_audits.price_per_pack IS 'Competitor price per pack for comparative pricing';

-- mr_competitor_marketing: second activity (Activity 2)
ALTER TABLE public.mr_competitor_marketing
  ADD COLUMN IF NOT EXISTS activity_2_description TEXT,
  ADD COLUMN IF NOT EXISTS activity_2_reason TEXT;

COMMENT ON COLUMN public.mr_competitor_marketing.activity_2_description IS 'Second competitor activity (why do you dispense)';
COMMENT ON COLUMN public.mr_competitor_marketing.activity_2_reason IS 'Reason for activity 2';
