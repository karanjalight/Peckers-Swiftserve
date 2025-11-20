
// lib/services/productService.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface ProductFilter {
  category?: string;
  isActive?: boolean;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export async function getProducts(
  filters: ProductFilter = {},
  page: number = 1,
  pageSize: number = 10
) {
  let query = supabase.from('products').select('*', { count: 'exact' });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters.inStock !== undefined) {
    if (filters.inStock) {
      query = query.gt('stock', 0);
    } else {
      query = query.eq('stock', 0);
    }
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.searchTerm) {
    query = query.or(
      `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,sku.ilike.%${filters.searchTerm}%`
    );
  }

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data || [],
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductStock(
  productId: string,
  quantity: number
) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;

  const newStock = Math.max(0, product.stock + quantity);

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);

  if (updateError) throw updateError;

  return newStock;
}

export async function bulkUpdateProducts(
  updates: Array<{ id: string; [key: string]: any }>
) {
  const { error } = await supabase.from('products').upsert(updates);
  if (error) throw error;
}

export async function getProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

export async function searchProducts(searchTerm: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
    )
    .eq('is_active', true)
    .limit(10);

  if (error) throw error;
  return data || [];
}