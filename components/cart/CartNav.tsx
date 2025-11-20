"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart"; // Import the cart function

export default function Cart() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCart = () => {
      try {
        // Use the getCart function from cart.ts
        const items = getCart();
        const total = items.reduce((sum, item) => sum + item.quantity, 0);
        console.log("Cart loaded:", items.length, "items, total quantity:", total); // Debug
        setCartCount(total);
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartCount(0);
      }
    };

    // Initial load
    console.log("Cart component mounted, loading cart..."); // Debug
    loadCart();

    // Listen for cart updates (dispatched by cart.ts)
    const handleCartUpdate = () => {
      console.log("cartUpdated event received"); // Debug
      loadCart();
    };
    
    window.addEventListener("cartUpdated", handleCartUpdate);

    // Listen for storage changes from other tabs (sessionStorage changes aren't captured by storage event)
    // But we keep this for backwards compatibility if any code still uses localStorage
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  return (
    <div className="relative">
      <Link
        href="/cart"
        className="border border-purple-600 rounded-full h-10 w-10 flex items-center justify-center bg-transparent text-purple-600 relative hover:bg-purple-50 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 16 16"
        >
          <path
            fill="currentColor"
            d="M2.5 2a.5.5 0 0 0 0 1h.246a.5.5 0 0 1 .48.363l1.586 5.55A1.5 1.5 0 0 0 6.254 10h4.569a1.5 1.5 0 0 0 1.393-.943l1.474-3.686A1 1 0 0 0 12.762 4H4.448l-.261-.912A1.5 1.5 0 0 0 2.746 2zm3.274 6.637L4.734 5h8.028l-1.475 3.686a.5.5 0 0 1-.464.314H6.254a.5.5 0 0 1-.48-.363M6.5 14a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m0-1a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1m4 1a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m0-1a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1"
          />
        </svg>

        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-purple-400 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}