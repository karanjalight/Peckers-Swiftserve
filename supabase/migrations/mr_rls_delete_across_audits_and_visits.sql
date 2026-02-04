-- =============================================================================
-- DELETE policies: allow delete on each audit type and on visits (same scope as edit)
-- MR: own OPEN visit data only. Manager/Admin: any visit they can see.
-- =============================================================================

-- mr_product_audits: DELETE - same scope as UPDATE (visit editable by user)
-- Deleting a product_audit cascades to mr_competitor_audits
DROP POLICY IF EXISTS "mr_product_audits_delete" ON public.mr_product_audits;
CREATE POLICY "mr_product_audits_delete" ON public.mr_product_audits
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- mr_prescription_audits: DELETE - same scope
DROP POLICY IF EXISTS "mr_prescription_audits_delete" ON public.mr_prescription_audits;
CREATE POLICY "mr_prescription_audits_delete" ON public.mr_prescription_audits
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- mr_competitor_marketing: DELETE - same scope
DROP POLICY IF EXISTS "mr_competitor_marketing_delete" ON public.mr_competitor_marketing;
CREATE POLICY "mr_competitor_marketing_delete" ON public.mr_competitor_marketing
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    ))
    OR (get_mr_role() = 'ADMIN' AND EXISTS (SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id))
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND mr_managed_by_me(v.mr_id)
    ))
  );

-- mr_visits: DELETE - MR only OPEN and own; Manager/Admin any visit they can see
-- Cascades remove product_audits, competitor_audits, prescription_audits, competitor_marketing
DROP POLICY IF EXISTS "mr_visits_delete" ON public.mr_visits;
CREATE POLICY "mr_visits_delete" ON public.mr_visits
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND mr_id = auth.uid() AND status = 'OPEN')
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  );
