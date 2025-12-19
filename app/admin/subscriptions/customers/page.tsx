"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  Search,
  Filter,
  Eye,
  Calendar,
  Baby,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface CustomerSubscription {
  id: string;
  user_id: string;
  package_id: string;
  status: "active" | "expired" | "cancelled" | "redeemed";
  purchase_date: string;
  expiry_date: string;
  service_days_total: number;
  service_days_used: number;
  service_days_remaining: number;
  amount_paid: string;
  payment_status: "pending" | "paid" | "failed";
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  subscription_packages: {
    name: string;
    service_type: "nanny" | "security";
  } | null;
}

export default function CustomerSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [filtered, setFiltered] = useState<CustomerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "nanny" | "security">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired" | "cancelled" | "redeemed"
  >("all");
  const [filterPayment, setFilterPayment] = useState<
    "all" | "pending" | "paid" | "failed"
  >("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let data = [...subscriptions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((sub) => {
        const name = sub.users?.full_name?.toLowerCase() || "";
        const email = sub.users?.email?.toLowerCase() || "";
        const pkg = sub.subscription_packages?.name.toLowerCase() || "";
        return (
          name.includes(term) ||
          email.includes(term) ||
          pkg.includes(term) ||
          sub.id.toLowerCase().includes(term)
        );
      });
    }

    if (filterType !== "all") {
      data = data.filter(
        (sub) => sub.subscription_packages?.service_type === filterType
      );
    }

    if (filterStatus !== "all") {
      data = data.filter((sub) => sub.status === filterStatus);
    }

    if (filterPayment !== "all") {
      data = data.filter((sub) => sub.payment_status === filterPayment);
    }

    data.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFiltered(data);
  }, [subscriptions, searchTerm, filterType, filterStatus, filterPayment]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          users:users!user_subscriptions_user_id_fkey (full_name, email, phone),
          subscription_packages (name, service_type)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
      } else {
        setSubscriptions((data || []) as any);
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

  const getPaymentBadge = (status: string) => {
    if (status === "paid")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "pending")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (status === "failed")
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <SidebarLayout title="Customer Subscriptions">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Customer Subscriptions
            </h1>
            <p className="text-slate-600 mt-1">
              View and manage all purchased subscription packages
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
          >
            <Filter className="w-4 h-4" />
            Refresh
          </button>
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
                  placeholder="Name, email, package, ID..."
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

            {/* Subscription Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Subscription Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as
                      | "all"
                      | "active"
                      | "expired"
                      | "cancelled"
                      | "redeemed"
                  )
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="redeemed">Redeemed</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Payment Status
              </label>
              <select
                value={filterPayment}
                onChange={(e) =>
                  setFilterPayment(
                    e.target.value as "all" | "pending" | "paid" | "failed"
                  )
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{" "}
                subscriptions found
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-6 h-6 animate-spin text-slate-500 mx-auto mb-2" />
              <p className="text-slate-600">Loading subscriptions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No subscriptions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {/* Customer */}
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {sub.users?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sub.users?.email || "No email"}
                          </p>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="px-6 py-3 text-slate-700">
                        {sub.subscription_packages?.name || "Unknown Package"}
                      </td>

                      {/* Service Type */}
                      <td className="px-6 py-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {sub.subscription_packages?.service_type === "nanny" ? (
                            <Baby className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          <span>
                            {sub.subscription_packages?.service_type === "nanny"
                              ? "Nanny"
                              : "Security"}
                          </span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        <div>
                          <span className="font-semibold">
                            {sub.service_days_remaining}
                          </span>{" "}
                          / {sub.service_days_total} days
                        </div>
                        <div className="text-slate-500">
                          Used: {sub.service_days_used}
                        </div>
                      </td>

                      {/* Period */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        <div>From: {formatDate(sub.purchase_date)}</div>
                        <div>To: {formatDate(sub.expiry_date)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.status === "active" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {sub.status === "expired" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {sub.status === "cancelled" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          {sub.status === "redeemed" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{sub.status}</span>
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentBadge(
                            sub.payment_status
                          )}`}
                        >
                          {sub.payment_status === "paid" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {sub.payment_status === "pending" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {sub.payment_status === "failed" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span className="capitalize">
                            {sub.payment_status}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3">
                        <button
                          onClick={() =>
                            router.push(`/admin/subscriptions/customers/${sub.id}`)
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

