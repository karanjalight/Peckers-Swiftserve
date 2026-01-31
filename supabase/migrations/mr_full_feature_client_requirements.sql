-- =============================================================================
-- MR Full Feature - Client Requirements
-- Adds: audit metrics, substitution/OOS, pricing, multi-activity marketing
-- Allows: MR to create pharmacies and self-assign for field discovery
-- =============================================================================

-- Add visit-level audit fields (for objective=AUDIT)
ALTER TABLE public.mr_visits
  ADD COLUMN IF NOT EXISTS patients_per_day INT,
  ADD COLUMN IF NOT EXISTS basket_value_per_patient NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_visits.patients_per_day IS 'How many patients pharmacy serves per day (AUDIT only)';
COMMENT ON COLUMN public.mr_visits.basket_value_per_patient IS 'Average basket value per patient in KES (AUDIT only)';

-- Add product audit columns: substitution, OOS, pricing
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

-- Add price to competitor audits
ALTER TABLE public.mr_competitor_audits
  ADD COLUMN IF NOT EXISTS price_per_pack NUMERIC(12, 2);

COMMENT ON COLUMN public.mr_competitor_audits.price_per_pack IS 'Competitor price per pack for comparative pricing';

-- Competitor marketing: support Activity 2 (in addition to activity_description / reason_it_works as Activity 1)
ALTER TABLE public.mr_competitor_marketing
  ADD COLUMN IF NOT EXISTS activity_2_description TEXT,
  ADD COLUMN IF NOT EXISTS activity_2_reason TEXT;

COMMENT ON COLUMN public.mr_competitor_marketing.activity_2_description IS 'Second competitor activity (why do you dispense)';
COMMENT ON COLUMN public.mr_competitor_marketing.activity_2_reason IS 'Reason for activity 2';

-- Update product names to full client spec (by sku for idempotency)
UPDATE public.mr_products SET name = 'Floranorm Sachets (10''s)' WHERE sku = 'FLR-001';
UPDATE public.mr_products SET name = 'Ulgicid Suspension (200ml)' WHERE sku = 'ULG-001';
UPDATE public.mr_products SET name = 'Zefcolin Syrup (100ml)' WHERE sku = 'ZEF-001';
UPDATE public.mr_products SET name = 'Emefilm (4mg)' WHERE sku = 'EME-001';
UPDATE public.mr_products SET name = 'Purecal Tablets (30''s)' WHERE sku = 'PUR-001';

-- Ensure notes on visits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mr_visits' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.mr_visits ADD COLUMN notes TEXT;
  END IF;
END $$;

-- =============================================================================
-- RLS: Allow MR to create pharmacies and self-assign (for discovering new pharmacies)
-- =============================================================================

DROP POLICY IF EXISTS "mr_pharmacies_insert" ON public.mr_pharmacies;
CREATE POLICY "mr_pharmacies_insert" ON public.mr_pharmacies
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND created_by = auth.uid())
    OR (get_mr_role() = 'MR')  -- MR creates pharmacy on-the-fly, created_by null
  );

-- mr_pharmacies SELECT: Manager sees their pharmacies OR pharmacies assigned to their MRs
DROP POLICY IF EXISTS "mr_pharmacies_select" ON public.mr_pharmacies;
CREATE POLICY "mr_pharmacies_select" ON public.mr_pharmacies
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR (get_mr_role() = 'MANAGER' AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.mr_pharmacy_assignments a
          JOIN public.mr_profiles mp ON mp.id = a.mr_id
          WHERE a.pharmacy_id = id AND mp.manager_id = auth.uid()
        )
      ))
      OR (get_mr_role() = 'MR' AND EXISTS (
        SELECT 1 FROM public.mr_pharmacy_assignments a
        WHERE a.pharmacy_id = id AND a.mr_id = auth.uid()
      ))
    )
  );

-- MR can self-assign when creating a new pharmacy
DROP POLICY IF EXISTS "mr_assignments_insert" ON public.mr_pharmacy_assignments;
CREATE POLICY "mr_assignments_insert" ON public.mr_pharmacy_assignments
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
    OR (get_mr_role() = 'MR' AND mr_id = auth.uid())
  );
