# Signup User Type Implementation

## Overview
Extended the signup form to differentiate between nannies and medical training program applicants. Users can now select their account type during signup, and they will be redirected to the appropriate dashboard after registration.

## Changes Made

### 1. Database Schema
- **Migration File**: `supabase/migrations/add_user_type_to_users.sql`
  - Added `user_type` column to `users` table
  - Type: TEXT with CHECK constraint allowing only 'nanny' or 'medical_training'
  - Default value: 'nanny' (for backward compatibility)
  - Added index for better query performance

- **Schema Documentation**: Updated `supabase/prod-schema.sql`
  - Added `user_type` column definition to the users table schema

### 2. Signup Form Updates
- **File**: `app/signup/page.tsx`
  - Added `userType` state variable to track selected user type
  - Added dropdown/select field for user type selection:
    - Options: "Nanny Services" and "Medical Training Program"
    - Default: "Nanny Services"
  - Updated form submission to include `user_type` when creating user record
  - Updated redirect logic:
    - Nannies → `/account`
    - Medical Training Program applicants → `/account/training`
    - Admins → `/admin/dashboard` (unchanged)

## Database Migration

To apply the schema changes, run the migration file:

```sql
-- Run this in your Supabase SQL editor or via migration tool
-- File: supabase/migrations/add_user_type_to_users.sql
```

The migration:
1. Adds the `user_type` column with appropriate constraints
2. Sets default value 'nanny' for existing users
3. Creates an index for performance

## User Flow

1. User visits signup page (`/signup`)
2. User fills out the form including:
   - Full Name
   - Email
   - Phone (Optional)
   - Password
   - Confirm Password
   - **Account Type** (new dropdown)
3. On submission:
   - User account is created with the selected `user_type`
   - User is automatically logged in
   - User is redirected based on their selection:
     - `nanny` → `/account`
     - `medical_training` → `/account/training`

## Next Steps

1. **Run the migration** on your database
2. **Create the training page** at `/app/account/training/page.tsx` if it doesn't exist
3. **Test the signup flow** for both user types
4. **Verify redirects** work correctly after signup

## Notes

- Existing users will have `user_type` set to 'nanny' by default (backward compatible)
- The `role` field (e.g., "customer", "admin") is separate from `user_type`
- The dropdown is required, so users must select an account type during signup




