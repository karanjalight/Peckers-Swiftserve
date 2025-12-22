"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader, ArrowLeft, Plus, X } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  service_type: "nanny" | "security";
  price: number;
  service_days: number;
  validity_days: number;
  description: string | null;
  terms_conditions: string | null;
  status: "active" | "inactive" | "archived";
  features: string[] | null;
}

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    service_type: "nanny" as "nanny" | "security",
    price: "",
    service_days: "",
    validity_days: "90",
    description: "",
    terms_conditions: "",
    status: "active" as "active" | "inactive",
  });
  const [features, setFeatures] = useState<string[]>([""]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
  };

  const addFeature = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const updateFeature = (index: number, value: string) => {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPackage = async () => {
    setInitialLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error fetching package:", error);
        alert("Failed to load package");
        router.push("/admin/subscriptions");
        return;
      }

      const pkg = data as SubscriptionPackage;

      setFormData({
        name: pkg.name || "",
        slug: pkg.slug || "",
        service_type: pkg.service_type || "nanny",
        price: String(pkg.price ?? ""),
        service_days: String(pkg.service_days ?? ""),
        validity_days: String(pkg.validity_days ?? "90"),
        description: pkg.description || "",
        terms_conditions: pkg.terms_conditions || "",
        status: pkg.status === "inactive" ? "inactive" : "active",
      });

      if (Array.isArray(pkg.features) && pkg.features.length > 0) {
        setFeatures(pkg.features);
      } else {
        setFeatures([""]);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to load package");
      router.push("/admin/subscriptions");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadPackage();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Filter out empty features
      const validFeatures = features.filter((f) => f.trim() !== "");

      const { error } = await supabase
        .from("subscription_packages")
        .update({
          name: formData.name,
          slug: formData.slug,
          service_type: formData.service_type,
          price: parseFloat(formData.price),
          service_days: parseInt(formData.service_days),
          validity_days: parseInt(formData.validity_days),
          description: formData.description,
          terms_conditions: formData.terms_conditions,
          features: validFeatures,
          status: formData.status,
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating package:", error);
        alert("Failed to update package: " + error.message);
      } else {
        alert("Package updated successfully!");
        router.push("/admin/subscriptions");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 p-8 bg-gray-50 w-full">
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-blue-700" />
          </div>
        </main>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-8 bg-gray-50 w-full">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Packages
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Subscription Package
            </h1>
            <p className="text-gray-600 mt-1">
              Update details for this subscription package
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm p-8"
          >
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Gold Nanny Package"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="gold-nanny-package"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      required
                      value={formData.service_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          service_type: e.target.value as "nanny" | "security",
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nanny">Nanny</option>
                      <option value="security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "inactive",
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Service */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing & Service Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (KES) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Days *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.service_days}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          service_days: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="4"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of service days included
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validity Days *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.validity_days}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validity_days: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="90"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Package valid for this many days
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the package..."
                />
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Features
                  </h2>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a feature..."
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms_conditions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      terms_conditions: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Terms and conditions for this package..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </SidebarProvider>
  );
}







