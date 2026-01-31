-- =============================================================================
-- MR Business Context: manager_id (for MRs), created_by (pharmacies), notes
-- =============================================================================

-- MRs report to a manager; Managers create pharmacies and assign MRs
ALTER TABLE public.mr_profiles
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.mr_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mr_profiles_manager_id ON public.mr_profiles(manager_id);

-- Pharmacies are created by a manager (or admin)
ALTER TABLE public.mr_pharmacies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.mr_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mr_pharmacies_created_by ON public.mr_pharmacies(created_by);

-- Visit reports include free-text notes (products discussed, etc.)
ALTER TABLE public.mr_visits
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.mr_profiles.manager_id IS 'For MR role: the manager who supervises this rep. NULL for MANAGER/ADMIN.';
COMMENT ON COLUMN public.mr_pharmacies.created_by IS 'Manager (or admin) who created this pharmacy.';
COMMENT ON COLUMN public.mr_visits.notes IS 'Free-text notes: products discussed, stock, competitor, etc.';
