'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, getSubcategories } from '@/lib/constants/categories';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { [key: string]: string };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CreateProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    sku: '',
    barcode: '',
    price: '',
    cost_price: '',
    sale_price: '',
    stock: '',
    weight_kg: '',
    dimensions_cm: '',
    discount_percentage: '',
    low_stock_threshold: '10',
    is_active: true,
    is_on_sale: false,
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantForm, setVariantForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [availableSubcategories, setAvailableSubcategories] = useState<{ value: string; label: string }[]>([]);

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const subcategories = getSubcategories(formData.category);
      setAvailableSubcategories(subcategories);
      // Reset subcategory if it's not valid for the new category
      if (formData.subcategory && !subcategories.find(sub => sub.value === formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear validation error
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (!formData.stock || parseFloat(formData.stock) < 0) {
      errors.stock = 'Stock must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImage: ProductImage = {
            id: Math.random().toString(36).substr(2, 9),
            url: event.target?.result as string,
            alt: '',
            isPrimary: images.length === 0,
          };
          setImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const setPrimaryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleAddVariant = () => {
    if (variantForm.name && variantForm.sku && variantForm.price) {
      const newVariant: ProductVariant = {
        id: Math.random().toString(36).substr(2, 9),
        name: variantForm.name,
        sku: variantForm.sku,
        price: parseFloat(variantForm.price),
        stock: parseInt(variantForm.stock) || 0,
        attributes: {},
      };
      setVariants((prev) => [...prev, newVariant]);
      setVariantForm({ name: '', sku: '', price: '', stock: '' });
      setShowVariantModal(false);
    }
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSaveStatus('saving');

      // Get primary image URL
      const primaryImage = images.find((img) => img.isPrimary);
      const imageUrl = primaryImage?.url || null;

      // Create product object
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        sku: formData.sku,
        barcode: formData.barcode,
        price: parseFloat(formData.price) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : 0,
        stock: parseInt(formData.stock) || 0,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 0,
        dimensions_cm: formData.dimensions_cm,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        image_url: imageUrl,
        is_active: isDraft ? false : formData.is_active,
        is_on_sale: formData.is_on_sale,
        rating: 0,
        review_count: 0,
        view_count: 0,
      };

      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (productError) throw productError;

      setSaveStatus('success');
      
      // Redirect after successful save
      setTimeout(() => {
        router.push(`/admin/products/${product.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating product:', error);
      setSaveStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to create product');
      setSaveStatus('idle');
    }
  };

  return (
    <SidebarLayout title="Create Products">
      <div className="flex-1 space-y-6 p-2 pt-6 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Product</h1>
            <p className="text-slate-600 mt-1">Add a new product to your catalog</p>
          </div>
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Product created successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error creating product</span>
            </div>
          )}
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white border border-slate-300 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-500' : 'border-slate-300'
                      }`}
                      required
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
                      placeholder="Enter product description"
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          validationErrors.category ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
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
                        SKU *
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="e.g., WH-001"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.sku ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
                      />
                      {validationErrors.sku && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.sku}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Subcategory
                    </label>
                    {availableSubcategories.length > 0 ? (
                      <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        placeholder={formData.category ? "No subcategories available" : "Select a category first"}
                        disabled={!formData.category || availableSubcategories.length === 0}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    )}
                    {formData.category && availableSubcategories.length === 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        This category doesn't have subcategories
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Enter barcode"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="bg-white border border-slate-300 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing & Stock</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Selling Price *
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-600">
                          Ksh
                        </span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className={`flex-1 px-4 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.price ? 'border-red-500' : 'border-slate-300'
                          }`}
                          required
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
                        <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-600">
                          Ksh
                        </span>
                        <input
                          type="number"
                          name="cost_price"
                          value={formData.cost_price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sale Price
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-600">
                          Ksh
                        </span>
                        <input
                          type="number"
                          name="sale_price"
                          value={formData.sale_price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="0"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.stock ? 'border-red-500' : 'border-slate-300'
                        }`}
                        required
                      />
                      {validationErrors.stock && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.stock}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        name="low_stock_threshold"
                        value={formData.low_stock_threshold}
                        onChange={handleInputChange}
                        placeholder="10"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight_kg"
                        value={formData.weight_kg}
                        onChange={handleInputChange}
                        placeholder="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Dimensions (cm)
                      </label>
                      <input
                        type="text"
                        name="dimensions_cm"
                        value={formData.dimensions_cm}
                        onChange={handleInputChange}
                        placeholder="10x20x30"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
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

                  {formData.is_on_sale && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Discount Percentage
                      </label>
                      <input
                        type="number"
                        name="discount_percentage"
                        value={formData.discount_percentage}
                        onChange={handleInputChange}
                        placeholder="0"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Images */}
              <div className="bg-white border border-slate-300 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h2>

                {images.length === 0 ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className={`w-full h-24 object-cover rounded-lg ${
                              image.isPrimary ? 'ring-2 ring-blue-500' : ''
                            }`}
                          />
                          {image.isPrimary && (
                            <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(image.id)}
                              className="p-1 bg-white rounded hover:bg-blue-500 hover:text-white"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="p-1 bg-white rounded hover:bg-red-500 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add more images</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Product Variants */}
              <div className="bg-white border border-slate-300 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Variants (Optional)</h2>
                  <button
                    type="button"
                    onClick={() => setShowVariantModal(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </button>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-300 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{variant.name}</p>
                          <p className="text-xs text-slate-600">
                            SKU: {variant.sku} | Ksh {variant.price.toFixed(2)} | Stock: {variant.stock}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 text-center py-6">
                    No variants yet. Add variants to offer different options.
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status */}
              <div className="bg-white border border-slate-300 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Status</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="bg-white border border-slate-300 rounded-lg p-6 space-y-3">
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Product'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saveStatus === 'saving'}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="w-full px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tip</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Fill in all required fields marked with * before publishing your product.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Variant Modal */}
        {showVariantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Add Variant</h3>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    value={variantForm.name}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Black - Large"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={variantForm.sku}
                    onChange={(e) =>
                      setVariantForm((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="e.g., WH-001-BLK-L"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={variantForm.stock}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        stock: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Add Variant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}