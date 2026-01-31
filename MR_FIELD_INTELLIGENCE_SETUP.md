# MR Field Intelligence System - Setup & Architecture

This document describes the Medical Rep (MR) field intelligence extension added to the Peckers-Swiftserve project. The system is fully isolated from existing functionality—no existing tables or routes are modified.

---

## 1. Database Schema

Run these migrations in order in your Supabase SQL Editor (or via `supabase db push`):

1. **`supabase/migrations/create_mr_field_intelligence_schema.sql`** – Tables, indexes, triggers, seed products
2. **`supabase/migrations/create_mr_rls_policies.sql`** – Row Level Security policies
3. **`supabase/migrations/create_mr_storage.sql`** – Storage bucket and policies

### Tables

| Table | Purpose |
|-------|---------|
| `mr_profiles` | MR users (linked to `auth.users`). Roles: MR, MANAGER, ADMIN |
| `mr_pharmacies` | Pharmacy master data |
| `mr_pharmacy_assignments` | Which pharmacies each MR is assigned to |
| `mr_visits` | Visit records (check-in/check-out, immutable after SUBMITTED) |
| `mr_products` | Master product list (preloaded: Ulgicid, Floranorm, Zefcolin, Emefilm, Purecal) |
| `mr_product_audits` | Stock & USP per product per visit |
| `mr_competitor_audits` | Competitor substitutions linked to product audits |
| `mr_doctors` | Doctor master list |
| `mr_prescription_audits` | Prescription data per visit |
| `mr_competitor_marketing` | Competitor marketing activities per visit |

---

## 2. Storage

- **Bucket:** `mr-prescription-images`
- **Private:** Yes
- **Path format:** `{visit_id}/{uuid}.{ext}`
- **Allowed MIME:** image/jpeg, image/png, image/webp
- **Max size:** 5MB

Create the bucket in Supabase Dashboard → Storage if the migration fails (e.g. if `storage.buckets` INSERT is not allowed).

---

## 3. First Admin User

After running migrations, create the first MR admin:

1. Create a user in Supabase Auth (Dashboard → Authentication → Users, or signup flow).
2. Insert into `mr_profiles`:

```sql
INSERT INTO public.mr_profiles (id, full_name, role)
VALUES ('YOUR_AUTH_USER_UUID', 'Admin Name', 'ADMIN');
```

3. That user can log in at `/mr/login` or `/login` (redirects to `/mr`).

---

## 4. Folder Structure

```
app/
├── mr/
│   ├── layout.tsx           # Pass-through (no auth)
│   ├── actions.ts           # Server Actions (check-in, check-out, audits)
│   ├── login/               # Public - no auth required
│   │   ├── page.tsx
│   │   └── MrLoginForm.tsx
│   └── (app)/               # Route group - auth required
│       ├── layout.tsx       # MR nav, auth guard, redirect to /mr/login
│       ├── page.tsx         # MR home (redirects Managers to dashboard)
│       ├── pharmacies/
│       │   ├── page.tsx         # Assigned pharmacies list
│       │   └── [id]/
│       │       ├── page.tsx     # Pharmacy detail + check-in
│       │       └── MrCheckInButton.tsx
│       ├── visit/
│       │   └── [id]/
│       │       ├── page.tsx
│       │       ├── MrVisitAuditForm.tsx
│       │       ├── MrCheckoutButton.tsx
│       │       └── MrVisitReadOnly.tsx
│       ├── history/
│       │   └── page.tsx         # MR visit history (read-only)
│       ├── dashboard/
│       │   ├── page.tsx         # Manager/Admin dashboard (read-only)
│       │   └── MrDashboardClient.tsx
│       └── users/
│           ├── page.tsx         # Admin: create MR accounts
│           ├── MrUsersClient.tsx
│           └── CredentialsCard.tsx  # Copy, Share, Download PDF
api/
└── mr/
    ├── products/route.ts
    ├── create-user/route.ts   # Admin: create MR account (auth + profile)
    ├── upload-prescription/route.ts
    ├── signed-url/route.ts
    └── logout/route.ts
lib/
└── mr/
    ├── supabase-server.ts   # Auth helpers, getMrSupabase, requireMrRole
    └── types.ts
```

---

## 5. Authentication & Roles

| Role | Permissions |
|------|-------------|
| **MR** | Create visits, check-in/out, add audits. Cannot edit after checkout. |
| **MANAGER** | Read-only dashboards, view all visits. No edit/delete. |
| **ADMIN** | Same as Manager + can manage mr_profiles, pharmacies, assignments. |

### RLS Summary

- **mr_visits:** MR can INSERT/UPDATE (only OPEN). Manager/Admin SELECT only. Trigger blocks UPDATE when status=SUBMITTED.
- **mr_product_audits, mr_prescription_audits, mr_competitor_marketing:** MR INSERT only (for own OPEN visits). No UPDATE/DELETE.
- **mr_profiles, mr_pharmacies, mr_pharmacy_assignments:** Admin INSERT/UPDATE. All MR users SELECT.

---

## 6. End-to-End Flow

### MR Flow

1. Login at `/mr/login` or `/login` (redirects if MR profile exists).
2. View **Pharmacies** → select pharmacy → **Check In** (captures time + GPS).
3. Fill **Product Audits** (stock, USP, competitors), **Prescription Audits**, **Competitor Marketing**.
4. **Check Out & Submit** (red button). Visit becomes immutable.
5. View **History** (read-only).

### Manager/Admin Flow

1. Login at `/mr/login` or `/login`.
2. Redirected to `/mr/dashboard`.
3. View KPIs (total visits, stock-outs, substitution rate %).
4. View charts (by region, product, time).
5. Filter/sort visits table, click **View** to see visit detail (read-only).

---

## 7. Server Actions

| Action | Purpose |
|--------|---------|
| `mrCheckIn` | Create OPEN visit, verify pharmacy assignment |
| `mrCheckOut` | Set check_out_time, status=SUBMITTED |
| `createProductAudit` | Add product audit + optional competitor audits |
| `createPrescriptionAudit` | Add prescription audit (optionally with image path) |
| `createCompetitorMarketing` | Add competitor marketing record |
| `findOrCreateDoctor` | Lookup or create doctor for prescription audit |

---

## 8. Security Notes

- No UPDATE or DELETE on submitted visit data.
- RLS enforces MR ownership and visit status.
- Prescription images stored in private bucket; signed URLs for viewing.
- Middleware protects `/mr/*` (except `/mr/login`).

---

## 9. Environment

Required Supabase env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for creating MR accounts via admin UI)

---

## 10. MR User Management (Admin)

Admins can create MR accounts at **/mr/users**:

1. Log in as ADMIN at `/mr/login`
2. Click **Users** in the header
3. Fill the form (name, email, role, region, password)
4. Use the key icon to generate a random password
5. Click **Create Account**
6. After creation: **Copy**, **Share**, or **Download PDF** the credentials

The credentials card includes the login URL, email, and temporary password.
