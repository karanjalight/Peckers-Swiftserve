# Quick Setup Guide - Subscription System

## 🚀 Getting Started in 5 Steps

### Step 1: Run Database Migration
Execute the subscription schema in your Supabase database:

**Option A - Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open `supabase/subscription-schema.sql`
4. Copy and paste the contents
5. Click "Run"

**Option B - Command Line:**
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/subscription-schema.sql
```

### Step 2: Set Environment Variables
Ensure these are in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

### Step 3: Set Up Admin User
1. Go to Supabase Dashboard → Authentication → Users
2. Find your admin user
3. Click the user → Edit
4. Under "Raw User Meta Data", add:
```json
{
  "role": "admin"
}
```
5. Save

### Step 4: Create Your First Package
1. Log in as admin
2. Go to `/admin/subscriptions`
3. Click "Create Package"
4. Fill in the details:
   - Name: e.g., "Gold Nanny Package"
   - Service Type: nanny or security
   - Price: e.g., 15000
   - Service Days: e.g., 4
   - Validity Days: e.g., 90
   - Add features
5. Save and activate

### Step 5: Test the Flow
**As Customer:**
1. Visit `/subscriptions`
2. Browse packages
3. Click "Get Started" on a package
4. Complete purchase (use Paystack test cards)
5. Go to `/account` → Subscriptions tab
6. Click "Redeem Days"
7. Fill in redemption form and submit

**As Admin:**
1. Go to `/admin/subscriptions/redemptions`
2. View pending redemptions
3. Approve or reject requests
4. Mark as completed after service

---

## 📁 Files Created

### Backend/Database
- `supabase/subscription-schema.sql` - Complete database schema

### Admin Pages
- `app/admin/subscriptions/page.tsx` - Package management
- `app/admin/subscriptions/create/page.tsx` - Create packages
- `app/admin/subscriptions/redemptions/page.tsx` - Manage redemptions

### Customer Pages
- `app/subscriptions/page.tsx` - Browse packages
- `app/subscriptions/purchase/[slug]/page.tsx` - Purchase flow
- `app/subscriptions/redeem/[id]/page.tsx` - Redeem days
- `app/account/page.tsx` - Updated with subscriptions tab

### API
- `app/api/subscriptions/verify-payment/route.ts` - Payment verification

### Components
- `components/app-sidebar.tsx` - Updated with subscriptions menu

### Documentation
- `SUBSCRIPTION_SYSTEM.md` - Complete documentation
- `SUBSCRIPTION_SETUP_GUIDE.md` - This file

---

## 🎨 Key Features Implemented

### Admin Features
✅ Create/edit/delete subscription packages
✅ Toggle package status (active/inactive)
✅ View all redemption requests
✅ Approve/reject redemptions
✅ Mark redemptions as completed
✅ Real-time statistics dashboard

### Customer Features
✅ Browse all packages with filtering
✅ Purchase subscriptions with Paystack
✅ View active subscriptions
✅ Track remaining days
✅ Redeem subscription days
✅ Automatic end date calculation
✅ Expiry warnings

### System Features
✅ Row Level Security (RLS)
✅ Automatic day calculations
✅ Payment verification
✅ Expiry management
✅ Service type separation (Nanny/Security)
✅ Mobile-responsive design

---

## 🧪 Testing Checklist

### Admin Testing
- [ ] Login as admin user
- [ ] Access `/admin/subscriptions`
- [ ] Create a test package
- [ ] Edit the package
- [ ] Toggle status
- [ ] View redemptions page
- [ ] Approve a redemption
- [ ] Reject a redemption

### Customer Testing
- [ ] Browse packages at `/subscriptions`
- [ ] Filter by service type
- [ ] Click "Get Started"
- [ ] Complete purchase flow
- [ ] Verify payment
- [ ] Check `/account` subscriptions tab
- [ ] Redeem days
- [ ] View redemption status

### Payment Testing
Use Paystack test cards:
- Success: `4084 0840 8408 4081`
- Insufficient Funds: `5060 6666 6666 6666`

---

## 🔑 Important URLs

### Admin
- Packages: `/admin/subscriptions`
- Create Package: `/admin/subscriptions/create`
- Redemptions: `/admin/subscriptions/redemptions`

### Customer
- Browse: `/subscriptions`
- Account: `/account` (Subscriptions tab)
- Purchase: `/subscriptions/purchase/[slug]`
- Redeem: `/subscriptions/redeem/[id]`

---

## 💡 Sample Packages

The schema includes sample packages. To use them:
1. Run the full schema (includes sample data)
2. Or create manually through the admin interface

**Sample packages:**
- Silver Nanny: KES 8,000 (2 days, 60 days validity)
- Gold Nanny: KES 15,000 (4 days, 90 days validity)
- Platinum Nanny: KES 35,000 (10 days, 180 days validity)
- Gold Security: KES 20,000 (5 days, 90 days validity)
- Platinum Security: KES 45,000 (12 days, 180 days validity)

---

## 🐛 Troubleshooting

### "Permission denied" errors
- Check RLS policies are enabled
- Verify user is authenticated
- Confirm admin role for admin pages

### "Package not found"
- Ensure package status is "active"
- Check slug matches URL
- Verify package exists in database

### Payment not working
- Check Paystack keys in environment
- Test with Paystack test cards
- Verify webhook URL if using production

### Redemption validation errors
- Check subscription hasn't expired
- Verify remaining days > 0
- Ensure dates are within validity period

---

## 📊 Database Queries

### Check active subscriptions
```sql
SELECT * FROM user_subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

### View pending redemptions
```sql
SELECT * FROM subscription_redemptions 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Expire old subscriptions
```sql
SELECT expire_old_subscriptions();
```

### View package statistics
```sql
SELECT 
  sp.name,
  sp.service_type,
  COUNT(us.id) as total_purchases,
  SUM(us.amount_paid) as total_revenue
FROM subscription_packages sp
LEFT JOIN user_subscriptions us ON sp.id = us.package_id
GROUP BY sp.id, sp.name, sp.service_type;
```

---

## 🚨 Important Notes

1. **Days are deducted ONLY when admin approves** redemption, not on submission
2. **Expiry date** is calculated from purchase date + validity_days
3. **Remaining days** auto-calculated via database trigger
4. **Payment must complete** before subscription is activated
5. **Admin role required** for admin pages and package management

---

## 📞 Next Steps

After setup is complete:

1. **Customize packages** - Adjust prices, days, features to match your business
2. **Set up notifications** - Add email/SMS for redemption updates
3. **Configure payment** - Switch to production Paystack keys when ready
4. **Train admin staff** - Walk through redemption approval process
5. **Market to customers** - Promote subscription packages
6. **Monitor usage** - Track popular packages and redemption patterns

---

## 🎉 You're All Set!

The subscription system is now fully operational. Customers can purchase packages and redeem days as needed. Admins have complete control over packages and redemptions.

For detailed documentation, see `SUBSCRIPTION_SYSTEM.md`.

For support or questions, refer to the troubleshooting section above.

**Happy selling! 🚀**












