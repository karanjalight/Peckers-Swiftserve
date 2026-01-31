-- =============================================================================
-- MR (Medical Rep) Field Intelligence System - Schema
-- EXTENDS existing project - does NOT modify existing tables
-- =============================================================================

-- Enums for MR system
CREATE TYPE mr_role AS ENUM ('MR', 'MANAGER', 'ADMIN');
CREATE TYPE visit_objective AS ENUM ('AUDIT', 'SALES', 'CAMPAIGN');
CREATE TYPE visit_status AS ENUM ('OPEN', 'SUBMITTED');

-- =============================================================================
-- A. MR_PROFILES (extends auth.users - isolated from existing users table)
-- =============================================================================
CREATE TABLE public.mr_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role mr_role NOT NULL DEFAULT 'MR',
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_profiles_role ON public.mr_profiles(role);
CREATE INDEX idx_mr_profiles_region ON public.mr_profiles(region);

COMMENT ON TABLE public.mr_profiles IS 'Medical Rep system users - separate from main users table';

-- =============================================================================
-- B. PHARMACIES
-- =============================================================================
CREATE TABLE public.mr_pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  sub_region TEXT,
  location_text TEXT,
  procurement_name TEXT,
  procurement_contact TEXT,
  avg_attendants_per_day INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_pharmacies_region ON public.mr_pharmacies(region);
CREATE INDEX idx_mr_pharmacies_sub_region ON public.mr_pharmacies(sub_region);

-- MR-Pharmacy assignments (which pharmacies is each MR responsible for)
CREATE TABLE public.mr_pharmacy_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id UUID NOT NULL REFERENCES public.mr_profiles(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.mr_pharmacies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mr_id, pharmacy_id)
);

CREATE INDEX idx_mr_assignments_mr ON public.mr_pharmacy_assignments(mr_id);
CREATE INDEX idx_mr_assignments_pharmacy ON public.mr_pharmacy_assignments(pharmacy_id);

-- =============================================================================
-- C. VISITS
-- =============================================================================
CREATE TABLE public.mr_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mr_id UUID NOT NULL REFERENCES public.mr_profiles(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.mr_pharmacies(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  gps_lat NUMERIC(10, 7),
  gps_lng NUMERIC(10, 7),
  visit_duration_minutes INT,
  objective visit_objective NOT NULL DEFAULT 'AUDIT',
  status visit_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to calculate visit_duration on check-out
CREATE OR REPLACE FUNCTION mr_calculate_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.visit_duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mr_visits_calc_duration
BEFORE INSERT OR UPDATE ON public.mr_visits
FOR EACH ROW EXECUTE FUNCTION mr_calculate_visit_duration();

CREATE INDEX idx_mr_visits_mr ON public.mr_visits(mr_id);
CREATE INDEX idx_mr_visits_pharmacy ON public.mr_visits(pharmacy_id);
CREATE INDEX idx_mr_visits_status ON public.mr_visits(status);
CREATE INDEX idx_mr_visits_check_in ON public.mr_visits(check_in_time);
CREATE INDEX idx_mr_visits_objective ON public.mr_visits(objective);

-- =============================================================================
-- D. PRODUCTS (master list)
-- =============================================================================
CREATE TABLE public.mr_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  is_company_product BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_products_company ON public.mr_products(is_company_product);

-- =============================================================================
-- E. PRODUCT_AUDITS
-- =============================================================================
CREATE TABLE public.mr_product_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.mr_visits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.mr_products(id) ON DELETE CASCADE,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  usp_understood BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_product_audits_visit ON public.mr_product_audits(visit_id);
CREATE INDEX idx_mr_product_audits_product ON public.mr_product_audits(product_id);

-- =============================================================================
-- F. COMPETITOR_AUDITS (linked to product audit)
-- =============================================================================
CREATE TABLE public.mr_competitor_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_audit_id UUID NOT NULL REFERENCES public.mr_product_audits(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_stock INT,
  substitution_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_competitor_audits_product_audit ON public.mr_competitor_audits(product_audit_id);

-- =============================================================================
-- G. DOCTORS
-- =============================================================================
CREATE TABLE public.mr_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- H. PRESCRIPTION_AUDITS
-- =============================================================================
CREATE TABLE public.mr_prescription_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.mr_visits(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.mr_doctors(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  rx_per_month INT,
  prescription_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_prescription_audits_visit ON public.mr_prescription_audits(visit_id);
CREATE INDEX idx_mr_prescription_audits_doctor ON public.mr_prescription_audits(doctor_id);

-- =============================================================================
-- I. COMPETITOR_MARKETING
-- =============================================================================
CREATE TABLE public.mr_competitor_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.mr_visits(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  activity_description TEXT,
  reason_it_works TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mr_competitor_marketing_visit ON public.mr_competitor_marketing(visit_id);

-- =============================================================================
-- SEED: Preload company products
-- =============================================================================
INSERT INTO public.mr_products (name, sku, is_company_product) VALUES
  ('Ulgicid', 'ULG-001', TRUE),
  ('Floranorm', 'FLR-001', TRUE),
  ('Zefcolin', 'ZEF-001', TRUE),
  ('Emefilm', 'EME-001', TRUE),
  ('Purecal', 'PUR-001', TRUE)
;
