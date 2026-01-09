-- Migration: Create enrollment detail features
-- This enables role call, attendance tracking, and notes functionality
-- for training enrollment detail pages

-- =====================================================================
-- TRAINING ATTENDANCE TABLE (Role Call)
-- =====================================================================
-- Tracks daily attendance for each enrollment
-- Allows marking presence/absence on specific dates

CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  
  -- Attendance date (the day of the training session)
  attendance_date DATE NOT NULL,
  
  -- Attendance status
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  
  -- Optional: Time of arrival (for late tracking)
  arrival_time TIME,
  
  -- Optional: Additional notes for this attendance record
  notes TEXT,
  
  -- Who marked this attendance (admin/instructor user_id)
  marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One attendance record per enrollment per date
  UNIQUE(enrollment_id, attendance_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_attendance_enrollment ON training_attendance(enrollment_id);
CREATE INDEX idx_attendance_date ON training_attendance(attendance_date);
CREATE INDEX idx_attendance_status ON training_attendance(status);
CREATE INDEX idx_attendance_enrollment_date ON training_attendance(enrollment_id, attendance_date);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_training_attendance_updated_at
BEFORE UPDATE ON training_attendance
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =====================================================================
-- TRAINING ENROLLMENT NOTES TABLE
-- =====================================================================
-- Allows saving date-specific or general notes for enrollments
-- Can be used for reviewing notes later

CREATE TABLE IF NOT EXISTS training_enrollment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  
  -- Note content
  note_text TEXT NOT NULL,
  
  -- Optional: Link note to a specific date (for date-specific notes)
  -- If null, it's a general note for the enrollment
  note_date DATE,
  
  -- Note type/category (optional, for organizing notes)
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'attendance', 'performance', 'assignment', 'feedback', 'other')),
  
  -- Who created this note (instructor/admin user_id)
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Optional: Tags for better organization (stored as array or comma-separated)
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_enrollment_notes_enrollment ON training_enrollment_notes(enrollment_id);
CREATE INDEX idx_enrollment_notes_date ON training_enrollment_notes(note_date);
CREATE INDEX idx_enrollment_notes_type ON training_enrollment_notes(note_type);
CREATE INDEX idx_enrollment_notes_created_at ON training_enrollment_notes(created_at DESC);
CREATE INDEX idx_enrollment_notes_enrollment_date ON training_enrollment_notes(enrollment_id, note_date);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_training_enrollment_notes_updated_at
BEFORE UPDATE ON training_enrollment_notes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =====================================================================
-- FUNCTION: Get attendance summary for an enrollment
-- =====================================================================
-- Helper function to calculate attendance statistics

CREATE OR REPLACE FUNCTION get_enrollment_attendance_summary(enrollment_uuid UUID)
RETURNS TABLE (
  total_days INTEGER,
  present_days INTEGER,
  absent_days INTEGER,
  late_days INTEGER,
  excused_days INTEGER,
  attendance_percentage NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_days,
    COUNT(*) FILTER (WHERE status = 'present')::INTEGER as present_days,
    COUNT(*) FILTER (WHERE status = 'absent')::INTEGER as absent_days,
    COUNT(*) FILTER (WHERE status = 'late')::INTEGER as late_days,
    COUNT(*) FILTER (WHERE status = 'excused')::INTEGER as excused_days,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('present', 'late'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 
          2
        )
      ELSE 0
    END as attendance_percentage
  FROM training_attendance
  WHERE enrollment_id = enrollment_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- VIEW: Enrollment Detail View
-- =====================================================================
-- Convenient view for enrollment detail pages with attendance summary

CREATE OR REPLACE VIEW enrollment_detail_view AS
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.program_id,
  e.enrollment_status,
  e.student_id,
  e.deposit_paid_at,
  e.balance_paid_at,
  e.created_at as enrollment_created_at,
  
  -- User info
  u.full_name as student_name,
  u.email as student_email,
  u.phone as student_phone,
  
  -- Program info
  p.name as program_name,
  p.cohort_number,
  p.start_date as program_start_date,
  p.end_date as program_end_date,
  
  -- Attendance summary
  (SELECT COUNT(*) FROM training_attendance WHERE enrollment_id = e.id) as total_attendance_records,
  (SELECT COUNT(*) FROM training_attendance WHERE enrollment_id = e.id AND status = 'present') as present_count,
  (SELECT COUNT(*) FROM training_attendance WHERE enrollment_id = e.id AND status = 'absent') as absent_count,
  (SELECT COUNT(*) FROM training_attendance WHERE enrollment_id = e.id AND status = 'late') as late_count,
  (SELECT COUNT(*) FROM training_attendance WHERE enrollment_id = e.id AND status = 'excused') as excused_count,
  
  -- Notes count
  (SELECT COUNT(*) FROM training_enrollment_notes WHERE enrollment_id = e.id) as total_notes_count,
  (SELECT COUNT(*) FROM training_enrollment_notes WHERE enrollment_id = e.id AND note_date IS NOT NULL) as dated_notes_count,
  
  -- Last activity
  (SELECT MAX(updated_at) FROM training_attendance WHERE enrollment_id = e.id) as last_attendance_update,
  (SELECT MAX(created_at) FROM training_enrollment_notes WHERE enrollment_id = e.id) as last_note_created
FROM training_enrollments e
LEFT JOIN public.users u ON e.user_id = u.id
LEFT JOIN training_programs p ON e.program_id = p.id;

-- Grant necessary permissions (adjust based on your RLS policies)
-- These will need to be configured based on your authentication setup
-- GRANT SELECT ON enrollment_detail_view TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON training_attendance TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON training_enrollment_notes TO authenticated;

