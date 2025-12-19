-- =====================================================================
-- SUBSCRIPTION SYSTEM WITH PACKAGES, REDEMPTIONS, AND SERVICE TYPES
-- =====================================================================

-- =========================================
-- 1. ENUMS FOR SUBSCRIPTIONS
-- =========================================

-- Drop existing types if needed (only run if updating)
-- DROP TYPE IF EXISTS subscription_package_status CASCADE;
-- DROP TYPE IF EXISTS subscription_status CASCADE;
-- DROP TYPE IF EXISTS redemption_status CASCADE;
-- DROP TYPE IF EXISTS package_service_type CASCADE;

CREATE TYPE package_service_type AS ENUM (
  'nanny',
  'security'
);

CREATE TYPE subscription_package_status AS ENUM (
  'active',
  'inactive',
  'archived'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'expired',
  'cancelled',
  'redeemed'
);

CREATE TYPE redemption_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed'
);


-- =========================================
-- 2. SUBSCRIPTION_PACKAGES TABLE
--    (Admin creates these packages)
-- =========================================

CREATE TABLE subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Package Details
  name TEXT NOT NULL,                          -- e.g., "Gold Nanny Package"
  slug TEXT NOT NULL UNIQUE,                   -- e.g., "gold-nanny-package"
  service_type package_service_type NOT NULL,  -- 'nanny' or 'security'
  
  -- Pricing
  price NUMERIC(12,2) NOT NULL,                -- Package price
  
  -- Service Details
  service_days INT NOT NULL,                   -- e.g., 4 days of service
  validity_days INT NOT NULL DEFAULT 90,       -- Package valid for 90 days after purchase
  
  -- Description
  description TEXT,
  features JSONB DEFAULT '[]',                 -- Array of features
  terms_conditions TEXT,                       -- Terms and conditions
  
  -- Status
  status subscription_package_status DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_subscription_packages_service_type ON subscription_packages(service_type);
CREATE INDEX idx_subscription_packages_status ON subscription_packages(status);
CREATE INDEX idx_subscription_packages_slug ON subscription_packages(slug);

-- Trigger
CREATE TRIGGER update_subscription_packages_updated_at
BEFORE UPDATE ON subscription_packages
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =========================================
-- 3. USER_SUBSCRIPTIONS TABLE
--    (User purchases)
-- =========================================

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES subscription_packages(id) ON DELETE CASCADE,
  
  -- Status
  status subscription_status DEFAULT 'active',
  
  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,            -- Calculated from package validity_days
  activated_at TIMESTAMPTZ,
  
  -- Service Allocation
  service_days_total INT NOT NULL,             -- From package
  service_days_used INT DEFAULT 0,             -- Days used through redemptions
  service_days_remaining INT NOT NULL,         -- Calculated field
  
  -- Payment Info
  amount_paid NUMERIC(12,2) NOT NULL,
  payment_reference TEXT,                      -- M-Pesa or payment reference
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_package ON user_subscriptions(package_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expiry ON user_subscriptions(expiry_date);

-- Trigger
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =========================================
-- 4. SUBSCRIPTION_REDEMPTIONS TABLE
--    (User redeems days from their subscription)
-- =========================================

CREATE TABLE subscription_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Redemption Details
  days_to_redeem INT NOT NULL,                 -- Number of days user wants to use
  service_start_date DATE NOT NULL,
  service_end_date DATE NOT NULL,
  
  -- Location & Contact
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  
  -- Status
  status redemption_status DEFAULT 'pending',
  
  -- Assignment (links to actual service request)
  nanny_request_id UUID REFERENCES nanny_requests(id) ON DELETE SET NULL,
  security_request_id UUID REFERENCES security_requests(id) ON DELETE SET NULL,
  
  -- Admin Actions
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_redemptions_subscription ON subscription_redemptions(subscription_id);
CREATE INDEX idx_subscription_redemptions_user ON subscription_redemptions(user_id);
CREATE INDEX idx_subscription_redemptions_status ON subscription_redemptions(status);
CREATE INDEX idx_subscription_redemptions_nanny_request ON subscription_redemptions(nanny_request_id);
CREATE INDEX idx_subscription_redemptions_security_request ON subscription_redemptions(security_request_id);

-- Trigger
CREATE TRIGGER update_subscription_redemptions_updated_at
BEFORE UPDATE ON subscription_redemptions
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();


-- =========================================
-- 5. FUNCTIONS FOR BUSINESS LOGIC
-- =========================================

-- Function to calculate remaining days
CREATE OR REPLACE FUNCTION calculate_remaining_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.service_days_remaining := NEW.service_days_total - NEW.service_days_used;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate remaining days
CREATE TRIGGER auto_calculate_remaining_days
BEFORE INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE calculate_remaining_days();


-- Function to check subscription validity before redemption
CREATE OR REPLACE FUNCTION check_subscription_validity()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription user_subscriptions%ROWTYPE;
BEGIN
  -- Get subscription details
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE id = NEW.subscription_id;
  
  -- Check if subscription exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  
  -- Check if subscription is active
  IF v_subscription.status != 'active' THEN
    RAISE EXCEPTION 'Subscription is not active';
  END IF;
  
  -- Check if subscription has expired
  IF v_subscription.expiry_date < NOW() THEN
    RAISE EXCEPTION 'Subscription has expired';
  END IF;
  
  -- Check if enough days remaining
  IF v_subscription.service_days_remaining < NEW.days_to_redeem THEN
    RAISE EXCEPTION 'Insufficient service days remaining';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate redemption
CREATE TRIGGER validate_redemption_before_insert
BEFORE INSERT ON subscription_redemptions
FOR EACH ROW
EXECUTE PROCEDURE check_subscription_validity();


-- Function to update subscription after redemption approval
CREATE OR REPLACE FUNCTION update_subscription_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if redemption is approved (status changed to 'approved' or 'completed')
  IF NEW.status IN ('approved', 'completed') AND OLD.status = 'pending' THEN
    UPDATE user_subscriptions
    SET service_days_used = service_days_used + NEW.days_to_redeem,
        updated_at = NOW()
    WHERE id = NEW.subscription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscription when redemption is approved
CREATE TRIGGER update_subscription_after_redemption_approval
AFTER UPDATE ON subscription_redemptions
FOR EACH ROW
EXECUTE PROCEDURE update_subscription_on_redemption();


-- Function to auto-expire subscriptions
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;


-- =========================================
-- 6. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =========================================

-- Insert sample packages
INSERT INTO subscription_packages (name, slug, service_type, price, service_days, validity_days, description, features, status) VALUES
  ('Gold Nanny Package', 'gold-nanny-package', 'nanny', 15000.00, 4, 90, 'Perfect for short-term nanny needs', '["4 days of professional nanny service", "Verified and experienced nannies", "Flexible scheduling", "90 days validity"]', 'active'),
  ('Platinum Nanny Package', 'platinum-nanny-package', 'nanny', 35000.00, 10, 180, 'Comprehensive nanny service package', '["10 days of professional nanny service", "Premium nanny selection", "Priority booking", "180 days validity", "24/7 support"]', 'active'),
  ('Silver Nanny Package', 'silver-nanny-package', 'nanny', 8000.00, 2, 60, 'Starter nanny service package', '["2 days of professional nanny service", "Verified nannies", "60 days validity"]', 'active'),
  ('Gold Security Package', 'gold-security-package', 'security', 20000.00, 5, 90, 'Professional security service for your home', '["5 days of security service", "Trained security personnel", "Optional security dogs", "90 days validity"]', 'active'),
  ('Platinum Security Package', 'platinum-security-package', 'security', 45000.00, 12, 180, 'Premium security coverage', '["12 days of security service", "Elite security team", "Multiple dogs and handlers", "180 days validity", "Emergency response"]', 'active');


-- =========================================
-- 7. PERMISSIONS (RLS POLICIES)
-- =========================================

-- Enable RLS
ALTER TABLE subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_redemptions ENABLE ROW LEVEL SECURITY;

-- Subscription Packages: Public can view active packages
CREATE POLICY "Anyone can view active subscription packages"
  ON subscription_packages FOR SELECT
  USING (status = 'active');

-- Subscription Packages: Only admins can manage
CREATE POLICY "Admins can manage subscription packages"
  ON subscription_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email IN (
        SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- User Subscriptions: Users can view their own
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- User Subscriptions: Users can create their own
CREATE POLICY "Users can create their own subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Redemptions: Users can view their own
CREATE POLICY "Users can view their own redemptions"
  ON subscription_redemptions FOR SELECT
  USING (user_id = auth.uid());

-- Redemptions: Users can create their own
CREATE POLICY "Users can create their own redemptions"
  ON subscription_redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all subscriptions and redemptions
CREATE POLICY "Admins can view all user subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email IN (
        SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage all redemptions"
  ON subscription_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email IN (
        SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

