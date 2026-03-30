-- =============================================================================
-- MR Orders & Visit Marketing (Sales & Campaign flow)
-- Orders placed during a visit; marketing/merchandise used at outlet
-- =============================================================================

-- Order status for lifecycle (draft → sent → processing → delivered etc.)
CREATE TYPE mr_order_status AS ENUM (
  'DRAFT',
  'PENDING',
  'SENT',
  'PROCESSING',
  'DELIVERED',
  'CANCELLED'
);

-- Orders header: one per visit (sales/campaign)
CREATE TABLE public.mr_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.mr_visits(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.mr_pharmacies(id) ON DELETE CASCADE,
  status mr_order_status NOT NULL DEFAULT 'DRAFT',
  distributor_name TEXT,
  distributor_other TEXT,
  telesales_name TEXT,
  special_instructions TEXT,
  procurement_name TEXT,
  procurement_contact TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_id)
);

CREATE INDEX idx_mr_orders_visit ON public.mr_orders(visit_id);
CREATE INDEX idx_mr_orders_pharmacy ON public.mr_orders(pharmacy_id);
CREATE INDEX idx_mr_orders_status ON public.mr_orders(status);
CREATE INDEX idx_mr_orders_order_date ON public.mr_orders(order_date);

COMMENT ON TABLE public.mr_orders IS 'Order placed by MR during a visit (sales/campaign objective)';

-- Order line items (product, qty, bonus)
CREATE TABLE public.mr_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.mr_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.mr_products(id) ON DELETE CASCADE,
  quantity_ordered INT NOT NULL DEFAULT 0,
  bonus_quantity INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, product_id)
);

CREATE INDEX idx_mr_order_items_order ON public.mr_order_items(order_id);
CREATE INDEX idx_mr_order_items_product ON public.mr_order_items(product_id);

COMMENT ON TABLE public.mr_order_items IS 'Line items for an MR order';

-- Marketing / merchandising used during visit (sales & campaign)
CREATE TABLE public.mr_visit_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.mr_visits(id) ON DELETE CASCADE,
  wobblers INT NOT NULL DEFAULT 0,
  posters INT NOT NULL DEFAULT 0,
  shelf_talkers INT NOT NULL DEFAULT 0,
  flyers INT NOT NULL DEFAULT 0,
  other_activity TEXT,
  next_visit_date DATE,
  next_visit_notes TEXT,
  feedback_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_id)
);

CREATE INDEX idx_mr_visit_marketing_visit ON public.mr_visit_marketing(visit_id);

COMMENT ON TABLE public.mr_visit_marketing IS 'Merchandise and marketing activity recorded per visit';

-- RLS: MR can manage own visit orders; manager/admin can view/edit
ALTER TABLE public.mr_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mr_visit_marketing ENABLE ROW LEVEL SECURITY;

-- Policies rely on existing MR helpers (is_mr_user, get_mr_role, visit belongs to mr)
-- Allow MR to insert/update orders for their own visits
CREATE POLICY "mr_orders_select" ON public.mr_orders FOR SELECT USING (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      JOIN public.mr_profiles p ON p.id = v.mr_id
      WHERE v.id = visit_id AND p.manager_id = auth.uid()
    ))
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

CREATE POLICY "mr_orders_insert" ON public.mr_orders FOR INSERT WITH CHECK (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER')
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

CREATE POLICY "mr_orders_update" ON public.mr_orders FOR UPDATE USING (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER')
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

CREATE POLICY "mr_order_items_select" ON public.mr_order_items FOR SELECT USING (
  is_mr_user() AND EXISTS (
    SELECT 1 FROM public.mr_orders o
    JOIN public.mr_visits v ON v.id = o.visit_id
    WHERE o.id = order_id AND (
      get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
      OR v.mr_id = auth.uid()
    )
  )
);

CREATE POLICY "mr_order_items_insert" ON public.mr_order_items FOR INSERT WITH CHECK (
  is_mr_user() AND EXISTS (
    SELECT 1 FROM public.mr_orders o
    JOIN public.mr_visits v ON v.id = o.visit_id
    WHERE o.id = order_id AND (
      get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
      OR v.mr_id = auth.uid()
    )
  )
);

CREATE POLICY "mr_order_items_update" ON public.mr_order_items FOR UPDATE USING (
  is_mr_user() AND EXISTS (
    SELECT 1 FROM public.mr_orders o
    JOIN public.mr_visits v ON v.id = o.visit_id
    WHERE o.id = order_id AND (
      get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
      OR v.mr_id = auth.uid()
    )
  )
);

CREATE POLICY "mr_order_items_delete" ON public.mr_order_items FOR DELETE USING (
  is_mr_user() AND EXISTS (
    SELECT 1 FROM public.mr_orders o
    JOIN public.mr_visits v ON v.id = o.visit_id
    WHERE o.id = order_id AND (
      get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
      OR v.mr_id = auth.uid()
    )
  )
);

CREATE POLICY "mr_visit_marketing_select" ON public.mr_visit_marketing FOR SELECT USING (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN'
    OR (get_mr_role() = 'MANAGER' AND EXISTS (
      SELECT 1 FROM public.mr_visits v
      JOIN public.mr_profiles p ON p.id = v.mr_id
      WHERE v.id = visit_id AND p.manager_id = auth.uid()
    ))
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

CREATE POLICY "mr_visit_marketing_insert" ON public.mr_visit_marketing FOR INSERT WITH CHECK (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

CREATE POLICY "mr_visit_marketing_update" ON public.mr_visit_marketing FOR UPDATE USING (
  is_mr_user() AND (
    get_mr_role() = 'ADMIN' OR get_mr_role() = 'MANAGER'
    OR (get_mr_role() = 'MR' AND EXISTS (
      SELECT 1 FROM public.mr_visits v WHERE v.id = visit_id AND v.mr_id = auth.uid()
    ))
  )
);

-- Trigger to update updated_at on mr_orders and mr_visit_marketing
CREATE OR REPLACE FUNCTION mr_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mr_orders_updated_at
  BEFORE UPDATE ON public.mr_orders
  FOR EACH ROW EXECUTE FUNCTION mr_orders_updated_at();

CREATE TRIGGER mr_visit_marketing_updated_at
  BEFORE UPDATE ON public.mr_visit_marketing
  FOR EACH ROW EXECUTE FUNCTION mr_orders_updated_at();
