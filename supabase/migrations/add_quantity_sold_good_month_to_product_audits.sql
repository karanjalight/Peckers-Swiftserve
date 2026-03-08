-- Add quantity sold in a good month to product audits (Stock & pharmacy)
ALTER TABLE public.mr_product_audits
  ADD COLUMN IF NOT EXISTS quantity_sold_good_month INT;

COMMENT ON COLUMN public.mr_product_audits.quantity_sold_good_month IS 'Quantity sold in a good month (packs)';
