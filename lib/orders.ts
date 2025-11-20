import { supabase } from '@/lib/supabase'

// ✅ Get all orders with user and order items
export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      shipping_cost,
      tax_amount,
      discount_amount,
      tracking_number,
      estimated_delivery_date,
      is_express_shipping,
      created_at,
      shipped_at,
      delivered_at,
      order_items (
        id,
        product_name,
        quantity,
        price_each,
        discount_per_item,
        subtotal,
        is_refunded
      ),
      users (
        full_name,
        email
      )
      `
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get a single order by ID with full details
export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      location_id,
      status,
      payment_status,
      total_amount,
      shipping_cost,
      tax_amount,
      discount_amount,
      notes,
      tracking_number,
      estimated_delivery_date,
      is_express_shipping,
      is_gift,
      gift_message,
      created_at,
      shipped_at,
      delivered_at,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        price_each,
        discount_per_item,
        subtotal,
        is_refunded,
        refund_reason
      ),
      users!inner (
        id,
        full_name,
        email,
        phone
      ),
      locations!inner (
        address_line,
        city,
        county,
        postal_code,
        latitude,
        longitude
      ),
      payments (
        id,
        payment_method,
        amount,
        payment_status,
        transaction_ref,
        receipt_url,
        created_at,
        completed_at
      )
      `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  
  // Transform the data to ensure users and locations are objects, not arrays
  if (data) {
    return {
      ...data,
      users: Array.isArray(data.users) ? data.users[0] : data.users,
      locations: Array.isArray(data.locations) ? data.locations[0] : data.locations,
    }
  }
  
  return data
}

// ✅ Get orders by user ID
export async function getOrdersByUserId(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      shipping_cost,
      tax_amount,
      discount_amount,
      tracking_number,
      estimated_delivery_date,
      is_express_shipping,
      created_at,
      shipped_at,
      delivered_at,
      order_items (
        id,
        product_name,
        quantity,
        price_each,
        discount_per_item,
        subtotal,
        is_refunded
      )
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get orders by status
export async function getOrdersByStatus(status: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      shipping_cost,
      tax_amount,
      discount_amount,
      created_at,
      order_items (
        id,
        product_name,
        quantity,
        price_each,
        subtotal
      ),
      users (
        full_name,
        email
      )
      `
    )
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get orders by payment status
export async function getOrdersByPaymentStatus(paymentStatus: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      created_at,
      users (
        full_name,
        email
      )
      `
    )
    .eq('payment_status', paymentStatus)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Create a new order
export async function createOrder(orderData: {
  order_number: string
  user_id: string
  location_id: string
  status?: string
  payment_status?: string
  shipping_cost?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string
  is_express_shipping?: boolean
  is_gift?: boolean
  gift_message?: string
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Update order status
export async function updateOrderStatus(
  orderId: string,
  status: string,
  additionalData?: { shipped_at?: string; delivered_at?: string }
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      ...additionalData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Update payment status
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: string
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Add tracking information
export async function updateOrderTracking(
  orderId: string,
  trackingNumber: string,
  estimatedDeliveryDate?: string
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      estimated_delivery_date: estimatedDeliveryDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Cancel an order
export async function cancelOrder(orderId: string, reason?: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get order statistics
export async function getOrderStats() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, total_amount')

  if (error) throw new Error(error.message)

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o) => o.status === 'pending').length || 0,
    confirmed: orders?.filter((o) => o.status === 'confirmed').length || 0,
    processing: orders?.filter((o) => o.status === 'processing').length || 0,
    shipped: orders?.filter((o) => o.status === 'shipped').length || 0,
    delivered: orders?.filter((o) => o.status === 'delivered').length || 0,
    cancelled: orders?.filter((o) => o.status === 'cancelled').length || 0,
    refunded: orders?.filter((o) => o.status === 'refunded').length || 0,
    paid: orders?.filter((o) => o.payment_status === 'paid').length || 0,
    unpaid: orders?.filter((o) => o.payment_status === 'unpaid').length || 0,
    totalRevenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
  }

  return stats
}

// ✅ Get recent orders
export async function getRecentOrders(limit: number = 5) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      created_at,
      users (
        full_name,
        email
      )
      `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

// ✅ Search orders
export async function searchOrders(searchTerm: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      created_at,
      users (
        full_name,
        email
      )
      `
    )
    .or(
      `order_number.ilike.%${searchTerm}%,users.full_name.ilike.%${searchTerm}%,users.email.ilike.%${searchTerm}%`
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get orders within date range
export async function getOrdersByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_status,
      total_amount,
      created_at,
      users (
        full_name,
        email
      )
      `
    )
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}