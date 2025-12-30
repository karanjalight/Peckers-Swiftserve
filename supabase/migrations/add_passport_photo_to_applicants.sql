-- =====================================================================
-- Migration: Add Passport Photo URL to applicants Table
-- =====================================================================
-- This migration adds a passport_photo_url column to store the URL
-- of the uploaded passport photo in Supabase storage
-- =====================================================================

-- Add the passport_photo_url column to applicants table
ALTER TABLE applicants
ADD COLUMN IF NOT EXISTS passport_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN applicants.passport_photo_url IS 'URL of the passport photo stored in Supabase storage bucket';



