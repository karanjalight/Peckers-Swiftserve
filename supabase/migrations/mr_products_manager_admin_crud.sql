-- =============================================================================
-- MR Products: Allow MANAGER and ADMIN to create, update, delete products
-- =============================================================================

DROP POLICY IF EXISTS "mr_products_insert_admin" ON public.mr_products;
DROP POLICY IF EXISTS "mr_products_update_admin" ON public.mr_products;

CREATE POLICY "mr_products_insert_manager_admin" ON public.mr_products
  FOR INSERT WITH CHECK (get_mr_role() IN ('MANAGER', 'ADMIN'));

CREATE POLICY "mr_products_update_manager_admin" ON public.mr_products
  FOR UPDATE USING (get_mr_role() IN ('MANAGER', 'ADMIN'));

-- Allow MANAGER and ADMIN to delete products (e.g. discontinued)
CREATE POLICY "mr_products_delete_manager_admin" ON public.mr_products
  FOR DELETE USING (get_mr_role() IN ('MANAGER', 'ADMIN'));
