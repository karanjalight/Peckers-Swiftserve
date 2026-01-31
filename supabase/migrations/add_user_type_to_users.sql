-- Migration: Add user_type column to users table
-- This allows differentiation between nannies and medical training program applicants

-- Add user_type column with default value 'nanny' for backward compatibility
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'nanny' CHECK (user_type IN ('nanny', 'medical_training'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- Update existing users to have 'nanny' as default if they don't have a role set
-- (This ensures backward compatibility)
UPDATE public.users 
SET user_type = 'nanny' 
WHERE user_type IS NULL;





