-- Migration: Backfill student IDs for existing enrollments
-- This generates student IDs for enrollments that have deposit_paid_at but no student_id

-- Update enrollments that have deposit_paid_at but no student_id
UPDATE training_enrollments
SET student_id = generate_student_id(deposit_paid_at)
WHERE deposit_paid_at IS NOT NULL
  AND (student_id IS NULL OR student_id = '');

-- If any still don't have student_id, generate them manually
DO $$
DECLARE
  enroll_record RECORD;
  new_student_id TEXT;
  quarter_num INTEGER;
  year_num INTEGER;
  payment_order INTEGER;
BEGIN
  FOR enroll_record IN 
    SELECT id, deposit_paid_at
    FROM training_enrollments
    WHERE deposit_paid_at IS NOT NULL
      AND (student_id IS NULL OR student_id = '')
  LOOP
    quarter_num := EXTRACT(QUARTER FROM enroll_record.deposit_paid_at);
    year_num := EXTRACT(YEAR FROM enroll_record.deposit_paid_at);
    
    SELECT COUNT(*) + 1 INTO payment_order
    FROM training_enrollments
    WHERE EXTRACT(QUARTER FROM deposit_paid_at) = quarter_num
      AND EXTRACT(YEAR FROM deposit_paid_at) = year_num
      AND deposit_paid_at IS NOT NULL
      AND deposit_paid_at <= enroll_record.deposit_paid_at
      AND id != enroll_record.id;
    
    new_student_id := LPAD(payment_order::TEXT, 3, '0') || '/Q' || quarter_num || '/' || year_num;
    
    UPDATE training_enrollments
    SET student_id = new_student_id
    WHERE id = enroll_record.id;
  END LOOP;
END $$;





