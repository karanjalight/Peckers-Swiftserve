"use client";

import { useEffect, useState } from "react";
import { getCart, removeFromCart, clearCart, CartItem, updateCartQuantity } from "@/lib/cart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import ProductHero from "@/components/hero/ProductsHero";
import Link from "next/link";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const handleRemove = (id: string | number) => {
    const updated = removeFromCart(id);
    setCart(updated);
  };

  const handleQuantityChange = (id: string | number, delta: number) => {
    const item = cart.find((p) => p.id === id);
    if (!item) return;
  
    const newQty = Math.max(1, item.quantity + delta);
    updateCartQuantity(id, newQty); // ✅ triggers cartUpdated event automatically
  
    // Refresh local state so UI updates immediately
    setCart(getCart());
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = subtotal - discount;

  return (
    <section className="bg-green-50 min-h-screen">
      <Navbar />
      <ProductHero
        title="Cart"
        highlight=""
        breadcrumbs={[
          { label: "Home", href: "/" },
          {
            label: "Cart",
            href: "/#",
          },
        ]}
      />
      <div className="lg:mx-20 mx-4 lg:py-20 py-10">
        <h1 className="text-4xl md:text-5xl font-bold text-[#244672] mb-10">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white shadow ">
            <p className="text-gray-600 text-lg">Your cart is empty 🛒</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT — Product List */}
            <div className="lg:col-span-2 bg-white  shadow p-6">
              <h2 className="text-xl font-semibold border-b pb-3 mb-6">
                PRODUCT
              </h2>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-6"
                >
                  <div className="flex items-start md:items-center gap-5">
                    {/* <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 object-cover  border"
                    /> */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 max-w-md">
                        {item.name}
                      </p>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-500 text-sm mt-2 hover:underline"
                      >
                        Remove item
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end mt-3 md:mt-0">
                    {/* Quantity Controls */}
                    <div className="flex items-center border  overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="px-3 py-1 text-lg bg-green-100 hover:bg-green-200"
                      >
                        −
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="px-3 py-1 text-lg bg-green-100 hover:bg-green-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <p className="text-gray-800 font-semibold mt-2">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT — Cart Totals */}
            <div className="bg-white  shadow p-6 h-fit">
              <h2 className="text-xl font-semibold border-b pb-3 mb-6">
                CART TOTALS
              </h2>

              <div className="mb-6">
                <label className="block text-gray-600 mb-2">Add coupons</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter coupon"
                    className="border  w-full p-2 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (coupon.toLowerCase() === "green10") {
                        setDiscount(subtotal * 0.1);
                      } else {
                        setDiscount(0);
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2  hover:bg-green-700"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 text-lg flex justify-between font-semibold text-gray-900">
                <span>Estimated total</span>
                <span>Ksh {total.toLocaleString()}</span>
              </div>

              <div className="w-full mt-4">
                <Link
                  href="/checkout"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white text-center font-medium py-3 transition"
                >
                  Proceed To Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </section>
  );
}
