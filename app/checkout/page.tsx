"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductHero from "@/components/hero/ProductsHero";
import Footer from "@/components/landing/Footer";
import OrderSummary from "@/components/cart/CheckoutCart";
import {
  getCheckout,
  updateCheckout,
  clearCheckout,
  syncCheckoutToSupabase,
  CheckoutData,
} from "@/lib/checkout";
import { supabase } from "@/lib/supabase";
import usePaystack from "@/app/hooks/usePaystack";
import { getCart } from "@/lib/cart"; // adjust path as needed

export default function Checkout() {
  const [formData, setFormData] = useState<CheckoutData>({
    email: "",
    firstName: "",
    lastName: "",
    country: "US",
    state: "CA",
    city: "",
    address: "",
    zipCode: "",
    phone: "",
    county: "",
    other_contact: "",
    note: "",
    paymentMethod: "",
  });

  const [isPlacing, setIsPlacing] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  // ✅ Load checkout data from localStorage
  useEffect(() => {
    const saved = getCheckout();
    if (saved) {
      setFormData(saved);
      console.log("Loaded checkout data from localStorage");
    }
  }, []);

  // ✅ Save to localStorage immediately on input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    updateCheckout(updated); // Save to localStorage immediately
  };

  // ✅ Handle Place Order - sync to Supabase, then prompt Paystack
  const handlePlaceOrder = async () => {
    setIsPlacing(true);

    try {
      console.log("Syncing checkout data to Supabase...", formData);

      // Sync all checkout data to Supabase (no user auth required)
      const result = await syncCheckoutToSupabase(formData);

      if (result.success && result.orderId) {
        console.log("✅ Order created successfully:", result.orderId);

        // Mark order as pending payment
        await supabase
          .from("orders")
          .update({ status: "pending" })
          .eq("id", result.orderId);

        // Get the order total (you may need to adjust based on your cart structure)
        const cartTotal = await getCartTotal(); // You'll need to implement this

        // Initialize Paystack payment
        const onSuccess = async (response: { reference: string }) => {
          console.log("✅ Payment successful:", response.reference);

          try {
            // Verify payment with backend
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: response.reference,
                orderId: result.orderId,
              }),
            });

            const verifyData = await verifyRes.json();
            console.log(verifyData);

            if (verifyData.success) {
              // Update order status to confirmed
              await supabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  status: "confirmed",
                })
                .eq("id", result.orderId);

              await supabase
                .from("payments")
                .update({
                  payment_method: "Paystack",
                  payment_status: "Paid",
                  transaction_ref: response.reference,
                })
                .eq("order_id", result.orderId);

              console.log("✅ Payment verified and order confirmed");
              clearCheckout();
              window.location.href = `/order-confirmation?orderId=${result.orderId}`;
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        };

        const onClose = () => {
          console.log("❌ Payment popup closed");
          // Update order status back to pending if payment was cancelled
          supabase
            .from("orders")
            .update({ status: "pending" })
            .eq("id", result.orderId)
            .match((err: any) =>
              console.error("Error updating order status:", err)
            );
          setIsPlacing(false);
        };

        // Trigger Paystack payment
        initializePayment(
          {
            email: formData.email,
            amount: cartTotal * 100, // Convert to kobo (smallest currency unit)
            currency: "KES",
            reference: result.orderId, // Use order ID as reference
          },
          onSuccess,
          onClose
        );
      } else {
        alert("Failed to save order. Please try again.");
        console.error("Sync failed:", result.error);
        setIsPlacing(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred while placing your order.");
      setIsPlacing(false);
    }
  };
  // ✅ Helper function to get cart total
  const getCartTotal = async (): Promise<number> => {
    const cart = getCart();

    // Handle empty cart gracefully
    if (!cart || cart.length === 0) return 0;

    // Calculate total = Σ (price × quantity)
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return total;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <ProductHero
        title="Checkout"
        highlight=""
        breadcrumbs={[
          { label: "Cytek", href: "/" },
          { label: "Checkout", href: "/checkout" },
        ]}
      />

      {/* Body */}
      <div className="lg:m-20 lg:my-10 my-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Step */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Contact information</h2>

                <p className="text-sm text-slate-600">
                  We'll use this email to send you details and updates about
                  your order.
                </p>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0712 *** ***"
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Billing Address */}
                <h2 className="text-lg mt-10 font-semibold">Billing address</h2>
                <p className="text-sm text-slate-600">
                  Enter the billing address that matches your location and
                  payment method.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* County / City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      name="county"
                      value={formData.county}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Other Contact */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Other Contact
                  </label>
                  <input
                    type="text"
                    name="other_contact"
                    value={formData.other_contact}
                    onChange={handleInputChange}
                    placeholder="0712 *** ***"
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Payment Option */}
                <h2 className="text-lg mt-10 font-semibold">Payment Options</h2>
                <div className="py-3">
                  <div className="bg-green-50 border border-green-200 p-4 rounded flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      Payments will be processed via Paystack securely.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="note"
                  checked={!!formData.note}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      handleInputChange({
                        target: { name: "note", value: "" },
                      } as any);
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Add a note to your order
                </span>
              </label>
              {formData.note !== "" && (
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Special instructions..."
                  rows={3}
                  className="w-full mt-4 px-4 py-3 border border-slate-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="flex items-center gap-2 px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition font-medium"
                onClick={() => (window.location.href = "/cart")}
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Cart
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-600 text-white rounded hover:from-green-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isPlacing ? "Processing..." : "Place Order & Pay"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <OrderSummary />
        </div>
      </div>

      <Footer />
    </div>
  );
}
