-- =============================================================================
-- Products: price, owned_by; Competitor audits: supplier
-- =============================================================================

-- mr_products: price (KES), owned_by
ALTER TABLE public.mr_products
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS owned_by TEXT;

COMMENT ON COLUMN public.mr_products.price IS 'Product price in KES';
COMMENT ON COLUMN public.mr_products.owned_by IS 'Who owns / manufactures this product (company or brand)';

-- Backfill existing products with prices: 400, 450, 500, 550, 600 (incremental +50)
-- Order by sku as per seed: FLR-001, ULG-001, ZEF-001, EME-001, PUR-001
UPDATE public.mr_products SET price = 400 WHERE sku = 'FLR-001';
UPDATE public.mr_products SET price = 450 WHERE sku = 'ULG-001';
UPDATE public.mr_products SET price = 500 WHERE sku = 'ZEF-001';
UPDATE public.mr_products SET price = 550 WHERE sku = 'EME-001';
UPDATE public.mr_products SET price = 600 WHERE sku = 'PUR-001';

-- Set default owned_by for company products (Peckers or similar - use generic)
UPDATE public.mr_products SET owned_by = 'Company' WHERE is_company_product = TRUE AND (owned_by IS NULL OR owned_by = '');

-- mr_competitor_audits: supplier (who supplies this competitor product)
ALTER TABLE public.mr_competitor_audits
  ADD COLUMN IF NOT EXISTS supplier TEXT;

COMMENT ON COLUMN public.mr_competitor_audits.supplier IS 'Supplier of the competitor product';
