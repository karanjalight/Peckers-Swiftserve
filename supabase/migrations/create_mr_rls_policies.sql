-- =============================================================================
-- MR Field Intelligence - Row Level Security (RLS) Policies
-- Enforces: MR create-only (no edit after checkout), Manager/Admin read-only
-- =============================================================================

-- Helper: Get current user's MR role (returns NULL if not in mr_profiles)
CREATE OR REPLACE FUNCTION public.get_mr_role()
RETURNS mr_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.mr_profiles WHERE id = auth.uid();
$$;

-- Helper: Is current user MR, MANAGER, or ADMIN in MR system?
CREATE OR REPLACE FUNCTION public.is_mr_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.mr_profiles WHERE id = auth.uid());
$$;

-- Helper: Is current user MANAGER or ADMIN?
CREATE OR REPLACE FUNCTION public.is_mr_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mr_profiles
    WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN')
  );
$$;

-- Enable RLS on all MR tables
ALTER TABLE public.mr_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_pharmacy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_product_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_competitor_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_prescription_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_competitor_marketing ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MR_PROFILES
-- =============================================================================
-- MR users can read own profile; Managers/Admins read all
CREATE POLICY "mr_profiles_select_own" ON public.mr_profiles
  FOR SELECT USING (id = auth.uid() OR is_mr_manager_or_admin());

-- Only admins can insert/update mr_profiles (user provisioning)
CREATE POLICY "mr_profiles_insert_admin" ON public.mr_profiles
  FOR INSERT WITH CHECK (get_mr_role() = 'ADMIN');
CREATE POLICY "mr_profiles_update_admin" ON public.mr_profiles
  FOR UPDATE USING (get_mr_role() = 'ADMIN');
-- No DELETE - preserve audit trail

-- =============================================================================
-- MR_PHARMACIES
-- =============================================================================
-- All MR users can read pharmacies
CREATE POLICY "mr_pharmacies_select" ON public.mr_pharmacies
  FOR SELECT USING (is_mr_user());
-- Only admins manage pharmacy master data
CREATE POLICY "mr_pharmacies_insert_admin" ON public.mr_pharmacies
  FOR INSERT WITH CHECK (get_mr_role() = 'ADMIN');
CREATE POLICY "mr_pharmacies_update_admin" ON public.mr_pharmacies
  FOR UPDATE USING (get_mr_role() = 'ADMIN');

-- =============================================================================
-- MR_PHARMACY_ASSIGNMENTS
-- =============================================================================
CREATE POLICY "mr_assignments_select" ON public.mr_pharmacy_assignments
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_assignments_insert_admin" ON public.mr_pharmacy_assignments
  FOR INSERT WITH CHECK (get_mr_role() = 'ADMIN');
CREATE POLICY "mr_assignments_update_admin" ON public.mr_pharmacy_assignments
  FOR UPDATE USING (get_mr_role() = 'ADMIN');
CREATE POLICY "mr_assignments_delete_admin" ON public.mr_pharmacy_assignments
  FOR DELETE USING (get_mr_role() = 'ADMIN');

-- =============================================================================
-- MR_VISITS - CRITICAL: No UPDATE/DELETE after SUBMITTED
-- =============================================================================
-- SELECT: MR sees own visits; Manager/Admin see all
CREATE POLICY "mr_visits_select" ON public.mr_visits
  FOR SELECT USING (
    mr_id = auth.uid() OR is_mr_manager_or_admin()
  );

-- INSERT: Only MR can create visits (for themselves)
CREATE POLICY "mr_visits_insert_mr" ON public.mr_visits
  FOR INSERT WITH CHECK (mr_id = auth.uid() AND get_mr_role() = 'MR');

-- UPDATE: Only MR, only OPEN visits, only specific fields (check_out_time, status)
-- We use a restrictive policy: MR can update only if status=OPEN and mr_id=auth.uid()
-- and we enforce at app level that only check_out + status change to SUBMITTED is allowed
CREATE POLICY "mr_visits_update_open_only" ON public.mr_visits
  FOR UPDATE USING (
    mr_id = auth.uid() AND get_mr_role() = 'MR' AND status = 'OPEN'
  );

-- BLOCK updates that would change submitted visits (trigger as safety net)
CREATE OR REPLACE FUNCTION mr_prevent_submitted_visit_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'SUBMITTED' THEN
    RAISE EXCEPTION 'Cannot modify submitted visit - data is immutable';
  END IF;
  -- Only allow check_out_time and status to be set on update (no backdating check_in)
  IF OLD.check_in_time IS DISTINCT FROM NEW.check_in_time AND OLD.check_in_time IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot change check_in_time after visit created';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mr_visits_immutable_after_submit
BEFORE UPDATE ON public.mr_visits
FOR EACH ROW EXECUTE FUNCTION mr_prevent_submitted_visit_update();

-- NO DELETE on visits - audit trail must be preserved

-- =============================================================================
-- MR_PRODUCTS - Read-only for MR/Manager; Admin manages
-- =============================================================================
CREATE POLICY "mr_products_select" ON public.mr_products
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_products_insert_admin" ON public.mr_products
  FOR INSERT WITH CHECK (get_mr_role() = 'ADMIN');
CREATE POLICY "mr_products_update_admin" ON public.mr_products
  FOR UPDATE USING (get_mr_role() = 'ADMIN');

-- =============================================================================
-- MR_PRODUCT_AUDITS - MR can insert only for own OPEN visits
-- =============================================================================
CREATE POLICY "mr_product_audits_select" ON public.mr_product_audits
  FOR SELECT USING (is_mr_user());
-- Insert: must be MR, and visit must be their own and OPEN (enforced via join check)
CREATE POLICY "mr_product_audits_insert" ON public.mr_product_audits
  FOR INSERT WITH CHECK (
    get_mr_role() = 'MR'
    AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    )
  );
-- NO UPDATE, NO DELETE - immutable once created

-- =============================================================================
-- MR_COMPETITOR_AUDITS
-- =============================================================================
CREATE POLICY "mr_competitor_audits_select" ON public.mr_competitor_audits
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_competitor_audits_insert" ON public.mr_competitor_audits
  FOR INSERT WITH CHECK (
    get_mr_role() = 'MR'
    AND EXISTS (
      SELECT 1 FROM public.mr_product_audits pa
      JOIN public.mr_visits v ON v.id = pa.visit_id
      WHERE pa.id = product_audit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    )
  );

-- =============================================================================
-- MR_DOCTORS - All MR users can read; MR can insert (for new doctors encountered)
-- =============================================================================
CREATE POLICY "mr_doctors_select" ON public.mr_doctors
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_doctors_insert" ON public.mr_doctors
  FOR INSERT WITH CHECK (is_mr_user());
CREATE POLICY "mr_doctors_update_admin" ON public.mr_doctors
  FOR UPDATE USING (get_mr_role() = 'ADMIN');

-- =============================================================================
-- MR_PRESCRIPTION_AUDITS
-- =============================================================================
CREATE POLICY "mr_prescription_audits_select" ON public.mr_prescription_audits
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_prescription_audits_insert" ON public.mr_prescription_audits
  FOR INSERT WITH CHECK (
    get_mr_role() = 'MR'
    AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    )
  );

-- =============================================================================
-- MR_COMPETITOR_MARKETING
-- =============================================================================
CREATE POLICY "mr_competitor_marketing_select" ON public.mr_competitor_marketing
  FOR SELECT USING (is_mr_user());
CREATE POLICY "mr_competitor_marketing_insert" ON public.mr_competitor_marketing
  FOR INSERT WITH CHECK (
    get_mr_role() = 'MR'
    AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      WHERE v.id = visit_id AND v.mr_id = auth.uid() AND v.status = 'OPEN'
    )
  );
