-- Migration: Add student_id to training_enrollments
-- Student ID format: 001/Q1/2026 (based on payment order and quarter/year)

ALTER TABLE training_enrollments 
ADD COLUMN IF NOT EXISTS student_id TEXT;

-- Create index for student_id lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON training_enrollments(student_id);

