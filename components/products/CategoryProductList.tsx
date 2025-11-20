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
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";

interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  sale_price?: number;
  is_on_sale?: boolean;
  category?: string;
  subcategory?: string;
  rating?: number;
  review_count?: number;
  created_at?: string;
  stock?: number;
}

type SortOption =
  | "menu_order"
  | "popularity"
  | "rating"
  | "date"
  | "price"
  | "price-desc";

interface CategoryProductListProps {
  category?: string;
  subcategory?: string;
  title?: string;
}

export default function CategoryProductList({
  category,
  subcategory,
  title,
}: CategoryProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("menu_order");
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<{
    [key: string]: number;
  }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [onSale, setOnSale] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    categories: true,
    price: true,
    modelNumber: false,
    condition: false,
    warranty: false,
    subAccessories: false,
    additionalFeatures: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        let filtered = data || [];

        // Filter by category
        if (category) {
          filtered = filtered.filter((p: Product) => {
            const productCategory = p.category?.toLowerCase().trim() || "";
            const filterCategory = category.toLowerCase().trim();
            
            // Handle category matching (case-insensitive, flexible)
            const categoryMatch = productCategory === filterCategory || 
                                 productCategory.includes(filterCategory) ||
                                 filterCategory.includes(productCategory);
            
            if (subcategory) {
              const productSubcategory = p.subcategory?.toLowerCase().trim() || "";
              const filterSubcategory = subcategory.toLowerCase().trim();
              const subcategoryMatch = productSubcategory === filterSubcategory ||
                                      productSubcategory.includes(filterSubcategory) ||
                                      filterSubcategory.includes(productSubcategory);
              
              return categoryMatch && subcategoryMatch;
            }
            return categoryMatch;
          });
        }

        setProducts(filtered);
        setFilteredProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    })();
  }, [category, subcategory]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // On sale filter
    if (onSale) {
      filtered = filtered.filter((p) => p.is_on_sale);
    }

    // Price range filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => {
          const price = p.sale_price || p.price;
          return price >= min;
        });
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => {
          const price = p.sale_price || p.price;
          return price <= max;
        });
      }
    }

    setFilteredProducts(filtered);
  }, [products, onSale, minPrice, maxPrice]);

  // Sync cart quantities from localStorage
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
    window.addEventListener("cartUpdated", syncCartQuantities);
    return () => window.removeEventListener("cartUpdated", syncCartQuantities);
  }, []);

  const sortOptions = [
    { value: "menu_order" as SortOption, label: "Best Match" },
    { value: "popularity" as SortOption, label: "Sort by popularity" },
    { value: "rating" as SortOption, label: "Sort by average rating" },
    { value: "date" as SortOption, label: "Sort by latest" },
    { value: "price" as SortOption, label: "Sort by price: low to high" },
    { value: "price-desc" as SortOption, label: "Sort by price: high to low" },
  ];

  const getSortedProducts = (): Product[] => {
    const sorted = [...filteredProducts];

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
        return sorted.sort((a, b) => {
          const priceA = a.sale_price || a.price;
          const priceB = b.sale_price || b.price;
          return priceA - priceB;
        });
      case "price-desc":
        return sorted.sort((a, b) => {
          const priceA = a.sale_price || a.price;
          const priceB = b.sale_price || b.price;
          return priceB - priceA;
        });
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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  // Calculate price range
  const prices = products.map((p) => p.sale_price || p.price);
  const minProductPrice = Math.min(...prices, 0);
  const maxProductPrice = Math.max(...prices, 0);

  const displayedProducts = getSortedProducts();
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Best Match";

  return (
    <div className="lg:py-10 lg:mt-5 lg:mb-40">
      <div className="w-full px-4 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 p-5 space-y-6">
              {/* Categories */}
              <div>
                <button
                  onClick={() => toggleSection("categories")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>CATEGORIES</span>
                  {expandedSections.categories ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.categories && (
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const count = products.filter(
                        (p) => p.category === cat
                      ).length;
                      return (
                        <label
                          key={cat}
                          className="flex items-center justify-between cursor-pointer hover:text-purple-600"
                        >
                          <span className="text-sm text-gray-700">{cat}</span>
                          <span className="text-sm text-gray-500">({count})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* On Sale Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">ON SALE</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onSale}
                      onChange={(e) => setOnSale(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <button
                  onClick={() => toggleSection("price")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>PRICE</span>
                  {expandedSections.price ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.price && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: KSH {minProductPrice.toLocaleString()} - KSH{" "}
                      {maxProductPrice.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Model Number */}
              <div>
                <button
                  onClick={() => toggleSection("modelNumber")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>MODEL NUMBER</span>
                  {expandedSections.modelNumber ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.modelNumber && (
                  <div className="text-sm text-gray-500">
                    Filter by model number
                  </div>
                )}
              </div>

              {/* Condition */}
              <div>
                <button
                  onClick={() => toggleSection("condition")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>CONDITION</span>
                  {expandedSections.condition ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.condition && (
                  <div className="text-sm text-gray-500">Filter by condition</div>
                )}
              </div>

              {/* Warranty */}
              <div>
                <button
                  onClick={() => toggleSection("warranty")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>WARRANTY</span>
                  {expandedSections.warranty ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.warranty && (
                  <div className="text-sm text-gray-500">Filter by warranty</div>
                )}
              </div>

              {/* Sub Accessories */}
              <div>
                <button
                  onClick={() => toggleSection("subAccessories")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>SUB ACCESSORIES</span>
                  {expandedSections.subAccessories ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.subAccessories && (
                  <div className="text-sm text-gray-500">
                    Filter by sub accessories
                  </div>
                )}
              </div>

              {/* Additional Features */}
              <div>
                <button
                  onClick={() => toggleSection("additionalFeatures")}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-3"
                >
                  <span>ADDITIONAL FEATURES</span>
                  {expandedSections.additionalFeatures ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.additionalFeatures && (
                  <div className="text-sm text-gray-500">
                    Filter by additional features
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl text-gray-800">
                  {displayedProducts.length} results
                </h1>
              </div>

              {/* Dropdown Sorting */}
              <div className="relative inline-block text-left" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex justify-between items-center text-sm w-60 text-gray-600 px-4 py-2 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
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
                  className={`absolute right-0 z-10 mt-2 text-sm w-60 text-gray-600 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 shadow-lg transition-all duration-150 ease-out ${
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

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No products found. Try adjusting your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 p-2 overflow-hidden flex flex-col justify-between hover:border-purple-500 transition-all"
                  >
                    <Link href={`/products/${product.id}`} className="block">
                      <div className="relative w-full h-64 border overflow-hidden flex items-center justify-center bg-gray-50">
                        <img
                          src={product.image_url || "/placeholder.webp"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.is_on_sale && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 font-semibold text-xs">
                            SALE
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-purple-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      {product.category && (
                        <span className="text-xs text-gray-500 mb-2">
                          {product.category}
                        </span>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        {product.sale_price ? (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              KSH {product.price.toLocaleString()}
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              KSH {product.sale_price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            KSH {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-auto">
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
                            className="flex-1 text-sm bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 transition-colors"
                          >
                            Add To Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-pulse z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

