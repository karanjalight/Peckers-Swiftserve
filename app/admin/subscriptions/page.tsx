"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  Plus,
  Edit,
  Trash2,
  Package,
  Baby,
  Shield,
  DollarSign,
  Calendar,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  service_type: "nanny" | "security";
  price: string;
  service_days: number;
  validity_days: number;
  description: string;
  features: string[];
  status: "active" | "inactive" | "archived";
  created_at: string;
}

export default function SubscriptionPackagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<SubscriptionPackage[]>([]);
  const [filterType, setFilterType] = useState<"all" | "nanny" | "security">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "archived">("all");

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=/admin/subscriptions");
        return;
      }

      await fetchPackages();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("subscription_packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching packages:", error);
    } else {
      setPackages(data || []);
      setFilteredPackages(data || []);
    }
  };

  const togglePackageStatus = async (packageId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("subscription_packages")
      .update({ status: newStatus })
      .eq("id", packageId);

    if (error) {
      console.error("Error updating package status:", error);
      alert("Failed to update package status");
    } else {
      await fetchPackages();
    }
  };

  const deletePackage = async (packageId: string, packageName: string) => {
    if (!confirm(`Are you sure you want to delete "${packageName}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("subscription_packages")
      .delete()
      .eq("id", packageId);

    if (error) {
      console.error("Error deleting package:", error);
      alert("Failed to delete package. It may have active subscriptions.");
    } else {
      await fetchPackages();
    }
  };

  // Apply filters whenever filters or packages change
  useEffect(() => {
    let data = [...packages];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((pkg) => {
        return (
          pkg.name.toLowerCase().includes(term) ||
          pkg.slug.toLowerCase().includes(term)
        );
      });
    }

    if (filterType !== "all") {
      data = data.filter((pkg) => pkg.service_type === filterType);
    }

    if (filterStatus !== "all") {
      data = data.filter((pkg) => pkg.status === filterStatus);
    }

    data.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredPackages(data);
  }, [packages, searchTerm, filterType, filterStatus]);

  if (loading) {
    return (
      <SidebarLayout title="Subscription Packages">
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Subscription Packages">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Subscription Packages
            </h1>
            <p className="text-slate-600 mt-1">
              Create and manage subscription packages
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/subscriptions/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Package
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Packages</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {packages.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Active Packages</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {packages.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Nanny Packages</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {packages.filter((p) => p.service_type === "nanny").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Baby className="w-5 h-5 text-pink-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Security Packages</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {packages.filter((p) => p.service_type === "security").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
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
                  placeholder="Name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Service Type
              </label>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "nanny" | "security")
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="nanny">Nanny</option>
                <option value="security">Security</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                      | "archived"
                  )
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Result count */}
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredPackages.length}
                </span>{" "}
                packages found
              </p>
            </div>

            {/* Refresh */}
            <div className="flex items-end justify-start md:justify-end">
              <button
                onClick={fetchPackages}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm"
              >
                <Filter className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No packages found.</p>
              <button
                onClick={() => router.push("/admin/subscriptions/create")}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Create your first package
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {/* Package name + slug */}
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">
                          {pkg.name}
                        </p>
                        <p className="text-xs text-slate-500">{pkg.slug}</p>
                      </td>

                      {/* Service type */}
                      <td className="px-6 py-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {pkg.service_type === "nanny" ? (
                            <Baby className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          <span className="capitalize">{pkg.service_type}</span>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-3 text-slate-700">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">
                            KES {parseFloat(pkg.price).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        <div>{pkg.service_days} days service</div>
                        <div>{pkg.validity_days} days validity</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            pkg.status === "active"
                              ? "bg-green-100 text-green-700"
                              : pkg.status === "inactive"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {pkg.status}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        {new Date(pkg.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              router.push(`/admin/subscriptions/${pkg.id}`)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/subscriptions/edit/${pkg.id}`
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              togglePackageStatus(pkg.id, pkg.status)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              pkg.status === "active"
                                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                            title={
                              pkg.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {pkg.status === "active" ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deletePackage(pkg.id, pkg.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
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
        </div>
      </div>
    </SidebarLayout>
  );
}

