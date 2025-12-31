-- =====================================================================
-- Migration: Add Extra Skills Columns to nanny_requests Table
-- =====================================================================
-- This migration adds 4 boolean columns to track extra skills:
-- - first_aid
-- - driving
-- - cooking
-- - cleaning
-- =====================================================================

-- Add the new columns to nanny_requests table
ALTER TABLE nanny_requests
ADD COLUMN IF NOT EXISTS first_aid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS driving BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cooking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cleaning BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN nanny_requests.first_aid IS 'Whether the requested nanny should have first aid skills';
COMMENT ON COLUMN nanny_requests.driving IS 'Whether the requested nanny should have driving skills';
COMMENT ON COLUMN nanny_requests.cooking IS 'Whether the requested nanny should have cooking skills';
COMMENT ON COLUMN nanny_requests.cleaning IS 'Whether the requested nanny should have cleaning skills';

-- Optional: Create an index if you plan to filter/search by these skills
-- CREATE INDEX idx_nanny_requests_skills ON nanny_requests(first_aid, driving, cookin  g, cleaning);







