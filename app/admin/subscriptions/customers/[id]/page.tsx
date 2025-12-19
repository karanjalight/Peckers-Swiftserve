"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  ArrowLeft,
  Baby,
  Shield,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  Package,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface SubscriptionDetail {
  id: string;
  user_id: string;
  package_id: string;
  status: "active" | "expired" | "cancelled" | "redeemed";
  purchase_date: string;
  expiry_date: string;
  activated_at: string | null;
  service_days_total: number;
  service_days_used: number;
  service_days_remaining: number;
  amount_paid: string;
  payment_status: "pending" | "paid" | "failed";
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  users: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  subscription_packages: {
    name: string;
    service_type: "nanny" | "security";
    description?: string | null;
  } | null;
}

interface Redemption {
  id: string;
  days_to_redeem: number;
  service_start_date: string;
  service_end_date: string;
  status: "pending" | "approved" | "rejected" | "completed";
  location: string;
  notes: string | null;
  created_at: string;
}

export default function CustomerSubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(
    null
  );
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          users:users!user_subscriptions_user_id_fkey (full_name, email, phone),
          subscription_packages (name, service_type, description)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching subscription:", error);
      } else {
        setSubscription(data as any);
      }

      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("subscription_redemptions")
        .select("*")
        .eq("subscription_id", id)
        .order("created_at", { ascending: false });

      if (redemptionsError) {
        console.error("Error fetching redemptions:", redemptionsError);
      } else {
        setRedemptions((redemptionsData || []) as any);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "expired")
      return "bg-red-100 text-red-700 border-red-200";
    if (status === "cancelled")
      return "bg-gray-100 text-gray-700 border-gray-200";
    if (status === "redeemed")
      return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getRedemptionBadge = (status: string) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "approved")
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "pending")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (status === "rejected")
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <SidebarLayout title="Customer Subscription">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      </SidebarLayout>
    );
  }

  if (!subscription) {
    return (
      <SidebarLayout title="Customer Subscription">
        <div className="p-6">
          <button
            onClick={() => router.push("/admin/subscriptions/customers")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer Subscriptions
          </button>
          <p className="text-slate-600">Subscription not found.</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Customer Subscription">
      <div className="p-4 md:p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push("/admin/subscriptions/customers")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Subscriptions
        </button>

        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                subscription.subscription_packages?.service_type === "nanny"
                  ? "bg-pink-100"
                  : "bg-green-100"
              }`}
            >
              {subscription.subscription_packages?.service_type === "nanny" ? (
                <Baby className="w-7 h-7 text-pink-600" />
              ) : (
                <Shield className="w-7 h-7 text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {subscription.subscription_packages?.name || "Subscription"}
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Subscription ID: {subscription.id}
              </p>
              <p className="text-slate-600 mt-1 text-sm">
                Purchased on {formatDate(subscription.purchase_date)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                subscription.status
              )}`}
            >
              {subscription.status === "active" && (
                <CheckCircle className="w-3 h-3" />
              )}
              {subscription.status === "expired" && (
                <XCircle className="w-3 h-3" />
              )}
              {subscription.status === "cancelled" && (
                <XCircle className="w-3 h-3" />
              )}
              {subscription.status === "redeemed" && (
                <CheckCircle className="w-3 h-3" />
              )}
              <span className="capitalize">{subscription.status}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border`}
            >
              {subscription.payment_status === "paid" && (
                <CheckCircle className="w-3 h-3 text-green-600" />
              )}
              {subscription.payment_status === "pending" && (
                <Clock className="w-3 h-3 text-yellow-600" />
              )}
              {subscription.payment_status === "failed" && (
                <XCircle className="w-3 h-3 text-red-600" />
              )}
              <span className="capitalize text-slate-700">
                Payment: {subscription.payment_status}
              </span>
            </span>
          </div>
        </div>

        {/* Grid: Customer + Subscription Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer
            </h2>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium">Name: </span>
                {subscription.users?.full_name || "Unknown"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{subscription.users?.email || "No email"}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{subscription.users?.phone || "No phone"}</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                User ID: {subscription.user_id}
              </p>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Subscription Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <p className="text-slate-500 text-xs">Service Type</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  {subscription.subscription_packages?.service_type === "nanny" ? (
                    <Baby className="w-4 h-4 text-pink-600" />
                  ) : (
                    <Shield className="w-4 h-4 text-green-600" />
                  )}
                  <span>
                    {subscription.subscription_packages?.service_type === "nanny"
                      ? "Nanny"
                      : "Security"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Amount Paid</p>
                <p className="font-semibold mt-1 text-slate-900 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  KES {parseFloat(subscription.amount_paid).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Purchase Date</p>
                <p className="font-medium mt-1">
                  {formatDate(subscription.purchase_date)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Expiry Date</p>
                <p className="font-medium mt-1">
                  {formatDate(subscription.expiry_date)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Activated At</p>
                <p className="font-medium mt-1">
                  {formatDateTime(subscription.activated_at)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Payment Reference</p>
                <p className="font-medium mt-1">
                  {subscription.payment_reference || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Total Days</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {subscription.service_days_total}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Used</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {subscription.service_days_used}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Remaining</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {subscription.service_days_remaining}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Redemptions Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Redemptions
          </h2>

          {redemptions.length === 0 ? (
            <p className="text-slate-600 text-sm">
              No redemptions have been made on this subscription yet.
            </p>
          ) : (
            <div className="space-y-4">
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(r.service_start_date)} -
                      {" "}
                      {formatDate(r.service_end_date)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Created: {formatDateTime(r.created_at)}
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      <span className="font-medium">Location:</span> {r.location}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Days:</span> {r.days_to_redeem}
                    </p>
                    {r.notes && (
                      <p className="text-sm text-slate-700 mt-1">
                        <span className="font-medium">Notes:</span> {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start md:items-center justify-start md:justify-end">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRedemptionBadge(
                        r.status
                      )}`}
                    >
                      {r.status === "completed" && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {r.status === "approved" && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {r.status === "pending" && (
                        <Clock className="w-3 h-3" />
                      )}
                      {r.status === "rejected" && (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span className="capitalize">{r.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

