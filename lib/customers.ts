import { supabase } from '@/lib/supabase'

// ✅ Get all customers
export async function getCustomers() {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      is_active,
      is_email_verified,
      is_phone_verified,
      role,
      last_login_at,
      created_at,
      locations (
        address_line,
        city,
        county,
        postal_code,
        is_default
      )
      `
    )
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get a single customer by ID with full details
export async function getCustomerById(id: string) {
  const { data: customer, error: customerError } = await supabase
    .from('users')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      is_active,
      is_email_verified,
      is_phone_verified,
      role,
      preferences,
      last_login_at,
      created_at,
      locations (
        id,
        address_line,
        city,
        county,
        postal_code,
        label,
        is_default,
        is_billing,
        is_shipping,
        latitude,
        longitude,
        created_at
      )
      `
    )
    .eq('id', id)
    .single()

  if (customerError) throw new Error(customerError.message)

  // Get customer's orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  if (ordersError) throw new Error(ordersError.message)

  // Calculate stats
  const totalOrders = orders?.length || 0
  const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const lastOrderDate = orders?.[0]?.created_at || null

  return {
    ...customer,
    total_orders: totalOrders,
    total_spent: totalSpent,
    last_order_date: lastOrderDate,
    orders: orders || [],
  }
}

// ✅ Create a new customer
export async function createCustomer(customerData: {
  full_name: string
  email: string
  phone?: string
  password_hash: string
  role?: string
  is_email_verified?: boolean
  is_phone_verified?: boolean
  preferences?: Record<string, any>
}) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        ...customerData,
        role: customerData.role || 'customer',
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Update customer information
export async function updateCustomer(
  customerId: string,
  customerData: {
    full_name?: string
    email?: string
    phone?: string
    is_active?: boolean
    preferences?: Record<string, any>
  }
) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...customerData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Delete a customer
export async function deleteCustomer(customerId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', customerId)

  if (error) throw new Error(error.message)
  return { success: true }
}

// ✅ Get customer orders
export async function getCustomerOrders(customerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      total_amount,
      shipping_cost,
      tax_amount,
      discount_amount,
      created_at,
      shipped_at,
      delivered_at,
      order_items (
        id,
        product_name,
        quantity,
        price_each,
        subtotal
      )
      `
    )
    .eq('user_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get customer locations
export async function getCustomerLocations(customerId: string) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', customerId)
    .order('is_default', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Add customer location
export async function addCustomerLocation(
  customerId: string,
  locationData: {
    address_line: string
    city: string
    county?: string
    postal_code?: string
    label?: string
    is_default?: boolean
    is_billing?: boolean
    is_shipping?: boolean
    latitude?: number
    longitude?: number
  }
) {
  const { data, error } = await supabase
    .from('locations')
    .insert([
      {
        user_id: customerId,
        ...locationData,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Update customer location
export async function updateCustomerLocation(
  locationId: string,
  locationData: Partial<{
    address_line: string
    city: string
    county: string
    postal_code: string
    label: string
    is_default: boolean
    is_billing: boolean
    is_shipping: boolean
    latitude: number
    longitude: number
  }>
) {
  const { data, error } = await supabase
    .from('locations')
    .update({
      ...locationData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Delete customer location
export async function deleteCustomerLocation(locationId: string) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)

  if (error) throw new Error(error.message)
  return { success: true }
}

// ✅ Verify customer email
export async function verifyCustomerEmail(customerId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_email_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Verify customer phone
export async function verifyCustomerPhone(customerId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_phone_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Deactivate customer
export async function deactivateCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Activate customer
export async function activateCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get customer statistics
export async function getCustomerStats() {
  const { data: customers, error } = await supabase
    .from('users')
    .select('id, is_active, is_email_verified, is_phone_verified, role')
    .eq('role', 'customer')

  if (error) throw new Error(error.message)

  const stats = {
    total: customers?.length || 0,
    active: customers?.filter((c) => c.is_active).length || 0,
    inactive: customers?.filter((c) => !c.is_active).length || 0,
    fullyVerified:
      customers?.filter((c) => c.is_email_verified && c.is_phone_verified)
        .length || 0,
    partiallyVerified:
      customers?.filter(
        (c) =>
          (c.is_email_verified || c.is_phone_verified) &&
          !(c.is_email_verified && c.is_phone_verified)
      ).length || 0,
    unverified:
      customers?.filter((c) => !c.is_email_verified && !c.is_phone_verified)
        .length || 0,
  }

  return stats
}

// ✅ Search customers
export async function searchCustomers(searchTerm: string) {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      is_active,
      is_email_verified,
      is_phone_verified,
      created_at
      `
    )
    .eq('role', 'customer')
    .or(
      `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get customers by status
export async function getCustomersByStatus(isActive: boolean) {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      is_active,
      is_email_verified,
      is_phone_verified,
      created_at
      `
    )
    .eq('role', 'customer')
    .eq('is_active', isActive)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ✅ Get top customers by spending
export async function getTopCustomers(limit: number = 10) {
  const { data: customers, error: customersError } = await supabase
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('role', 'customer')

  if (customersError) throw new Error(customersError.message)

  // Get orders for each customer
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('user_id, total_amount')

  if (ordersError) throw new Error(ordersError.message)

  // Calculate totals per customer
  const customerTotals = (orders || []).reduce(
    (acc, order) => {
      acc[order.user_id] = (acc[order.user_id] || 0) + (order.total_amount || 0)
      return acc
    },
    {} as Record<string, number>
  )

  // Sort and limit
  return (customers || [])
    .map((c) => ({
      ...c,
      total_spent: customerTotals[c.id] || 0,
    }))
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, limit)
}



// ✅ Get all customers with order statistics
export async function getAllCustomersWithStats() {
    const { data: customers, error: customersError } = await supabase
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        phone,
        is_active,
        is_email_verified,
        is_phone_verified,
        role,
        last_login_at,
        created_at,
        locations (
          address_line,
          city,
          county,
          postal_code,
          is_default
        )
        `
      )
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
  
    if (customersError) throw new Error(customersError.message)
  
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, created_at')
  
    if (ordersError) throw new Error(ordersError.message)
  
    // Calculate stats for each customer
    const customersWithStats = (customers || []).map((customer) => {
      const customerOrders = (orders || []).filter((o) => o.user_id === customer.id)
      const totalOrders = customerOrders.length
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const lastOrderDate = customerOrders.length > 0 
        ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null
  
      return {
        ...customer,
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_order_date: lastOrderDate,
      }
    })
  
    return customersWithStats
  }