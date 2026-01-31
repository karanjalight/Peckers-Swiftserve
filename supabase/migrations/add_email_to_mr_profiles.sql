-- Add email to mr_profiles for display in admin user list
ALTER TABLE public.mr_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_mr_profiles_email ON public.mr_profiles(email);
