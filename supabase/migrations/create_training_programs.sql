-- Migration: Create training programs, enrollments, and payments tables
-- This enables the medical training program functionality

-- =====================================================================
-- TRAINING PROGRAMS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- e.g., "Graduate Medical Representative Training - Cohort 1"
  description TEXT,                            -- Program description
  cohort_number INTEGER NOT NULL,              -- Cohort number (1, 2, 3, etc.)
  total_price NUMERIC(10,2) NOT NULL,          -- Total program price
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 3000,  -- Deposit required (default Ksh 3000)
  balance_due_days INTEGER NOT NULL DEFAULT 14, -- Days to pay balance after deposit (default 14 days)
  
  start_date DATE,                             -- Program start date
  end_date DATE,                               -- Program end date
  enrollment_deadline DATE,                    -- Last date to enroll
  
  max_participants INTEGER,                    -- Maximum number of participants
  current_participants INTEGER DEFAULT 0,      -- Current enrolled count
  
  is_active BOOLEAN DEFAULT TRUE,              -- Whether cohort is accepting enrollments
  is_published BOOLEAN DEFAULT FALSE,          -- Whether cohort is visible to users
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_programs_cohort ON training_programs(cohort_number);
CREATE INDEX idx_training_programs_active ON training_programs(is_active, is_published);
CREATE INDEX idx_training_programs_start_date ON training_programs(start_date);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_training_programs_updated_at
BEFORE UPDATE ON training_programs
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- =====================================================================
-- TRAINING ENROLLMENTS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  
  enrollment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN ('pending', 'deposit_paid', 'fully_paid', 'completed', 'cancelled')),
  
  deposit_paid_at TIMESTAMPTZ,                -- When deposit was paid
  balance_due_date DATE,                       -- Deadline for balance payment
  balance_paid_at TIMESTAMPTZ,                 -- When balance was paid
  
  notes TEXT,                                  -- Admin notes
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, program_id)                  -- One enrollment per user per program
);

CREATE INDEX idx_enrollments_user ON training_enrollments(user_id);
CREATE INDEX idx_enrollments_program ON training_enrollments(program_id);
CREATE INDEX idx_enrollments_status ON training_enrollments(enrollment_status);
CREATE INDEX idx_enrollments_balance_due ON training_enrollments(balance_due_date);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_training_enrollments_updated_at
BEFORE UPDATE ON training_enrollments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- =====================================================================
-- TRAINING PAYMENTS TABLE
-- =====================================================================

CREATE TYPE training_payment_type AS ENUM (
  'deposit',
  'balance'
);

CREATE TABLE IF NOT EXISTS training_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE SET NULL,
  
  payment_type training_payment_type NOT NULL, -- 'deposit' or 'balance'
  amount NUMERIC(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',     -- Uses existing payment_status enum
  
  paystack_reference TEXT,                     -- Paystack transaction reference
  mpesa_reference TEXT,                        -- M-Pesa reference (if applicable)
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_payments_enrollment ON training_payments(enrollment_id);
CREATE INDEX idx_training_payments_user ON training_payments(user_id);
CREATE INDEX idx_training_payments_program ON training_payments(program_id);
CREATE INDEX idx_training_payments_type ON training_payments(payment_type);
CREATE INDEX idx_training_payments_status ON training_payments(status);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_training_payments_updated_at
BEFORE UPDATE ON training_payments
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- =====================================================================
-- FUNCTION: Generate Student ID
-- =====================================================================

CREATE OR REPLACE FUNCTION generate_student_id(deposit_date TIMESTAMPTZ)
RETURNS TEXT AS $$
DECLARE
  quarter_num INTEGER;
  year_num INTEGER;
  quarter_str TEXT;
  payment_order INTEGER;
  student_id TEXT;
BEGIN
  -- Get quarter and year from deposit payment date
  quarter_num := EXTRACT(QUARTER FROM deposit_date);
  year_num := EXTRACT(YEAR FROM deposit_date);
  
  -- Format quarter as Q1, Q2, Q3, Q4
  quarter_str := 'Q' || quarter_num;
  
  -- Get payment order for this quarter/year (count of enrollments with deposit paid in this quarter/year before this date)
  SELECT COUNT(*) + 1 INTO payment_order
  FROM training_enrollments
  WHERE EXTRACT(QUARTER FROM deposit_paid_at) = quarter_num
    AND EXTRACT(YEAR FROM deposit_paid_at) = year_num
    AND deposit_paid_at IS NOT NULL
    AND deposit_paid_at < deposit_date;
  
  -- Format as 001/Q1/2026 (3-digit number with leading zeros)
  student_id := LPAD(payment_order::TEXT, 3, '0') || '/' || quarter_str || '/' || year_num;
  
  RETURN student_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- FUNCTION: Update enrollment status when deposit is paid
-- =====================================================================

CREATE OR REPLACE FUNCTION update_enrollment_on_deposit_payment()
RETURNS TRIGGER AS $$
DECLARE
  new_student_id TEXT;
  payment_date TIMESTAMPTZ;
  quarter_num INTEGER;
  year_num INTEGER;
  payment_order INTEGER;
BEGIN
  -- When deposit payment is marked as paid, update enrollment status
  IF NEW.status = 'paid' AND NEW.payment_type = 'deposit' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Use paid_at timestamp if available, otherwise use NOW()
    payment_date := COALESCE(NEW.paid_at, NOW());
    
    -- Generate student ID based on payment date
    BEGIN
      SELECT generate_student_id(payment_date) INTO new_student_id;
    EXCEPTION WHEN OTHERS THEN
      new_student_id := NULL;
    END;
    
    -- If student_id generation failed, generate a simple fallback
    IF new_student_id IS NULL OR new_student_id = '' THEN
      quarter_num := EXTRACT(QUARTER FROM payment_date);
      year_num := EXTRACT(YEAR FROM payment_date);
      SELECT COUNT(*) + 1 INTO payment_order
      FROM training_enrollments
      WHERE EXTRACT(QUARTER FROM deposit_paid_at) = quarter_num
        AND EXTRACT(YEAR FROM deposit_paid_at) = year_num
        AND deposit_paid_at IS NOT NULL
        AND id != NEW.enrollment_id;
      new_student_id := LPAD(payment_order::TEXT, 3, '0') || '/Q' || quarter_num || '/' || year_num;
    END IF;
    
    UPDATE training_enrollments
    SET 
      enrollment_status = 'deposit_paid',
      deposit_paid_at = payment_date,
      balance_due_date = payment_date + INTERVAL '14 days',  -- 2 weeks from deposit payment
      student_id = new_student_id
    WHERE id = NEW.enrollment_id;
    
    -- Increment program participant count
    UPDATE training_programs
    SET current_participants = current_participants + 1
    WHERE id = NEW.program_id;
  END IF;
  
  -- When balance payment is marked as paid, update enrollment status
  IF NEW.status = 'paid' AND NEW.payment_type = 'balance' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE training_enrollments
    SET 
      enrollment_status = 'fully_paid',
      balance_paid_at = COALESCE(NEW.paid_at, NOW())
    WHERE id = NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enrollment status on payment
DROP TRIGGER IF EXISTS trigger_update_enrollment_on_payment ON training_payments;

CREATE TRIGGER trigger_update_enrollment_on_payment
AFTER UPDATE ON training_payments
FOR EACH ROW
WHEN ((OLD.status IS NULL OR OLD.status != 'paid') AND NEW.status = 'paid')
EXECUTE FUNCTION update_enrollment_on_deposit_payment();

