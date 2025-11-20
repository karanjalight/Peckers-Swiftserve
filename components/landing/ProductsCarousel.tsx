"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { addToCart, updateCartQuantity, getCart, removeFromCart } from "@/lib/cart";

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  sale_price?: number;
  is_on_sale?: boolean;
  category?: string;
  rating?: number;
  review_count?: number;
  created_at?: string;
}

export default function TopProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Sync cart quantities from localStorage on mount and when cart updates
  useEffect(() => {
    const syncCartQuantities = () => {
      const cart = getCart();
      const quantities: { [key: string]: number } = {};
      cart.forEach((item) => {
        quantities[item.id] = item.quantity;
      });
      setCartQuantities(quantities);
    };

    syncCartQuantities();

    // Listen for cart updates from other tabs/windows
    window.addEventListener("cartUpdated", syncCartQuantities);
    return () => window.removeEventListener("cartUpdated", syncCartQuantities);
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 3));
      setIsAnimating(false);
    }, 400);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? Math.ceil(products.length / 3) - 1 : prev - 1
      );
      setIsAnimating(false);
    }, 400);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        image_url: product.image_url || "link",
        quantity: 1,
      };

      addToCart(cartItem);
      setToast(`${product.name} added to cart!`);
      setCartQuantities((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1,
      }));
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setToast("Failed to add item to cart");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleIncreaseQuantity = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = (cartQuantities[productId] || 1) + 1;
    setCartQuantities((prev) => ({ ...prev, [productId]: newQty }));
    updateCartQuantity(productId, newQty);
  };

  const handleDecreaseQuantity = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQty = cartQuantities[productId] || 1;
    if (currentQty > 1) {
      const newQty = currentQty - 1;
      setCartQuantities((prev) => ({ ...prev, [productId]: newQty }));
      updateCartQuantity(productId, newQty);
    }
  };

  const handleRemoveFromCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromCart(product.id);
    setCartQuantities((prev) => {
      const updated = { ...prev };
      delete updated[product.id];
      return updated;
    });
    setToast(`${product.name} removed from cart`);
    setTimeout(() => setToast(null), 2000);
  };

  const visibleCards = products.slice(currentIndex * 3, currentIndex * 3 + 3);

  if (loading) {
    return (
      <div className="bg-purple-100 my-10 lg:py-20 lg:mt-20 mb-10 lg:mb-0">
        <div className="flex justify-center py-8">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 my-10 lg:py-20 lg:mt-20 mb-10 lg:mb-0">
      <div className="w-full px-4 lg:px-20">
        {/* Header Section */}
        <div className="flex flex-col py-10 lg:flex-row justify-between items-center text-center lg:text-left">
          <div className="">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-3">
              Featured Books & Stationery
            </h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base max-w-md mx-auto lg:mx-0">
              Browse our most popular books and stationery items
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={handlePrev}
              className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:
              
              transition"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-purple-600 transition"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex items-center lg:px-20 justify-center">
        <div className="w-full lg:px-0 px-4">
          <div className="overflow-hidden">
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-transform duration-500 ease-in-out ${
                isAnimating
                  ? direction === "next"
                    ? "-translate-x-4 opacity-90"
                    : "translate-x-4 opacity-90"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {visibleCards.map((p) => (
                <Link
                href={`/products/${p.id}`}
                key={p.id}
                className="border overflow-hidden hover:shadow-lg transition bg-white"
              >
                <div className="relative">
                  {p.is_on_sale && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Sale!
                    </span>
                  )}
                  <img
                    src={p.image_url}
                    alt={p.name}
                    width={300}
                    height={200}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    {p.sale_price ? (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          Ksh {p.price.toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-900">
                          Ksh {p.sale_price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg text-gray-900">
                        Ksh {p.price.toFixed(2)}
                      </span>
                    )}
                  </div>
  
                  <div className="flex items-center lg:w-60 gap-3 mt-auto">
                    {cartQuantities[p.id] ? (
                      <div className="flex-1 flex items-center border border-gray-300">
                        <button
                          onClick={(e) => handleDecreaseQuantity(e, p.id)}
                          className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 transition-colors"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold text-gray-700">
                          {cartQuantities[p.id]}
                        </span>
                        <button
                          onClick={(e) => handleIncreaseQuantity(e, p.id)}
                          className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, p)}
                        className="flex-1 text-sm bg-purple-600 hover:bg-sky-600 text-white py-2 px-4 transition-colors"
                      >
                        Add to Cart
                      </button>
                    )}
                    <button className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors">
                      <svg
                        className="w-4 h-4 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors">
                      <svg
                        className="w-4 h-4 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                    {cartQuantities[p.id] && (
                      <button
                        onClick={(e) => handleRemoveFromCart(e, p)}
                        className="p-2 border border-red-300 hover:bg-red-50 transition-colors"
                        title="Remove from cart"
                      >
                        <svg
                          className="w-4 h-4 text-red-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </Link>
              ))}
            </div>
          </div>

          {/* Dots */}
          {products.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.ceil(products.length / 3) }).map(
                (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === currentIndex
                        ? "bg-purple-600 w-8"
                        : "bg-gray-300 hover:bg-gray-500"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* View All Button */}
      <div className="flex items-center justify-center mt-10 pb-20">
        <Link href="/products">
          <button className="capitalize px-6 md:px-8 py-3 border text-blue-950 border-purple-800 hover:bg-purple-800 hover:text-white transition">
            View all products →
          </button>
        </Link>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-3 rounded shadow-lg animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}