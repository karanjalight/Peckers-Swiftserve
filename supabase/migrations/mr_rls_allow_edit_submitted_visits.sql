-- Allow MRs to keep editing visit audits (product, prescription, competitor marketing)
-- even after a visit has been submitted, while keeping core visit timing immutable.

-- =============================================================================
-- mr_visits: allow MR to update their own visits regardless of status
-- (mr_prevent_submitted_visit_update() trigger still restricts WHICH columns)
-- =============================================================================
DROP POLICY IF EXISTS "mr_visits_update_open_only" ON public.mr_visits;

CREATE POLICY "mr_visits_update_open_only" ON public.mr_visits
  FOR UPDATE
  USING (
    (mr_id = auth.uid() AND get_mr_role() = 'MR')
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  )
  WITH CHECK (
    (get_mr_role() = 'MR' AND mr_id = auth.uid())
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  );

-- =============================================================================
-- mr_product_audits: allow MR to insert/update for ANY of their visits
-- (OPEN or SUBMITTED). Manager/Admin keep their existing scope.
-- =============================================================================
DROP POLICY IF EXISTS "mr_product_audits_insert" ON public.mr_product_audits;

CREATE POLICY "mr_product_audits_insert" ON public.mr_product_audits
  FOR INSERT WITH CHECK (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

DROP POLICY IF EXISTS "mr_product_audits_update" ON public.mr_product_audits;

CREATE POLICY "mr_product_audits_update" ON public.mr_product_audits
  FOR UPDATE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- =============================================================================
-- mr_competitor_audits: same logic, but join via product_audit -> visit
-- =============================================================================
DROP POLICY IF EXISTS "mr_competitor_audits_insert" ON public.mr_competitor_audits;

CREATE POLICY "mr_competitor_audits_insert" ON public.mr_competitor_audits
  FOR INSERT WITH CHECK (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa WHERE pa.id = product_audit_id
    ))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

DROP POLICY IF EXISTS "mr_competitor_audits_update" ON public.mr_competitor_audits;

CREATE POLICY "mr_competitor_audits_update" ON public.mr_competitor_audits
  FOR UPDATE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa WHERE pa.id = product_audit_id
    ))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

DROP POLICY IF EXISTS "mr_competitor_audits_delete" ON public.mr_competitor_audits;

CREATE POLICY "mr_competitor_audits_delete" ON public.mr_competitor_audits
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa WHERE pa.id = product_audit_id
    ))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- =============================================================================
-- mr_prescription_audits: allow MR to insert/update for any of their visits
-- =============================================================================
DROP POLICY IF EXISTS "mr_prescription_audits_insert" ON public.mr_prescription_audits;

CREATE POLICY "mr_prescription_audits_insert" ON public.mr_prescription_audits
  FOR INSERT WITH CHECK (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

DROP POLICY IF EXISTS "mr_prescription_audits_update" ON public.mr_prescription_audits;

CREATE POLICY "mr_prescription_audits_update" ON public.mr_prescription_audits
  FOR UPDATE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- =============================================================================
-- mr_competitor_marketing: allow MR to insert/update for any of their visits
-- =============================================================================
DROP POLICY IF EXISTS "mr_competitor_marketing_insert" ON public.mr_competitor_marketing;

CREATE POLICY "mr_competitor_marketing_insert" ON public.mr_competitor_marketing
  FOR INSERT WITH CHECK (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

DROP POLICY IF EXISTS "mr_competitor_marketing_update" ON public.mr_competitor_marketing;

CREATE POLICY "mr_competitor_marketing_update" ON public.mr_competitor_marketing
  FOR UPDATE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

