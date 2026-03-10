-- =============================================================================
-- MR RLS: Manager scope - Managers see only their MRs and their pharmacies
-- No role can UPDATE or DELETE visit reports (read-only after submission).
-- =============================================================================

-- Helper: Is the given MR managed by the current user (manager_id = auth.uid())?
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

-- Helper: Was the given pharmacy created by the current user?
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

-- =============================================================================
-- MR_PROFILES: Manager sees self + MRs they manage; Admin sees all
-- =============================================================================
DROP POLICY IF EXISTS "mr_profiles_select_own" ON public.mr_profiles;

CREATE POLICY "mr_profiles_select_own" ON public.mr_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND (id = auth.uid() OR manager_id = auth.uid()))
  );

-- =============================================================================
-- MR_PHARMACIES: Manager sees/creates/updates only their pharmacies; Admin all
-- =============================================================================
DROP POLICY IF EXISTS "mr_pharmacies_select" ON public.mr_pharmacies;
DROP POLICY IF EXISTS "mr_pharmacies_insert_admin" ON public.mr_pharmacies;
DROP POLICY IF EXISTS "mr_pharmacies_update_admin" ON public.mr_pharmacies;

-- SELECT: MR sees pharmacies they are assigned to (via join in app); Manager sees created_by = self; Admin sees all
CREATE POLICY "mr_pharmacies_select" ON public.mr_pharmacies
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR get_mr_role() = 'MANAGER' AND created_by = auth.uid()
      OR (get_mr_role() = 'MR' AND EXISTS (
        SELECT 1 FROM public.mr_pharmacy_assignments a
        WHERE a.pharmacy_id = id AND a.mr_id = auth.uid()
      ))
    )
  );

-- INSERT: Manager can create (created_by = self); Admin can create
CREATE POLICY "mr_pharmacies_insert" ON public.mr_pharmacies
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND created_by = auth.uid())
  );

-- UPDATE: Admin all; Manager only their pharmacies; MR when assigned to pharmacy
CREATE POLICY "mr_pharmacies_update" ON public.mr_pharmacies
  FOR UPDATE USING (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND created_by = auth.uid())
    OR (
      get_mr_role() = 'MR'
      AND EXISTS (
        SELECT 1 FROM public.mr_pharmacy_assignments a
        WHERE a.pharmacy_id = id AND a.mr_id = auth.uid()
      )
    )
  );

-- DELETE: Admin any pharmacy; Manager only pharmacies they created
CREATE POLICY "mr_pharmacies_delete" ON public.mr_pharmacies
  FOR DELETE USING (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND created_by = auth.uid())
  );

-- =============================================================================
-- MR_PHARMACY_ASSIGNMENTS: Manager manages assignments for their MRs + pharmacies
-- =============================================================================
DROP POLICY IF EXISTS "mr_assignments_select" ON public.mr_pharmacy_assignments;
DROP POLICY IF EXISTS "mr_assignments_insert_admin" ON public.mr_pharmacy_assignments;
DROP POLICY IF EXISTS "mr_assignments_update_admin" ON public.mr_pharmacy_assignments;
DROP POLICY IF EXISTS "mr_assignments_delete_admin" ON public.mr_pharmacy_assignments;

CREATE POLICY "mr_assignments_select" ON public.mr_pharmacy_assignments
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
      OR (get_mr_role() = 'MR' AND mr_id = auth.uid())
    )
  );

CREATE POLICY "mr_assignments_insert" ON public.mr_pharmacy_assignments
  FOR INSERT WITH CHECK (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
  );

CREATE POLICY "mr_assignments_update" ON public.mr_pharmacy_assignments
  FOR UPDATE USING (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
  );

CREATE POLICY "mr_assignments_delete" ON public.mr_pharmacy_assignments
  FOR DELETE USING (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND pharmacy_created_by_me(pharmacy_id) AND mr_managed_by_me(mr_id))
  );

-- =============================================================================
-- MR_VISITS: Manager sees only visits by MRs they manage; Admin sees all
-- =============================================================================
DROP POLICY IF EXISTS "mr_visits_select" ON public.mr_visits;

CREATE POLICY "mr_visits_select" ON public.mr_visits
  FOR SELECT USING (
    mr_id = auth.uid()
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  );

-- =============================================================================
-- Visit-related tables: same scope (Manager sees only their MRs' data)
-- =============================================================================
-- mr_product_audits: SELECT via visit -> mr_id
DROP POLICY IF EXISTS "mr_product_audits_select" ON public.mr_product_audits;

CREATE POLICY "mr_product_audits_select" ON public.mr_product_audits
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id))
    )
  );

-- mr_competitor_audits: SELECT via product_audit -> visit -> mr_id
DROP POLICY IF EXISTS "mr_competitor_audits_select" ON public.mr_competitor_audits;

CREATE POLICY "mr_competitor_audits_select" ON public.mr_competitor_audits
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.mr_product_audits pa
        JOIN public.mr_visits v ON v.id = pa.visit_id
        WHERE pa.id = product_audit_id AND (v.mr_id = auth.uid() OR mr_managed_by_me(v.mr_id))
      )
    )
  );

-- mr_prescription_audits
DROP POLICY IF EXISTS "mr_prescription_audits_select" ON public.mr_prescription_audits;

CREATE POLICY "mr_prescription_audits_select" ON public.mr_prescription_audits
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id))
    )
  );

-- mr_competitor_marketing
DROP POLICY IF EXISTS "mr_competitor_marketing_select" ON public.mr_competitor_marketing;

CREATE POLICY "mr_competitor_marketing_select" ON public.mr_competitor_marketing
  FOR SELECT USING (
    is_mr_user() AND (
      get_mr_role() = 'ADMIN'
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id))
    )
  );
