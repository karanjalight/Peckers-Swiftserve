"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getProducts } from "@/lib/products";
import Link from "next/link";
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

export default function RecommendProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts();
        setProducts(data.slice(0, 3));
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load products";
        setError(errorMsg);
        console.error("Error loading products:", err);
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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        image_url: product.image_url || "/placeholder.webp",
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

  if (loading) {
    return (
      <section className="mt-12">
        <div className="flex justify-center py-8">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-12">
        <div className="flex justify-center py-8">
          <p className="text-red-600">Error loading products: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="mt-12">
        <div className="flex flex-col mb-10">
          <h2 className="text-3xl font-semibold mb-1">Related Products</h2>
          <div className="w-16 h-1 bg-green-600"></div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
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
                      className="flex-1 text-sm bg-[#33B200] hover:bg-green-600 text-white py-2 px-4 transition-colors"
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
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}