// lib/hooks/useProduct.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  barcode: string;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  weight_kg: number;
  dimensions_cm: string;
  is_active: boolean;
  is_on_sale: boolean;
  sale_price: number;
  discount_percentage: number;
  image_url: string;
  rating: number;
  review_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  updateProduct: (updates: Partial<Product>) => Promise<void>;
  deleteProduct: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProduct(productId: string): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Product not found');

      setProduct(data as Product);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product';
      setError(message);
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (updates: Partial<Product>) => {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (updateError) throw updateError;

      setProduct((prev) => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      setError(message);
      throw err;
    }
  };

  const deleteProduct = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      setError(message);
      throw err;
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return {
    product,
    loading,
    error,
    updateProduct,
    deleteProduct,
    refetch: fetchProduct,
  };
}

// lib/utils/productCalcs.ts
export interface ProfitMargin {
  profit: number;
  margin: string;
  roi: string;
}

export function calculateProfitMetrics(
  sellingPrice: number,
  costPrice: number
): ProfitMargin {
  const profit = sellingPrice - costPrice;
  const margin =
    sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';
  const roi =
    costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : '0';

  return { profit, margin, roi };
}

export function getStockStatus(
  stock: number,
  threshold: number
): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) return 'out-of-stock';
  if (stock <= threshold) return 'low-stock';
  return 'in-stock';
}

export function getStockColor(stock: number, threshold: number): string {
  const status = getStockStatus(stock, threshold);
  switch (status) {
    case 'out-of-stock':
      return 'text-red-600 bg-red-50';
    case 'low-stock':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-emerald-600 bg-emerald-50';
  }
}

export function calculateDiscount(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice === 0) return 0;
  return parseFloat(
    (((originalPrice - salePrice) / originalPrice) * 100).toFixed(1)
  );
}

// lib/utils/productValidation.ts
export interface ProductValidationError {
  field: string;
  message: string;
}

export function validateProduct(product: Partial<Record<string, any>>): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  if (!product.name?.trim()) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }

  if (!product.category?.trim()) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (product.price === undefined || product.price < 0) {
    errors.push({ field: 'price', message: 'Price must be a positive number' });
  }

  if (product.cost_price !== undefined && product.cost_price < 0) {
    errors.push({
      field: 'cost_price',
      message: 'Cost price must be a positive number',
    });
  }

  if (product.stock !== undefined && product.stock < 0) {
    errors.push({ field: 'stock', message: 'Stock must be a non-negative number' });
  }

  if (product.sku && !product.sku.trim()) {
    errors.push({ field: 'sku', message: 'SKU cannot be empty' });
  }

  if (
    product.discount_percentage &&
    (product.discount_percentage < 0 || product.discount_percentage > 100)
  ) {
    errors.push({
      field: 'discount_percentage',
      message: 'Discount must be between 0 and 100',
    });
  }

  return errors;
}
