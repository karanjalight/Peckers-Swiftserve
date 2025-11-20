"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ProductHero from "@/components/hero/ProductsHero";

interface Order {
  locations: any;
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  created_at: string;
  is_express_shipping: boolean;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_each: number;
  subtotal: number;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            `
            id, order_number, status, payment_status, total_amount,
            shipping_cost, tax_amount, discount_amount,
            created_at, is_express_shipping,
            locations (address_line, city, county, postal_code)
          `
          )
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, price_each, subtotal")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (err) {
        console.error("❌ Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <Loader2 className="animate-spin w-10 h-10 mb-4" />
        <p>Loading your order details...</p>
      </div>
    );

  if (!order)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
        <p>Order not found. Please check your email for confirmation details.</p>
      </div>
    );

  const grandTotal =
    Number(order.total_amount || 0) +
    Number(order.shipping_cost || 0) +
    Number(order.tax_amount || 0) -
    Number(order.discount_amount || 0);

  return (
    <section>
      <Navbar />
      <ProductHero
        title="Order"
        highlight="Successful"
        breadcrumbs={[
          { label: "Cytek", href: "/" },
          { label: "Checkout", href: "/checkout" },
          { label: "Order Success", href: "/order-confirmation" },
        ]}
      />
      <div className="min-h-screen bg-purple-50 py-10 lg:py-12 px-4 flex justify-center">
        <div className="bg-white p-8 max-w-3xl w-full">
          <div className="text-center mb-8">
            <CheckCircle2 className="text-green-600 w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 mt-2">
              Thank you for your purchase. Your payment was successful and your
              order is being processed.
            </p>
          </div>

          {/* Order details */}
          <div className="border p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Order Details
            </h2>
            <div className="grid grid-cols-2 text-sm text-gray-600 gap-y-2">
              <p>
                <strong>Order Amount:</strong> {order.total_amount}
              </p>
              <p>
                <strong>Payment:</strong> {order.payment_status}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Shipping:</strong>{" "}
                {order.is_express_shipping ? "Express" : "Standard"}
              </p>
              {order.locations && (
                <p className="col-span-2 mt-3">
                  <strong>Delivery Address:</strong>
                  <br />
                  {order.locations.address_line}, {order.locations.city},{" "}
                  {order.locations.county} - {order.locations.postal_code}
                </p>
              )}
            </div>
          </div>

          {/* Items ordered */}
          <div className="border p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Items Ordered
            </h2>
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × KES {item.price_each.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-700">
                    KES {item.subtotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="border p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Payment Summary
            </h2>
            <div className="flex justify-between text-gray-600 text-sm mb-1">
              <p>Subtotal:</p>
              <p>KES {order.total_amount.toFixed(2)}</p>
            </div>
            {order.shipping_cost > 0 && (
              <div className="flex justify-between text-gray-600 text-sm mb-1">
                <p>Shipping:</p>
                <p>KES {order.shipping_cost.toFixed(2)}</p>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm mb-1">
                <p>Tax:</p>
                <p>KES {order.tax_amount.toFixed(2)}</p>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm mb-1">
                <p>Discount:</p>
                <p>- KES {order.discount_amount.toFixed(2)}</p>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-gray-800 font-semibold text-base">
              <p>Total:</p>
              <p>KES {grandTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => (window.location.href = "/")}
              className="mt-4 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
          <Loader2 className="animate-spin w-10 h-10 mb-4" />
          <p>Loading your order confirmation...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
