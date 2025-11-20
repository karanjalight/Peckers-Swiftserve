"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import {
  addToCart,
  updateCartQuantity,
  getCart,
  removeFromCart,
} from "@/lib/cart";

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

type SortOption =
  | "menu_order"
  | "popularity"
  | "rating"
  | "date"
  | "price"
  | "price-desc";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("menu_order");
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<{
    [key: string]: number;
  }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    })();
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

  const sortOptions = [
    { value: "menu_order" as SortOption, label: "Default sorting" },
    { value: "popularity" as SortOption, label: "Sort by popularity" },
    { value: "rating" as SortOption, label: "Sort by average rating" },
    { value: "date" as SortOption, label: "Sort by latest" },
    { value: "price" as SortOption, label: "Sort by price: low to high" },
    { value: "price-desc" as SortOption, label: "Sort by price: high to low" },
  ];

  const getSortedProducts = (): Product[] => {
    const sorted = [...products];

    switch (sortBy) {
      case "rating":
        return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "date":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at ?? "").getTime() -
            new Date(a.created_at ?? "").getTime()
        );
      case "price":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  };

  const handleSelectOption = (value: SortOption) => {
    setSortBy(value);
    setIsOpen(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayedProducts = getSortedProducts();
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Default sorting";

  return (
    <div className="lg:py-10 lg:mt-5 lg:mb-40">
      <div className="w-full px-4 lg:px-20">
        {/* Header Section */}
        <div className="flex bg-purple-50 flex-col p-5 lg:flex-row justify-between items-center text-center lg:text-left gap-4">
          <div>
            <h1 className="text-xl md:text-xl text-purple-600">
              Showing all {products.length} results
            </h1>
          </div>

          {/* Dropdown Sorting */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex justify-between items-center text-sm w-60 text-gray-600 px-4 py-2 bg-white border border-gray-300 ProductList shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            >
              <span>{currentSortLabel}</span>
              <svg
                className={`w-4 h-4 ml-2 text-gray-600 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <ul
              className={`absolute right-0 z-10 mt-2 text-sm w-60 text-gray-600 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 ProductList shadow-lg transition-all duration-150 ease-out ${
                isOpen
                  ? "opacity-100 scale-100 visible"
                  : "opacity-0 scale-95 invisible"
              }`}
            >
              {sortOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                    sortBy === option.value
                      ? "text-purple-600 font-semibold bg-purple-50"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex items-center lg:px-20 justify-center">
        <div className="w-full lg:px-0 px-4">
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">
              Loading products...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {displayedProducts.map((product) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white border border-gray-200 p-2 ProductList overflow-hidden flex flex-col justify-between hover:border-gray-500 transition-all"
                >
                  <div className="relative w-full h-64 border overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={product.image_url || "/placeholder.webp"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.is_on_sale && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 font-semibold text-xs">
                        Sale!
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      {product.sale_price ? (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            Ksh {product.price.toFixed(2)}
                          </span>
                          <span className="text-lg text-gray-900">
                            Ksh {product.sale_price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg text-gray-900">
                          Ksh {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center lg:w-60 gap-3 mt-auto ">
                      {cartQuantities[product.id] ? (
                        <div className="flex-1 flex items-center border border-gray-300">
                          <button
                            onClick={(e) =>
                              handleDecreaseQuantity(e, product.id)
                            }
                            className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 transition-colors"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center text-sm font-semibold text-gray-700">
                            {cartQuantities[product.id]}
                          </span>
                          <button
                            onClick={(e) =>
                              handleIncreaseQuantity(e, product.id)
                            }
                            className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="flex-1 text-sm bg-purple-600 hover:bg-purple-600 text-white py-2 px-4 transition-colors"
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
                      
                      {cartQuantities[product.id] && (
                        <button
                          onClick={(e) => handleRemoveFromCart(e, product)}
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
          )}
        </div>
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
