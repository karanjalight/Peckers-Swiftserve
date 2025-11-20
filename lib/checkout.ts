import { supabase } from "./supabase";
import { getCart, clearCart } from "./cart";

export interface CheckoutData {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  phone: string;
  county: string;
  other_contact: string;
  note?: string;
  paymentMethod?: string;
}

const CHECKOUT_KEY = "checkout_data";
const ORDER_ID_KEY = "checkout_order_id";

// ✅ Get checkout data from localStorage
export function getCheckout(): CheckoutData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CHECKOUT_KEY);
  return stored ? JSON.parse(stored) : null;
}

// ✅ Save checkout data
export function saveCheckout(data: CheckoutData) {
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
}

// ✅ Update checkout data
export function updateCheckout(data: Partial<CheckoutData>) {
  const existing = getCheckout() || {};
  const updated = { ...existing, ...data };
  saveCheckout(updated as CheckoutData);
  return updated;
}

// ✅ Clear checkout data
export function clearCheckout() {
  localStorage.removeItem(CHECKOUT_KEY);
  localStorage.removeItem(ORDER_ID_KEY);
  clearCart();
}

// ✅ Get stored order ID
export function getStoredOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORDER_ID_KEY);
}

// ✅ Store order ID
function storeOrderId(orderId: string) {
  localStorage.setItem(ORDER_ID_KEY, orderId);
}

// ✅ Full sync (Users + Locations + Orders + OrderItems + Payments)
export async function syncCheckoutToSupabase(checkoutData: CheckoutData) {
  try {
    let orderId = getStoredOrderId();
    let userId: string | null = null;
    let locationId: string | null = null;
    const cartItems = getCart();
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 1️⃣ Check or create user
    const { data: existingUser, error: fetchUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", checkoutData.email)
      .maybeSingle();

    if (fetchUserError) throw fetchUserError;

    if (!existingUser) {
      const fullName = `${checkoutData.firstName} ${checkoutData.lastName}`.trim();
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert([
          {
            full_name: fullName,
            email: checkoutData.email,
            phone: checkoutData.phone,
            password_hash: "-",
            is_active: true,
          },
        ])
        .select("id")
        .single();

      if (userError) throw userError;
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    // 2️⃣ Check or create location
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("user_id", userId)
      .eq("address_line", checkoutData.address)
      .eq("city", checkoutData.city)
      .maybeSingle();

    if (!existingLocation) {
      const { data: newLocation, error: locationError } = await supabase
        .from("locations")
        .insert([
          {
            user_id: userId,
            address_line: checkoutData.address,
            city: checkoutData.city,
            county: checkoutData.county,
            postal_code: checkoutData.zipCode,
            is_default: true,
            label: "Home",
          },
        ])
        .select("id")
        .single();

      if (locationError) throw locationError;
      locationId = newLocation.id;
    } else {
      locationId = existingLocation.id;
    }

    // 3️⃣ Create or update order
    if (!orderId) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: userId,
            location_id: locationId,
            status: "pending",
            payment_status: "unpaid",
            notes: checkoutData.note || null,
            total_amount: totalAmount,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;
      orderId = orderData.id;
      storeOrderId(orderData.id);
    } else {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          user_id: userId,
          location_id: locationId,
          notes: checkoutData.note || null,
          total_amount: totalAmount,
        })
        .eq("id", orderId);
      if (updateError) throw updateError;
    }

    // 4️⃣ Insert cart items into order_items
    if (cartItems.length > 0) {
      // Delete previous items for this order (in case user is updating)
      await supabase.from("order_items").delete().eq("order_id", orderId);

      const orderItems = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_each: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    // 5️⃣ Create or update payment record
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!existingPayment) {
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          order_id: orderId,
          user_id: userId,
          payment_method: checkoutData.paymentMethod || "pending",
          amount: totalAmount,
          payment_status: "pending",
        },
      ]);
      if (paymentError) throw paymentError;
    } else {
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({
          amount: totalAmount,
          payment_method: checkoutData.paymentMethod || "pending",
        })
        .eq("order_id", orderId);
      if (paymentUpdateError) throw paymentUpdateError;
    }

    console.log("✅ Synced checkout with Supabase");

    // Optionally clear cart after successful sync
    // clearCart();

    return { success: true, orderId, userId, locationId, totalAmount };
  } catch (error) {
    console.error("❌ Error syncing checkout:", error);
    return { success: false, error };
  }
}



/**
 * Updates the payment status and method for a checkout record
 */
export async function updatePaymentStatus(
  checkoutId: string,
  paymentStatus: "Pending" | "Paid" | "Failed",
  paymentMethod: string
) {
  const { data, error } = await supabase
    .from("checkout")
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .select();

  if (error) throw error;
  return data;
}
