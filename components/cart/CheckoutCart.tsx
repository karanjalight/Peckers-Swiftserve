"use client";

import { useEffect, useState } from "react";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function OrderSummary() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Function to load cart
  const loadCart = () => {
    const storedCart = localStorage.getItem("cart_items");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      setCartItems(parsedCart);

      const totalAmount = parsedCart.reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      );
      setTotal(totalAmount);
    } else {
      setCartItems([]);
      setTotal(0);
    }
  };

  // Load on mount
  useEffect(() => {
    loadCart();

    // Update when cart changes in another tab/component
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cart_items") {
        loadCart();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="lg:col-span-1">
      <div className="bg-white shadow-sm border border-slate-200 sticky top-24 overflow-hidden ">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-50 p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Order Summary</h3>
            <span className="text-xl font-bold text-green-600">
              Ksh {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center">
              Your cart is empty.
            </p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center ">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover "
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-700">
                        {item.quantity}
                      </div>
                      <div className="text-xs text-slate-600">items</div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {item.description || "No description available"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-green-600">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({item.quantity} × Ksh {item.price.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          <hr className="my-4" />

          {/* Total */}
          <div className="flex justify-between">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-green-600">
              Ksh {total.toLocaleString()}
            </span>
          </div>

          {/* Coupon Button */}
          <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-green-600 border border-green-200 hover:bg-green-50 transition ">
            Add coupons
          </button>
        </div>
      </div>
    </div>
  );
}


// ✅ Clear checkout data
// export function clearCheckout() {
//   localStorage.removeItem(CHECKOUT_KEY);
//   localStorage.removeItem(ORDER_ID_KEY);
// }