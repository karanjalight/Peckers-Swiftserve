"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { createClient } from "@supabase/supabase-js";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = products.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        filterCategory === "All" || product.category === filterCategory;
      const matchStatus =
        filterStatus === "All" ||
        (filterStatus === "Active" ? product.is_active : !product.is_active);
      return matchSearch && matchCategory && matchStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "stock":
          return b.stock - a.stock;
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterCategory, filterStatus, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Map database fields to component interface
      const mappedProducts: Product[] = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        category: product.category || "Uncategorized",
        price: product.price,
        stock: product.stock || 0,
        image_url: product.image_url || "",
        is_active: product.is_active,
        created_at: product.created_at,
      }));

      setProducts(mappedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const statuses = ["All", "Active", "Inactive"];

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-emerald-100 text-emerald-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600 font-semibold";
    if (stock < 100) return "text-amber-600 font-semibold";
    return "text-emerald-600 font-semibold";
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SidebarLayout title="Products">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 mt-1">Manage your product catalog</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-slate-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button> */}
            <Link
              href="/admin/products/create"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock">Stock Level</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredProducts.length}
                </span>{" "}
                products found
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                            />
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(product.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        Ksh {product.price.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 ${getStockColor(product.stock)}`}>
                        {product.stock === 0 ? "Out of Stock" : product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            product.is_active
                          )}`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">
                No products found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Showing 1-{Math.min(10, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-slate-900 text-white rounded-lg text-sm font-medium">
                1
              </button>
              <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}