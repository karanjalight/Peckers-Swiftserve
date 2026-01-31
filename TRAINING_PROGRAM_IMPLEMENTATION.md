# Medical Training Program Implementation

## Overview
Complete implementation of the medical training program enrollment system with deposit and balance payment functionality.

## Database Schema

### Tables Created

1. **`training_programs`** - Stores training program cohorts
   - Program details (name, description, cohort number)
   - Pricing (total_price, deposit_amount, balance_due_days)
   - Schedule (start_date, end_date, enrollment_deadline)
   - Capacity (max_participants, current_participants)
   - Status flags (is_active, is_published)

2. **`training_enrollments`** - User enrollments in programs
   - Links user to program
   - Enrollment status (pending, deposit_paid, fully_paid, completed, cancelled)
   - Payment tracking dates
   - Unique constraint: one enrollment per user per program

3. **`training_payments`** - Payment records
   - Payment type (deposit or balance)
   - Amount and status
   - Paystack reference
   - Automatic status updates via triggers

### Key Features

- **Automatic Status Updates**: Triggers automatically update enrollment status when payments are received
- **Balance Due Date**: Automatically set to 14 days after deposit payment
- **Participant Count**: Automatically incremented when deposit is paid

## API Routes

### `/api/training/cohorts` (GET)
- Fetches all active and published training programs
- Returns programs sorted by cohort number (latest first)

### `/api/training/enroll` (POST)
- Creates enrollment for authenticated user
- Creates pending deposit payment record
- Returns enrollment and payment details for checkout

### `/api/training/my-enrollments` (GET)
- Fetches all enrollments for authenticated user
- Includes program details and payment history
- Returns full enrollment information with payments

### `/api/training/create-balance-payment` (POST)
- Creates balance payment record when user wants to pay remaining amount
- Validates that deposit has been paid
- Returns payment record for checkout

### Updated: `/api/verify-payment` (POST)
- Added support for `type: "training"` payments
- Updates training_payments table on successful payment
- Triggers automatic enrollment status updates

## Frontend Implementation

### `/app/account/training/page.tsx`

**Features:**
- Two-tab interface:
  - **Available Programs**: Browse and enroll in programs
  - **My Enrollments**: View enrollment status and make payments

**Program Display:**
- Shows cohort number, description, schedule
- Displays pricing (total and deposit)
- Shows participant count
- Enroll button (if not already enrolled)

**Enrollment Flow:**
1. User clicks "Enroll Now"
2. Creates enrollment and deposit payment record
3. Opens Paystack payment popup for deposit (KES 3,000)
4. On success, updates payment status
5. Enrollment status automatically changes to "deposit_paid"
6. Balance due date set to 14 days later

**Payment Features:**
- Pay deposit on enrollment
- Pay balance anytime after deposit (within due date)
- Visual indicators for payment status
- Overdue balance warnings
- Payment history display

## Payment Flow

### Deposit Payment
1. User enrolls → enrollment created with status "pending"
2. Deposit payment record created (status "pending")
3. Paystack payment initiated (KES 3,000)
4. On success → payment verified → status updated to "paid"
5. Trigger fires → enrollment status → "deposit_paid"
6. Balance due date set to 14 days from now

### Balance Payment
1. User views enrollment (status "deposit_paid")
2. Clicks "Pay Balance" button
3. Balance payment record created (if doesn't exist)
4. Paystack payment initiated (total_price - deposit_amount)
5. On success → payment verified → status updated to "paid"
6. Trigger fires → enrollment status → "fully_paid"

## Database Migration

Run the migration file:
```bash
# File: supabase/migrations/create_training_programs.sql
```

This creates:
- All tables with proper constraints
- Indexes for performance
- Triggers for automatic status updates
- Functions for payment handling

## Setup Instructions

1. **Run the Migration**
   ```sql
   -- Execute: supabase/migrations/create_training_programs.sql
   ```

2. **Create a Test Program** (via Supabase dashboard or API)
   ```sql
   INSERT INTO training_programs (
     name,
     cohort_number,
     total_price,
     deposit_amount,
     start_date,
     end_date,
     is_active,
     is_published
   ) VALUES (
     'Graduate Medical Representative Training - Cohort 1',
     1,
     50000.00,
     3000.00,
     '2024-03-01',
     '2024-05-01',
     true,
     true
   );
   ```

3. **Test Enrollment Flow**
   - Visit `/account/training` as a medical training user
   - Enroll in program
   - Pay deposit
   - Verify enrollment status updates
   - Pay balance

## Environment Variables

Required (already configured):
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## User Flow

1. User signs up with "Medical Training Program" account type
2. User redirected to `/account/training`
3. User sees available cohorts
4. User enrolls → pays deposit (KES 3,000)
5. User receives confirmation, balance due in 14 days
6. User can pay balance anytime before or after due date
7. Once fully paid, enrollment status is "fully_paid"

## Notes

- Deposit amount defaults to KES 3,000 (configurable per program)
- Balance due period defaults to 14 days (2 weeks, configurable per program)
- Enrollment status automatically updates via database triggers
- Participant count automatically increments when deposit is paid
- One enrollment per user per program (enforced by unique constraint)





