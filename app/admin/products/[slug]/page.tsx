// app/admin/products/[slug]/page.tsx
'use client';

import SidebarLayout from "@/components/layouts/SidebarLayout";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  X,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  Edit2,
  Loader,
} from 'lucide-react';
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, getSubcategories, getCategoryLabel, getSubcategoryLabel } from '@/lib/constants/categories';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  barcode: string;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  weight_kg: number;
  dimensions_cm: string;
  is_active: boolean;
  is_on_sale: boolean;
  sale_price: number;
  discount_percentage: number;
  image_url: string;
  rating: number;
  review_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Utility functions
function calculateProfitMetrics(sellingPrice: number, costPrice: number) {
  const profit = sellingPrice - costPrice;
  const margin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';
  return { profit, margin };
}

function getStockColor(stock: number, threshold: number): string {
  if (stock === 0) return 'text-red-600';
  if (stock <= threshold) return 'text-amber-600';
  return 'text-emerald-600';
}

function validateProduct(product: Partial<Product>): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!product.name?.trim()) {
    errors.name = 'Product name is required';
  }

  if (!product.category?.trim()) {
    errors.category = 'Category is required';
  }

  if (product.price === undefined || product.price === null || product.price < 0) {
    errors.price = 'Price must be a positive number';
  }

  if (product.stock !== undefined && product.stock < 0) {
    errors.stock = 'Stock must be a non-negative number';
  }

  return errors;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [availableSubcategories, setAvailableSubcategories] = useState<{ value: string; label: string }[]>([]);

  // Update subcategories when category changes in edit mode
  useEffect(() => {
    if (formData?.category) {
      const subcategories = getSubcategories(formData.category);
      setAvailableSubcategories(subcategories);
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData?.category]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error("Product not found");

      setProduct(data as Product);
      setFormData(data as Product);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target as HTMLInputElement;

    const numericFields = ['price', 'cost_price', 'stock', 'weight_kg', 'sale_price', 'discount_percentage', 'low_stock_threshold'];

    setFormData((prev) => ({
      ...prev!,
      [name]: numericFields.includes(name)
        ? parseFloat(value) || 0
        : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }));

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      // Validate form data
      const errors = validateProduct(formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setSaveStatus('saving');

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          sku: formData.sku,
          barcode: formData.barcode,
          price: formData.price,
          cost_price: formData.cost_price,
          stock: formData.stock,
          low_stock_threshold: formData.low_stock_threshold,
          weight_kg: formData.weight_kg,
          dimensions_cm: formData.dimensions_cm,
          is_active: formData.is_active,
          is_on_sale: formData.is_on_sale,
          sale_price: formData.sale_price,
          discount_percentage: formData.discount_percentage,
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      setProduct(formData);
      setIsEditing(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Error saving product:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setFormData(product);
    setIsEditing(false);
    setValidationErrors({});
  };

  const handleDelete = async () => {
    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (deleteError) throw deleteError;

      router.push("/admin/products");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Product Detail">
        <div className="flex-1 flex items-center justify-center bg-white min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-600">Loading product...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !product || !formData) {
    return (
      <SidebarLayout title="Product Detail">
        <div className="flex-1 space-y-6 p-6 bg-white min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Product not found"}</p>
            <Link href="/admin/products" className="text-blue-600 hover:underline">
              Back to Products
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const { profit, margin } = calculateProfitMetrics(product.price, product.cost_price || 0);

  return (
    <SidebarLayout title="Product Detail">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isEditing ? 'Edit Product' : product.name}
              </h1>
              <p className="text-slate-600 mt-1">
                Last updated: {new Date(product.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Saved successfully</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error saving changes</span>
            </div>
          )}

          {!isEditing && (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium rounded"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium rounded"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Product Image
              </h2>
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg bg-slate-100"
                />
              )}
              {!product.image_url && (
                <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">No image available</p>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Product Information
              </h2>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Name</p>
                    <p className="text-slate-900 mt-1">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Description</p>
                    <p className="text-slate-900 mt-1 whitespace-pre-wrap">{product.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Category</p>
                      <p className="text-slate-900 mt-1">{getCategoryLabel(product.category)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Subcategory</p>
                      <p className="text-slate-900 mt-1">
                        {product.subcategory 
                          ? getSubcategoryLabel(product.category, product.subcategory)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">SKU</p>
                      <p className="text-slate-900 mt-1">{product.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Barcode</p>
                      <p className="text-slate-900 mt-1">{product.barcode || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.category ? 'border-red-500' : 'border-slate-200'
                        }`}
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {validationErrors.category && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.category}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subcategory
                      </label>
                      {availableSubcategories.length > 0 ? (
                        <select
                          name="subcategory"
                          value={formData.subcategory || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select subcategory (optional)</option>
                          {availableSubcategories.map((subcategory) => (
                            <option key={subcategory.value} value={subcategory.value}>
                              {subcategory.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="subcategory"
                          value={formData.subcategory || ''}
                          onChange={handleInputChange}
                          placeholder={formData.category ? "No subcategories available" : "Select a category first"}
                          disabled={!formData.category || availableSubcategories.length === 0}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      )}
                      {formData.category && availableSubcategories.length === 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          This category doesn't have subcategories
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        value={formData.barcode || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Pricing & Stock
              </h2>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Selling Price</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        Ksh {product.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Cost Price</p>
                      <p className="text-slate-900 mt-1">Ksh {(product.cost_price || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Stock</p>
                      <p className={`text-xl font-bold mt-1 ${getStockColor(product.stock, product.low_stock_threshold)}`}>
                        {product.stock === 0 ? 'Out of Stock' : product.stock}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Profit</p>
                      <p className="text-emerald-600 font-bold mt-1">
                        Ksh {profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Margin</p>
                      <p className="text-emerald-600 font-bold mt-1">{margin}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Low Stock Alert</p>
                      <p className="text-slate-900 font-bold mt-1">{product.low_stock_threshold}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Selling Price
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg">
                          Ksh
                        </span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          step="0.01"
                          className={`flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.price ? 'border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {validationErrors.price && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Cost Price
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg">
                          Ksh
                        </span>
                        <input
                          type="number"
                          name="cost_price"
                          value={formData.cost_price || 0}
                          onChange={handleInputChange}
                          step="0.01"
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.stock ? 'border-red-500' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.stock && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.stock}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_on_sale"
                        checked={formData.is_on_sale}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-slate-700">Product is on sale</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Status</h3>
              {!isEditing ? (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {product.is_active ? 'Active' : 'Inactive'}
                </div>
              ) : (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Rating:</span>
                  <span className="font-semibold text-slate-900">{product.rating.toFixed(1)}/5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Reviews:</span>
                  <span className="font-semibold text-slate-900">{product.review_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Views:</span>
                  <span className="font-semibold text-slate-900">{product.view_count}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Profit Margin:</span>
                  <span className="font-semibold text-emerald-600">{margin}%</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Additional Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-600">Created:</p>
                  <p className="font-medium text-slate-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Last Updated:</p>
                  <p className="font-medium text-slate-900">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Barcode:</p>
                  <p className="font-medium text-slate-900 break-all">{product.barcode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Tip</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Click Edit to modify product details and pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delete Product</h3>
                  <p className="text-sm text-slate-600">Are you sure?</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                This action cannot be undone. The product "{product.name}" will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}