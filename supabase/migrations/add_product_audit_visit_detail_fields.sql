-- =============================================================================
-- Product Audit Visit Detail - Extended Fields
-- Adds: reason_why_stock, supplier (product); stock_sold_per_month (competitors)
-- Supports robust visit/detail product capture per client requirements
-- =============================================================================

-- mr_product_audits: reason why they stock the product, supplier
ALTER TABLE public.mr_product_audits
  ADD COLUMN IF NOT EXISTS reason_why_stock TEXT,
  ADD COLUMN IF NOT EXISTS supplier TEXT;

COMMENT ON COLUMN public.mr_product_audits.reason_why_stock IS 'Reason why pharmacy stocks this product';
COMMENT ON COLUMN public.mr_product_audits.supplier IS 'Supplier of the product';

-- mr_competitor_audits: stock sold per month, days out, reason out of stock (for competitors)
ALTER TABLE public.mr_competitor_audits
  ADD COLUMN IF NOT EXISTS stock_sold_per_month INT,
  ADD COLUMN IF NOT EXISTS days_out INT,
  ADD COLUMN IF NOT EXISTS reason_out_of_stock TEXT;

COMMENT ON COLUMN public.mr_competitor_audits.stock_sold_per_month IS 'Competitor stock sold per month (packs)';
COMMENT ON COLUMN public.mr_competitor_audits.days_out IS 'Days competitor product was out of stock';
COMMENT ON COLUMN public.mr_competitor_audits.reason_out_of_stock IS 'Reason competitor product out of stock';
