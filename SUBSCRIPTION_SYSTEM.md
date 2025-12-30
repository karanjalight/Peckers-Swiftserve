# Subscription System Documentation

## Overview

A comprehensive subscription package system that allows:
- **Admins** to create and manage subscription packages (Nanny & Security services)
- **Customers** to purchase subscription packages and redeem service days
- **Flexible redemption** system where customers can use their allocated days over time

---

## Features

### 1. Admin Features
- ✅ Create subscription packages with custom pricing and service days
- ✅ Manage package status (active/inactive)
- ✅ View and manage redemption requests
- ✅ Approve/reject redemption requests
- ✅ Track subscription usage and analytics

### 2. Customer Features
- ✅ Browse available subscription packages
- ✅ Filter packages by service type (Nanny/Security)
- ✅ Purchase subscriptions with Paystack integration
- ✅ View active subscriptions in account dashboard
- ✅ Redeem subscription days when needed
- ✅ Track remaining days and expiry dates

### 3. Package Types
- **Nanny Packages**: Subscription for nanny services
- **Security Packages**: Subscription for security services with dogs/handlers

Each package includes:
- Service days (e.g., 4 days, 10 days)
- Validity period (e.g., 90 days, 180 days)
- Price
- Features list
- Terms & conditions

---

## Database Schema

### Tables Created

#### 1. `subscription_packages`
Stores admin-created subscription packages.

**Fields:**
- `id` (UUID): Primary key
- `name` (TEXT): Package name (e.g., "Gold Nanny Package")
- `slug` (TEXT): URL-friendly identifier
- `service_type` (ENUM): 'nanny' or 'security'
- `price` (NUMERIC): Package price
- `service_days` (INT): Number of service days included
- `validity_days` (INT): Package valid for X days after purchase
- `description` (TEXT): Package description
- `features` (JSONB): Array of features
- `terms_conditions` (TEXT): Terms and conditions
- `status` (ENUM): 'active', 'inactive', or 'archived'
- `created_by` (UUID): Admin who created the package
- Timestamps: `created_at`, `updated_at`

#### 2. `user_subscriptions`
Stores customer subscription purchases.

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Reference to users table
- `package_id` (UUID): Reference to subscription_packages
- `status` (ENUM): 'active', 'expired', 'cancelled', 'redeemed'
- `purchase_date` (TIMESTAMPTZ): When purchased
- `expiry_date` (TIMESTAMPTZ): When subscription expires
- `activated_at` (TIMESTAMPTZ): When activated (after payment)
- `service_days_total` (INT): Total days allocated
- `service_days_used` (INT): Days already redeemed
- `service_days_remaining` (INT): Days still available (auto-calculated)
- `amount_paid` (NUMERIC): Amount paid
- `payment_reference` (TEXT): Payment reference (M-Pesa/Paystack)
- `payment_status` (ENUM): 'pending', 'paid', 'failed'
- `paid_at` (TIMESTAMPTZ): Payment timestamp
- Timestamps: `created_at`, `updated_at`

#### 3. `subscription_redemptions`
Stores customer redemption requests.

**Fields:**
- `id` (UUID): Primary key
- `subscription_id` (UUID): Reference to user_subscriptions
- `user_id` (UUID): Reference to users table
- `days_to_redeem` (INT): Number of days to use
- `service_start_date` (DATE): When service should start
- `service_end_date` (DATE): When service should end
- `location` (TEXT): Service location
- `phone` (TEXT): Contact phone
- `email` (TEXT): Contact email
- `notes` (TEXT): Additional requirements
- `status` (ENUM): 'pending', 'approved', 'rejected', 'completed'
- `nanny_request_id` (UUID): Optional link to nanny request
- `security_request_id` (UUID): Optional link to security request
- `approved_by` (UUID): Admin who approved
- `approved_at` (TIMESTAMPTZ): Approval timestamp
- `rejection_reason` (TEXT): If rejected, reason
- Timestamps: `created_at`, `updated_at`

---

## Setup Instructions

### 1. Database Setup

Run the subscription schema SQL file:

```bash
psql -h your-database-host -U your-user -d your-database -f supabase/subscription-schema.sql
```

Or in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/subscription-schema.sql`
3. Run the script

The script includes:
- All table definitions
- Enums for type safety
- Indexes for performance
- Triggers for auto-updates
- Business logic functions
- Row Level Security (RLS) policies
- Sample data (optional)

### 2. Environment Variables

Ensure these variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
```

### 3. Admin Access

The system uses admin roles. Ensure admins have the correct role set in Supabase Auth:

1. Go to Authentication → Users
2. Edit user → Raw user meta data
3. Add: `{"role": "admin"}`

---

## User Flow

### Customer Journey

1. **Browse Packages**
   - Visit `/subscriptions`
   - Filter by service type (Nanny/Security)
   - View package details

2. **Purchase Subscription**
   - Click "Get Started" on desired package
   - Review package details
   - Agree to terms & conditions
   - Complete payment via Paystack
   - Subscription activated immediately

3. **View Subscriptions**
   - Go to Account → Subscriptions tab
   - See all active and expired subscriptions
   - Check remaining days and expiry dates

4. **Redeem Days**
   - Click "Redeem Days" on active subscription
   - Select number of days to use
   - Choose service dates
   - Provide location and contact details
   - Submit redemption request

5. **Admin Processing**
   - Admin reviews redemption request
   - Approves or rejects with reason
   - If approved, days are deducted from subscription
   - Customer is contacted to schedule service

6. **Service Delivery**
   - Admin marks redemption as "Completed" after service
   - Customer can submit another redemption if days remain

### Admin Journey

1. **Create Packages**
   - Go to Admin → Subscriptions → Create Package
   - Fill in package details
   - Set pricing, service days, validity
   - Add features and terms
   - Activate package

2. **Manage Packages**
   - View all packages
   - Edit package details
   - Toggle active/inactive status
   - Delete unused packages

3. **Handle Redemptions**
   - Go to Admin → Subscriptions → Redemptions
   - View pending redemption requests
   - Review customer details
   - Approve or reject requests
   - Mark completed after service delivery

---

## API Endpoints

### `/api/subscriptions/verify-payment`

**Method:** POST

**Purpose:** Verify Paystack payment and activate subscription

**Body:**
```json
{
  "reference": "SUB-xxx-timestamp",
  "subscription_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

## File Structure

```
app/
├── admin/
│   └── subscriptions/
│       ├── page.tsx                    # Package management
│       ├── create/
│       │   └── page.tsx                # Create package
│       ├── edit/
│       │   └── [id]/page.tsx           # Edit package
│       └── redemptions/
│           └── page.tsx                # Redemption management
├── subscriptions/
│   ├── page.tsx                        # Browse packages
│   ├── purchase/
│   │   └── [slug]/page.tsx             # Purchase flow
│   └── redeem/
│       └── [id]/page.tsx               # Redeem days
├── account/
│   └── page.tsx                        # User dashboard (updated)
└── api/
    └── subscriptions/
        └── verify-payment/
            └── route.ts                # Payment verification

supabase/
└── subscription-schema.sql             # Database schema

components/
└── app-sidebar.tsx                     # Updated with subscriptions menu
```

---

## Key Business Logic

### Automatic Calculations

1. **Remaining Days**
   ```sql
   service_days_remaining = service_days_total - service_days_used
   ```
   - Automatically calculated via database trigger

2. **End Date Calculation**
   - When user selects start date and days to redeem
   - Frontend automatically calculates: `end_date = start_date + (days - 1)`

3. **Expiry Validation**
   - Database function checks if subscription is expired before redemption
   - Prevents redemption of expired or inactive subscriptions

### Redemption Approval Flow

```
Customer submits redemption
    ↓
Status: PENDING (days NOT deducted yet)
    ↓
Admin reviews request
    ↓
Admin approves → Status: APPROVED
    ↓
Database trigger: Deducts days from subscription
    ↓
Service is delivered
    ↓
Admin marks as COMPLETED
```

**Important:** Days are only deducted when admin **approves** the redemption, not when it's submitted.

---

## Sample Packages

The schema includes sample packages (optional):

1. **Silver Nanny Package**
   - 2 days, 60 days validity, KES 8,000

2. **Gold Nanny Package**
   - 4 days, 90 days validity, KES 15,000

3. **Platinum Nanny Package**
   - 10 days, 180 days validity, KES 35,000

4. **Gold Security Package**
   - 5 days, 90 days validity, KES 20,000

5. **Platinum Security Package**
   - 12 days, 180 days validity, KES 45,000

---

## Security Features

### Row Level Security (RLS)

1. **Packages**
   - Public can view active packages
   - Only admins can create/edit/delete

2. **User Subscriptions**
   - Users can only view their own subscriptions
   - Users can create their own subscriptions
   - Admins can view all subscriptions

3. **Redemptions**
   - Users can view/create their own redemptions
   - Admins can view/manage all redemptions

### Validation

- Client-side validation in forms
- Server-side validation in database functions
- Payment verification with Paystack
- Expiry date checks before redemption
- Remaining days validation

---

## Testing Checklist

### Admin Tasks
- [ ] Create a nanny package
- [ ] Create a security package
- [ ] Edit package details
- [ ] Toggle package active/inactive
- [ ] Delete unused package
- [ ] View redemption requests
- [ ] Approve redemption
- [ ] Reject redemption with reason
- [ ] Mark redemption as completed

### Customer Tasks
- [ ] Browse subscription packages
- [ ] Filter by service type
- [ ] Purchase a subscription
- [ ] View subscription in account
- [ ] Check remaining days
- [ ] Submit redemption request
- [ ] View redemption status

### Payment Flow
- [ ] Test Paystack integration
- [ ] Verify payment callback
- [ ] Check subscription activation
- [ ] Test payment failure handling

---

## Future Enhancements

### Potential Features
1. **Auto-renewal** - Option to automatically renew expired subscriptions
2. **Partial redemptions** - Use half-days or hourly increments
3. **Gift subscriptions** - Purchase for someone else
4. **Subscription transfers** - Transfer unused days to another user
5. **Mobile app** - React Native app for easier access
6. **Email notifications** - Automatic emails for:
   - Purchase confirmation
   - Redemption status updates
   - Expiry reminders
7. **Analytics dashboard** - Revenue, popular packages, redemption rates
8. **Promo codes** - Discount codes for packages
9. **Subscription bundling** - Combine nanny + security packages

---

## Troubleshooting

### Common Issues

**1. "Subscription not found" error**
- Check if subscription exists in database
- Verify user_id matches logged-in user
- Ensure subscription hasn't been deleted

**2. "Insufficient days" error**
- Check `service_days_remaining` in database
- Verify no pending redemptions are consuming days
- Run expiry function to update expired subscriptions

**3. Payment not verifying**
- Check Paystack secret key in environment
- Verify payment reference is correct
- Check Paystack webhook configuration

**4. RLS blocking queries**
- Verify user is authenticated
- Check admin role for admin operations
- Review RLS policies in Supabase

### Database Maintenance

**Expire old subscriptions:**
```sql
SELECT expire_old_subscriptions();
```

**Check subscription status:**
```sql
SELECT 
  u.email,
  s.service_days_remaining,
  s.expiry_date,
  s.status
FROM user_subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active';
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check Supabase dashboard for errors
4. Verify environment variables
5. Test with sample data

---

## Summary

The subscription system provides a complete solution for selling and managing service packages. It includes:

✅ Admin package creation and management
✅ Customer purchase flow with payment integration
✅ Flexible redemption system
✅ Automatic day tracking and expiry management
✅ Comprehensive validation and security
✅ Clean, modern UI with responsive design

The system is production-ready and scalable for growing businesses.












