# MR Field Reporting – Business Context & Schema

Medical field reporting: MRs visit pharmacies/hospitals and submit field data. Managers supervise MRs and manage pharmacies. Admins manage system-wide settings and users. **Submitted data is read-only** (no editing after submission).

---

## 👥 Roles & Capabilities

| Role | Capabilities |
|------|--------------|
| **Admin** | Create users (MRs & Managers), assign roles, view all data (read-only). |
| **Manager** | Create & manage pharmacies, assign MRs to pharmacies, view dashboards & reports for **their MRs** and **their pharmacies**. Cannot edit submitted MR reports. |
| **Medical Rep (MR)** | View assigned pharmacies, submit visit reports (date, products, stock, competitor, notes), view own history only. |

---

## 🧱 Database Schema (Supabase / Postgres)

### Core tables (aligned with business context)

| Table | Purpose |
|-------|---------|
| **mr_profiles** | Users (MR, MANAGER, ADMIN). `manager_id` = supervisor for MRs. |
| **mr_pharmacies** | Pharmacies. `created_by` = manager who created. |
| **mr_pharmacy_assignments** | Which MR is assigned to which pharmacy. |
| **mr_visits** | Visit reports (check-in/out, notes). Immutable after SUBMITTED. |
| **mr_product_audits** | Products discussed per visit (stock, USP). |
| **mr_competitor_audits** | Competitor products per product audit. |

### Key columns

- **mr_profiles**: `id` (auth.users), `role` (admin \| manager \| mr), `full_name`, `manager_id` (nullable, for MRs), `email`, `region`.
- **mr_pharmacies**: `id`, `name`, `region`, `sub_region`, `location_text`, `created_by` (manager).
- **mr_pharmacy_assignments**: `id`, `pharmacy_id`, `mr_id`.
- **mr_visits**: `id`, `mr_id`, `pharmacy_id`, `check_in_time`, `check_out_time`, `notes`, `status` (OPEN \| SUBMITTED), `created_at`.
- **mr_product_audits**: `visit_id`, `product_id`, `quantity_in_stock`, `usp_understood`.
- **mr_competitor_audits**: `product_audit_id`, `competitor_name`, `competitor_stock`, `substitution_reason`.

Foreign keys, indexes, and RLS are defined in migrations.

---

## 🔐 RLS Summary

- **MRs**: Insert their own visit reports (and related audits). Read **own** data only. No UPDATE/DELETE on visits after submission.
- **Managers**: Read data from **MRs they manage** (`manager_id = auth.uid()`). Read **pharmacies they created** (`created_by = auth.uid()`). Create/update pharmacies (with `created_by = auth.uid()`). Create/update/delete pharmacy assignments for their MRs and their pharmacies. No UPDATE/DELETE on visit reports.
- **Admins**: Read everything. Create/update profiles, pharmacies, assignments. No UPDATE/DELETE on visit reports.

Helpers: `get_mr_role()`, `is_mr_user()`, `is_mr_manager_or_admin()`, `mr_managed_by_me(mr_id)`, `pharmacy_created_by_me(pharmacy_id)`.

---

## 📁 Next.js Folder Structure (App Router)

```
app/
├── mr/
│   ├── layout.tsx
│   ├── actions.ts              # Check-in/out, audits, create pharmacy, assign MR
│   ├── login/
│   │   ├── page.tsx
│   │   └── MrLoginForm.tsx
│   └── (app)/                   # Auth required
│       ├── layout.tsx           # Nav: Pharmacies, History (MR); Dashboard, Pharmacies, Users (Admin)
│       ├── page.tsx             # Home (redirect MR → pharmacies, Manager/Admin → dashboard)
│       ├── pharmacies/
│       │   ├── page.tsx         # MR: assigned list; Manager/Admin: their/all pharmacies + Create
│       │   └── [id]/
│       │       ├── page.tsx     # MR: check-in; Manager: assign MRs
│       │       ├── MrCheckInButton.tsx
│       │       └── MrAssignReps.tsx (Manager)
│       ├── visit/[id]/
│       │   ├── page.tsx
│       │   ├── MrVisitAuditForm.tsx
│       │   ├── MrCheckoutButton.tsx
│       │   └── MrVisitReadOnly.tsx
│       ├── history/page.tsx    # MR: read-only visit history
│       ├── dashboard/
│       │   ├── page.tsx         # Manager/Admin: KPIs, charts, visits (scoped by RLS)
│       │   └── MrDashboardClient.tsx
│       └── users/
│           ├── page.tsx         # Admin: user management, role assignment
│           └── MrUsersClient.tsx
api/mr/
├── products/route.ts
├── create-user/route.ts
├── upload-prescription/route.ts
├── signed-url/route.ts
└── logout/route.ts
lib/mr/
├── supabase-server.ts   # getMrAuth, requireMrRole, requireManagerOrAdmin
└── types.ts
```

---

## 📊 Example Supabase Queries

### MR: My assigned pharmacies

```ts
const { data } = await supabase
  .from("mr_pharmacy_assignments")
  .select(`
    pharmacy_id,
    mr_pharmacies (id, name, region, sub_region, location_text)
  `)
  .eq("mr_id", userId);
```

### MR: My visit history (read-only)

```ts
const { data } = await supabase
  .from("mr_visits")
  .select(`
    id,
    check_in_time,
    check_out_time,
    status,
    notes,
    mr_pharmacies (name, region)
  `)
  .eq("mr_id", userId)
  .eq("status", "SUBMITTED")
  .order("check_in_time", { ascending: false });
```

### Manager: Visits by my MRs (RLS filters automatically)

```ts
const { data } = await supabase
  .from("mr_visits")
  .select(`
    id,
    check_in_time,
    status,
    mr_profiles!mr_id (full_name),
    mr_pharmacies (name, region)
  `)
  .eq("status", "SUBMITTED")
  .order("check_in_time", { ascending: false });
```

### Manager: Pharmacies I created

```ts
const { data } = await supabase
  .from("mr_pharmacies")
  .select("id, name, region, location_text")
  .eq("created_by", managerId)
  .order("name");
```

### Admin: All users with role

```ts
const { data } = await supabase
  .from("mr_profiles")
  .select("id, full_name, email, role, region, manager_id, created_at")
  .order("created_at", { ascending: false });
```

### Insert visit (MR only; RLS enforces mr_id = auth.uid())

```ts
const { data, error } = await supabase
  .from("mr_visits")
  .insert({
    mr_id: auth.uid(),
    pharmacy_id,
    check_in_time: new Date().toISOString(),
    objective: "AUDIT",
    status: "OPEN",
    notes: "...",
  })
  .select("id")
  .single();
```

---

## Migrations (run in order)

1. `create_mr_field_intelligence_schema.sql` – tables, indexes, triggers
2. `create_mr_rls_policies.sql` – RLS policies
3. `fix_mr_visits_update_rls.sql` – allow MR to submit (UPDATE status to SUBMITTED)
4. `add_email_to_mr_profiles.sql` – email on profiles
5. `add_mr_manager_and_created_by.sql` – manager_id, created_by, notes
6. `mr_rls_manager_scope.sql` – Manager-scoped RLS (their MRs, their pharmacies)
7. `create_mr_storage.sql` – prescription images bucket
