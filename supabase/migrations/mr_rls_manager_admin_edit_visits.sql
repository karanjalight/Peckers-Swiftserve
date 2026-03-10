-- =============================================================================
-- Allow Managers and Admins to edit visits (notes, audit metrics, add audits)
-- Same visit scope as SELECT: Admin all, Manager only visits by MRs they manage.
-- =============================================================================

-- mr_visits: UPDATE - MR (own OPEN only) OR Manager (visits they can see) OR Admin (all)
DROP POLICY IF EXISTS "mr_visits_update_open_only" ON public.mr_visits;

CREATE POLICY "mr_visits_update_open_only" ON public.mr_visits
  FOR UPDATE
  USING (
    (mr_id = auth.uid() AND get_mr_role() = 'MR' AND status = 'OPEN')
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  )
  WITH CHECK (
    (get_mr_role() = 'MR' AND mr_id = auth.uid())
    OR get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND mr_managed_by_me(mr_id))
  );

-- Allow Manager/Admin to update submitted visits (trigger currently blocks all)
CREATE OR REPLACE FUNCTION mr_prevent_submitted_visit_update()
RETURNS TRIGGER AS $$
BEGIN
  -- For MRs, allow limited edits on submitted visits (notes and audit metrics only).
  IF OLD.status = 'SUBMITTED' AND get_mr_role() NOT IN ('MANAGER', 'ADMIN') THEN
    IF NOT (
      OLD.notes IS DISTINCT FROM NEW.notes
      OR OLD.patients_per_day IS DISTINCT FROM NEW.patients_per_day
      OR OLD.basket_value_per_patient IS DISTINCT FROM NEW.basket_value_per_patient
    ) THEN
      RAISE EXCEPTION 'Cannot modify submitted visit - data is immutable';
    END IF;
  END IF;

  -- Prevent MRs from changing check_in_time after visit creation.
  IF OLD.check_in_time IS DISTINCT FROM NEW.check_in_time
     AND OLD.check_in_time IS NOT NULL
     AND get_mr_role() = 'MR' THEN
    RAISE EXCEPTION 'Cannot change check_in_time after visit created';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- mr_product_audits: INSERT - MR (own OPEN visit) OR Manager/Admin (visit they can see)
DROP POLICY IF EXISTS "mr_product_audits_insert" ON public.mr_product_audits;

CREATE POLICY "mr_product_audits_insert" ON public.mr_product_audits
  FOR INSERT WITH CHECK (
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

-- mr_competitor_audits: INSERT - when product_audit's visit is visible to user
DROP POLICY IF EXISTS "mr_competitor_audits_insert" ON public.mr_competitor_audits;

CREATE POLICY "mr_competitor_audits_insert" ON public.mr_competitor_audits
  FOR INSERT WITH CHECK (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
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

-- mr_prescription_audits: INSERT
DROP POLICY IF EXISTS "mr_prescription_audits_insert" ON public.mr_prescription_audits;

CREATE POLICY "mr_prescription_audits_insert" ON public.mr_prescription_audits
  FOR INSERT WITH CHECK (
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

-- mr_competitor_marketing: INSERT
DROP POLICY IF EXISTS "mr_competitor_marketing_insert" ON public.mr_competitor_marketing;

CREATE POLICY "mr_competitor_marketing_insert" ON public.mr_competitor_marketing
  FOR INSERT WITH CHECK (
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

-- =============================================================================
-- UPDATE/DELETE policies so existing audit data can be edited
-- =============================================================================

-- mr_product_audits: UPDATE - same scope as insert (visit editable by user)
CREATE POLICY "mr_product_audits_update" ON public.mr_product_audits
  FOR UPDATE USING (
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

-- mr_competitor_audits: UPDATE and DELETE - when product_audit's visit is editable
CREATE POLICY "mr_competitor_audits_update" ON public.mr_competitor_audits
  FOR UPDATE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
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

CREATE POLICY "mr_competitor_audits_delete" ON public.mr_competitor_audits
  FOR DELETE USING (
    (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
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

-- mr_prescription_audits: UPDATE
CREATE POLICY "mr_prescription_audits_update" ON public.mr_prescription_audits
  FOR UPDATE USING (
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

-- mr_competitor_marketing: UPDATE
CREATE POLICY "mr_competitor_marketing_update" ON public.mr_competitor_marketing
  FOR UPDATE USING (
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
