// lib/products.ts
import { supabase } from '@/lib/supabase'

// ✅ Get all active products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get a single product by ID
export async function getProductById(id: string | number) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
  
    if (error) throw new Error(error.message)
    return data
  }
