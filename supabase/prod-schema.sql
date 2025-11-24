-- =====================================================================
-- EXTENSIONS (required for UUID + timestamps)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";



-- Function to auto-update "updated_at" column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================
-- ENUM TYPES
-- =====================================================================

CREATE TYPE service_type AS ENUM (
  'emergency_under_6_hours',
  'sunday_day_bug',
  'short_term_daily'
);

CREATE TYPE nanny_status AS ENUM (
  'available',
  'busy',
  'inactive'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed'
);


-- =====================================================================
-- USERS PROFILE TABLE (linked to Supabase auth.users)
-- =====================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);


-- Trigger to keep updated_at fresh
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- NANNIES TABLE
-- =====================================================================

CREATE TABLE nannies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience_years INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  
  status nanny_status DEFAULT 'available',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nannies_status ON nannies(status);


CREATE TRIGGER update_nannies_updated_at
BEFORE UPDATE ON nannies
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- NANNY REQUESTS (YOUR MAIN FORM)
-- =====================================================================

CREATE TABLE nanny_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional Supabase user
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Client Info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  id_number TEXT NOT NULL,

  -- Family Info
  household_description TEXT,

  -- Service selection
  service_needed service_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  notes TEXT,

  -- Status Flags
  is_paid BOOLEAN DEFAULT FALSE,
  is_assigned BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_user ON nanny_requests(user_id);
CREATE INDEX idx_requests_service ON nanny_requests(service_needed);
CREATE INDEX idx_requests_paid ON nanny_requests(is_paid);


CREATE TRIGGER update_nanny_requests_updated_at
BEFORE UPDATE ON nanny_requests
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- NANNY ASSIGNMENTS (linking nannies → requests)
-- =====================================================================

CREATE TABLE nanny_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES nanny_requests(id) ON DELETE CASCADE,
  nanny_id UUID NOT NULL REFERENCES nannies(id) ON DELETE CASCADE,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- States
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_request ON nanny_assignments(request_id);
CREATE INDEX idx_assignments_nanny ON nanny_assignments(nanny_id);
CREATE INDEX idx_assignments_active ON nanny_assignments(is_active);


-- =====================================================================
-- PAYMENTS TABLE
-- =====================================================================

CREATE TABLE nanny_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES nanny_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  amount NUMERIC(12,2) NOT NULL,
  status payment_status DEFAULT 'pending',

  mpesa_reference TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON nanny_payments(user_id);
CREATE INDEX idx_payments_request ON nanny_payments(request_id);
CREATE INDEX idx_payments_status ON nanny_payments(status);


-- =====================================================================
-- OPTIONAL: SIMPLE AUDIT LOG (good for admin dashboards)
-- =====================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);


-- Security Dogs ==================================================
-- =====================================================================
-- ENUMS FOR SECURITY SERVICE
-- =====================================================================

CREATE TYPE security_dog_option AS ENUM (
  'one_dog_one_handler',
  'two_dogs_two_handlers',
  'three_plus'
);

CREATE TYPE security_reason AS ENUM (
  'travel_vacation',
  'night_shift',
  'house_help_exit',
  'construction_period',
  'high_risk_period',
  'other'
);


-- =====================================================================
-- SECURITY REQUESTS TABLE (Matches your form exactly)
-- =====================================================================

CREATE TABLE security_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional user reference
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Client Info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  id_number TEXT NOT NULL,

  -- Service Duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Dog Requirement
  dog_option security_dog_option,

  -- Reason for security
  reason security_reason,

  -- Notes
  notes TEXT,

  -- Status Flags
  is_paid BOOLEAN DEFAULT FALSE,
  is_assigned BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_requests_user ON security_requests(user_id);
CREATE INDEX idx_security_requests_paid ON security_requests(is_paid);
CREATE INDEX idx_security_requests_reason ON security_requests(reason);

CREATE TRIGGER update_security_requests_updated_at
BEFORE UPDATE ON security_requests
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- SECURITY DOGS (Optional: You can grow into this over time)
-- =====================================================================

CREATE TABLE security_dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  breed TEXT,
  age INT,

  is_available BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_dogs_available ON security_dogs(is_available);

CREATE TRIGGER update_security_dogs_updated_at
BEFORE UPDATE ON security_dogs
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- SECURITY HANDLERS (Human guards)
-- =====================================================================

CREATE TABLE security_handlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  experience_years INT DEFAULT 0,

  is_available BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_handlers_available ON security_handlers(is_available);

CREATE TRIGGER update_security_handlers_updated_at
BEFORE UPDATE ON security_handlers
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =====================================================================
-- SECURITY ASSIGNMENTS (link dogs + handlers → requests)
-- =====================================================================

CREATE TABLE security_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES security_requests(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES security_dogs(id) ON DELETE SET NULL,
  handler_id UUID REFERENCES security_handlers(id) ON DELETE SET NULL,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_assignments_request ON security_assignments(request_id);
CREATE INDEX idx_security_assignments_handler ON security_assignments(handler_id);
CREATE INDEX idx_security_assignments_dog ON security_assignments(dog_id);
CREATE INDEX idx_security_assignments_active ON security_assignments(is_active);


-- =====================================================================
-- SECURITY PAYMENTS
-- =====================================================================

CREATE TABLE security_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  request_id UUID REFERENCES security_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  amount NUMERIC(12,2) NOT NULL,
  status payment_status DEFAULT 'pending',

  mpesa_reference TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_payments_user ON security_payments(user_id);
CREATE INDEX idx_security_payments_request ON security_payments(request_id);
CREATE INDEX idx_security_payments_status ON security_payments(status);


-- =======================================================================================
-- Subscriptions
-- =========================================
-- 1. ENUMS
-- =========================================

CREATE TYPE subscription_status AS ENUM (
  'active',
  'expired',
  'cancelled'
);

-- =========================================
-- 2. subscription_plans TABLE
-- =========================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,               -- gold, platinum
  price NUMERIC(10,2) NOT NULL,            -- monthly price
  description TEXT,                        -- optional
  features JSONB DEFAULT '[]',             -- list of features
  duration_days INT NOT NULL DEFAULT 30,   -- default 30 days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Useful index for querying by name
CREATE INDEX idx_subscription_plans_name
  ON subscription_plans (name);


-- =========================================
-- 3. user_subscriptions TABLE
-- =========================================

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  transaction_id TEXT,                     -- M-Pesa or Stripe reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user
  ON user_subscriptions (user_id);

CREATE INDEX idx_user_subscriptions_status
  ON user_subscriptions (status);

CREATE INDEX idx_user_subscriptions_plan
  ON user_subscriptions (plan_id);

CREATE INDEX idx_user_subscriptions_end_date
  ON user_subscriptions (end_date);




-- 9️⃣ BLOGS TABLE
create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete set null,

  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,                   -- markdown or HTML
  cover_image_url text,

  tags text[] default '{}',                -- array of tags
  status text default 'draft',             -- draft | published
  view_count integer default 0,

  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_blogs_author_id on blogs(author_id);
create index idx_blogs_status on blogs(status);
create index idx_blogs_tags on blogs using gin(tags);

-- Auto-update updated_at timestamp
drop trigger if exists blogs_timestamp on blogs;

create trigger blogs_timestamp
before update on blogs
for each row
execute function update_timestamp();


CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blogs
  SET view_count = view_count + 1
  WHERE id = blog_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_blog_views(UUID) TO anon;