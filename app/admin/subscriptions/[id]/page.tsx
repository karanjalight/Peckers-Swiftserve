"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  ArrowLeft,
  Baby,
  Shield,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface SubscriptionPackageDetail {
  id: string;
  name: string;
  slug: string;
  service_type: "nanny" | "security";
  price: string;
  service_days: number;
  validity_days: number;
  description: string | null;
  features: string[] | null;
  terms_conditions: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

export default function SubscriptionPackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<SubscriptionPackageDetail | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching package:", error);
      } else {
        setPkg(data as any);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleStatus = async () => {
    if (!pkg) return;
    const newStatus = pkg.status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("subscription_packages")
        .update({ status: newStatus })
        .eq("id", pkg.id);

      if (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status");
      } else {
        setPkg({ ...pkg, status: newStatus });
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!pkg) return;
    if (
      !confirm(
        `Are you sure you want to delete the package "${pkg.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("subscription_packages")
        .delete()
        .eq("id", pkg.id);

      if (error) {
        console.error("Error deleting package:", error);
        alert(
          "Failed to delete package. It may have existing customer subscriptions."
        );
      } else {
        router.push("/admin/subscriptions");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to delete package");
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Subscription Package">
        <div className="flex items-center justify-center min-height-[400px] p-6">
          <Loader className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      </SidebarLayout>
    );
  }

  if (!pkg) {
    return (
      <SidebarLayout title="Subscription Package">
        <div className="p-6">
          <button
            onClick={() => router.push("/admin/subscriptions")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscription Packages
          </button>
          <p className="text-slate-600 text-sm">Package not found.</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Subscription Package">
      <div className="p-4 md:p-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button
            onClick={() => router.push("/admin/subscriptions")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscription Packages
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push(`/admin/subscriptions/edit/${pkg.id}`)
              }
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg ${
                pkg.status === "active"
                  ? "border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                  : "border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
              }`}
            >
              {pkg.status === "active" ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                pkg.service_type === "nanny" ? "bg-pink-100" : "bg-green-100"
              }`}
            >
              {pkg.service_type === "nanny" ? (
                <Baby className="w-7 h-7 text-pink-600" />
              ) : (
                <Shield className="w-7 h-7 text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{pkg.name}</h1>
              <p className="text-slate-600 text-sm mt-1">Slug: {pkg.slug}</p>
              <p className="text-slate-600 text-xs mt-1">
                Package ID: {pkg.id}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                pkg.status === "active"
                  ? "bg-green-100 text-green-700"
                  : pkg.status === "inactive"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {pkg.status === "active" && (
                <CheckCircle className="w-3 h-3" />
              )}
              {pkg.status !== "active" && (
                <XCircle className="w-3 h-3" />
              )}
              <span className="capitalize">{pkg.status}</span>
            </span>
            <p className="text-xs text-slate-500">
              Created {formatDate(pkg.created_at)}
            </p>
            <p className="text-xs text-slate-500">
              Updated {formatDate(pkg.updated_at)}
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pricing & Duration */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pricing & Duration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <p className="text-xs text-slate-500">Price</p>
                <p className="mt-1 font-semibold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  KES {parseFloat(pkg.price).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Service Days</p>
                <p className="mt-1 font-semibold">{pkg.service_days} days</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Validity</p>
                <p className="mt-1 font-semibold">
                  {pkg.validity_days} days from purchase
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Service Type</p>
                <p className="mt-1 font-semibold flex items-center gap-2">
                  {pkg.service_type === "nanny" ? (
                    <Baby className="w-4 h-4 text-pink-600" />
                  ) : (
                    <Shield className="w-4 h-4 text-green-600" />
                  )}
                  <span className="capitalize">
                    {pkg.service_type === "nanny" ? "Nanny" : "Security"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Description
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {pkg.description || "No description provided for this package."}
            </p>
          </div>
        </div>

        {/* Features & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Features
            </h2>
            {pkg.features && pkg.features.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {pkg.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">
                No specific features listed.
              </p>
            )}
          </div>

          {/* Terms */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Terms & Conditions
            </h2>
            {pkg.terms_conditions ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {pkg.terms_conditions}
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                No specific terms have been added for this package.
              </p>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}







