-- =============================================================================
-- Allow MR to create pharmacy on-the-fly (New Pharmacy & Check In) and self-assign
-- Fixes: "new row violates row-level security policy for table mr_pharmacies"
-- =============================================================================

-- Ensure helper functions exist (in case mr_rls_manager_scope was not run)
CREATE OR REPLACE FUNCTION public.mr_managed_by_me(p_mr_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mr_profiles
    WHERE id = p_mr_id AND manager_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.pharmacy_created_by_me(p_pharmacy_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mr_pharmacies
    WHERE id = p_pharmacy_id AND created_by = auth.uid()
  );
$$;

-- mr_pharmacies INSERT: allow MR (created_by stays null when MR creates)
DROP POLICY IF EXISTS "mr_pharmacies_insert" ON public.mr_pharmacies;
CREATE POLICY "mr_pharmacies_insert" ON public.mr_pharmacies
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND created_by = auth.uid())
    OR (get_mr_role() = 'MR')   /* MR creates pharmacy during visit; created_by null */
  );

-- mr_pharmacy_assignments INSERT: allow MR to self-assign when they create a pharmacy
DROP POLICY IF EXISTS "mr_assignments_insert" ON public.mr_pharmacy_assignments;
CREATE POLICY "mr_assignments_insert" ON public.mr_pharmacy_assignments
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
    OR (get_mr_role() = 'MR' AND mr_id = auth.uid())   /* MR self-assigns after creating pharmacy */
  );
