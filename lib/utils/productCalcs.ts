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
  
  export function formatPrice(price: number, currency: string = 'Ksh'): string {
    return `${currency} ${price.toFixed(2)}`;
  }
  
  export function formatStock(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return `Low Stock (${stock})`;
    return stock.toString();
  }
  
  // lib/utils/productValidation.ts
  export interface ProductValidationError {
    field: string;
    message: string;
  }
  
  export function validateProduct(
    product: Partial<Record<string, any>>
  ): ProductValidationError[] {
    const errors: ProductValidationError[] = [];
  
    if (!product.name?.trim()) {
      errors.push({ field: 'name', message: 'Product name is required' });
    }
  
    if (!product.category?.trim()) {
      errors.push({ field: 'category', message: 'Category is required' });
    }
  
    if (product.price === undefined || product.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (product.price < 0) {
      errors.push({ field: 'price', message: 'Price must be a positive number' });
    }
  
    if (product.cost_price !== undefined && product.cost_price !== null) {
      if (product.cost_price < 0) {
        errors.push({
          field: 'cost_price',
          message: 'Cost price must be a positive number',
        });
      }
    }
  
    if (product.stock !== undefined && product.stock !== null) {
      if (product.stock < 0) {
        errors.push({
          field: 'stock',
          message: 'Stock must be a non-negative number',
        });
      }
    }
  
    if (product.sku && !product.sku.trim()) {
      errors.push({ field: 'sku', message: 'SKU cannot be empty' });
    }
  
    if (product.discount_percentage !== undefined && product.discount_percentage !== null) {
      if (product.discount_percentage < 0 || product.discount_percentage > 100) {
        errors.push({
          field: 'discount_percentage',
          message: 'Discount must be between 0 and 100',
        });
      }
    }
  
    if (product.weight_kg !== undefined && product.weight_kg !== null) {
      if (product.weight_kg < 0) {
        errors.push({
          field: 'weight_kg',
          message: 'Weight must be a positive number',
        });
      }
    }
  
    return errors;
  }
  
  export function validateProductName(name: string): string | null {
    if (!name?.trim()) return 'Product name is required';
    if (name.length < 2) return 'Product name must be at least 2 characters';
    if (name.length > 255) return 'Product name cannot exceed 255 characters';
    return null;
  }
  
  export function validatePrice(price: any): string | null {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'Price must be a valid number';
    if (numPrice < 0) return 'Price cannot be negative';
    return null;
  }
  
  export function validateSKU(sku: string): string | null {
    if (!sku?.trim()) return null; // SKU is optional
    if (sku.length < 2) return 'SKU must be at least 2 characters';
    if (sku.length > 50) return 'SKU cannot exceed 50 characters';
    return null;
  }
  
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
    try {
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
      query = query
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
  
      const { data, error, count } = await query;
  
      if (error) throw error;
  
      return {
        products: data || [],
        total: count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
  
  export async function getProductById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }
  
  export async function updateProductStock(productId: string, quantity: number) {
    try {
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
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }
  
  export async function bulkUpdateProducts(
    updates: Array<{ id: string; [key: string]: any }>
  ) {
    try {
      const { error } = await supabase.from('products').upsert(updates);
      if (error) throw error;
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  }
  
  export async function getProductsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }
  
  export async function searchProducts(searchTerm: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
        )
        .eq('is_active', true)
        .limit(limit);
  
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  
  export async function getProductStats() {
    try {
      const { data, error } = await supabase.from('products').select('*');
  
      if (error) throw error;
  
      const products = data || [];
      const totalProducts = products.length;
      const activeProducts = products.filter((p) => p.is_active).length;
      const outOfStock = products.filter((p) => p.stock === 0).length;
      const totalValue = products.reduce(
        (sum, p) => sum + p.price * p.stock,
        0
      );
      const averagePrice =
        totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
  
      return {
        totalProducts,
        activeProducts,
        outOfStock,
        totalValue,
        averagePrice,
      };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  }