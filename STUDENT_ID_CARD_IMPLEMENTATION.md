# Student ID Card Implementation

## Overview
Complete implementation of downloadable student ID cards for training program participants. Students can download their ID card as a PDF after paying their deposit.

## Features

### Student ID Format
- Format: `001/Q1/2026`
- Structure: `[Payment Order]/[Quarter]/[Year]`
- Example: First payment in Q1 2026 = `001/Q1/2026`
- Example: Fifth payment in Q2 2026 = `005/Q2/2026`

### ID Card Contents
- **Company Name**: PECKERS SWIFTSERVE LTD (header)
- **Student Name**: Full name from user profile
- **Student ID**: Auto-generated (e.g., `001/Q1/2026`)
- **Course**: Training program name
- **Valid For**: 1 month from deposit payment date
- **Valid Until**: Expiration date (1 month from deposit)

### ID Card Design
- Standard credit card size (85.6mm x 53.98mm)
- Professional layout with:
  - Company header (dark blue background)
  - White content area with student information
  - Photo placeholder (left side)
  - Student details (right side)
  - Footer with validity date

## Database Schema

### Migration: `add_student_id_to_enrollments.sql`

1. **Added Column**: `student_id TEXT` to `training_enrollments` table
2. **Function**: `generate_student_id()` - Generates student ID based on deposit payment date
3. **Updated Trigger**: `update_enrollment_on_deposit_payment()` - Now auto-generates student_id when deposit is paid

### Student ID Generation Logic

```sql
-- Student ID format: 001/Q1/2026
-- Based on:
-- 1. Quarter and year of deposit payment
-- 2. Payment order within that quarter/year
-- 3. Counted from enrollments with deposit_paid_at before current date
```

## API Routes

### `/api/training/download-id` (GET)
- **Authentication**: Required (checks `sb-auth-token` cookie)
- **Parameters**: `enrollmentId` (query parameter)
- **Returns**: PDF file (application/pdf)
- **Functionality**:
  1. Verifies user authentication
  2. Checks enrollment belongs to user
  3. Validates deposit is paid
  4. Retrieves student_id from enrollment
  5. Generates professional ID card PDF
  6. Returns PDF for download

## Frontend Implementation

### Download Function
Located in `/app/account/training/page.tsx`:
- `handleDownloadID()` - Fetches and downloads the ID card PDF
- Triggered by "Download Student ID Card" button

### UI Button
- Available in "My Enrollments" tab
- Only visible after deposit is paid (`deposit_paid` or `fully_paid` status)
- Button location: Below enrollment details, above balance payment button

## Workflow

1. **User Enrolls** → Creates enrollment (status: `pending`)
2. **User Pays Deposit** → 
   - Payment verified via Paystack
   - Trigger fires: `update_enrollment_on_deposit_payment()`
   - Student ID auto-generated and saved
   - Enrollment status → `deposit_paid`
3. **User Downloads ID** →
   - Clicks "Download Student ID Card" button
   - API generates PDF with student information
   - PDF downloads automatically

## PDF Generation

Uses `jsPDF` library:
- Landscape orientation
- Credit card dimensions (85.6mm x 53.98mm)
- Professional styling:
  - Brand colors (blue header, tan footer)
  - Clear typography
  - Structured layout
  - Photo placeholder
  - Company branding

## Setup Instructions

1. **Run Migration**:
   ```sql
   -- Execute: supabase/migrations/add_student_id_to_enrollments.sql
   ```

2. **Test ID Card Generation**:
   - Enroll in a training program
   - Pay deposit
   - Student ID should be auto-generated
   - Download ID card from "My Enrollments"

## Notes

- Student ID is generated automatically when deposit is paid
- ID card is only available after deposit payment
- Validity is 1 month from deposit payment date
- ID card is printable and suitable for events
- Student ID format is consistent and sequential within quarters

## Future Enhancements

- Add photo upload functionality
- Include QR code for verification
- Add digital signature
- Webhook for ID card generation
- Email ID card on enrollment completion


