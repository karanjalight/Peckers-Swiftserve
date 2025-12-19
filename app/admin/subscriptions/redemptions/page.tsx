"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Package,
  User,
  Baby,
  Shield,
  Search,
  Filter,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface Redemption {
  id: string;
  subscription_id: string;
  user_id: string;
  days_to_redeem: number;
  service_start_date: string;
  service_end_date: string;
  location: string;
  phone: string;
  email: string;
  notes: string;
  status: "pending" | "approved" | "rejected" | "completed";
  rejection_reason: string | null;
  created_at: string;
  user_subscriptions: {
    package_id: string;
    subscription_packages: {
      name: string;
      service_type: "nanny" | "security";
    };
  };
  users: {
    full_name: string;
    email: string;
  };
}

export default function RedemptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected" | "completed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "nanny" | "security">(
    "all"
  );

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=/admin/subscriptions/redemptions");
        return;
      }

      await fetchRedemptions();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    const { data, error } = await supabase
      .from("subscription_redemptions")
      .select(
        `
        *,
        user_subscriptions!inner(
          package_id,
          subscription_packages!inner(name, service_type)
        ),
        users!subscription_redemptions_user_id_fkey(full_name, email)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching redemptions:", error);
    } else {
      setRedemptions(data || []);
    }
  };

  const approveRedemption = async (redemptionId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { error } = await supabase
      .from("subscription_redemptions")
      .update({
        status: "approved",
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", redemptionId);

    if (error) {
      console.error("Error approving redemption:", error);
      alert("Failed to approve redemption");
    } else {
      await fetchRedemptions();
    }
  };

  const rejectRedemption = async (redemptionId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    const { error } = await supabase
      .from("subscription_redemptions")
      .update({
        status: "rejected",
        rejection_reason: reason,
      })
      .eq("id", redemptionId);

    if (error) {
      console.error("Error rejecting redemption:", error);
      alert("Failed to reject redemption");
    } else {
      await fetchRedemptions();
    }
  };

  const completeRedemption = async (redemptionId: string) => {
    const { error } = await supabase
      .from("subscription_redemptions")
      .update({ status: "completed" })
      .eq("id", redemptionId);

    if (error) {
      console.error("Error completing redemption:", error);
      alert("Failed to complete redemption");
    } else {
      await fetchRedemptions();
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
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      ),
      approved: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      ),
      completed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || null;
  };

  const filteredRedemptions = redemptions.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (
      filterType !== "all" &&
      r.user_subscriptions.subscription_packages.service_type !== filterType
    )
      return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const customer =
        r.users?.full_name?.toLowerCase() || "" ||
        r.users?.email?.toLowerCase() ||
        "";
      const pkg =
        r.user_subscriptions.subscription_packages.name.toLowerCase() || "";
      const location = r.location.toLowerCase();

      return (
        customer.includes(term) ||
        pkg.includes(term) ||
        location.includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <SidebarLayout title="Subscription Redemptions">
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Subscription Redemptions">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Subscription Redemptions
            </h1>
            <p className="text-slate-600 mt-1">
              Manage customer subscription redemption requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Redemptions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {redemptions.length}
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
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {redemptions.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {redemptions.filter((r) => r.status === "approved").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {redemptions.filter((r) => r.status === "completed").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
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
                  placeholder="Customer, package, location, ID..."
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
                      | "pending"
                      | "approved"
                      | "rejected"
                      | "completed"
                  )
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredRedemptions.length}
                </span>{" "}
                redemptions found
              </p>
            </div>

            {/* Refresh */}
            <div className="flex items-end justify-start md:justify-end">
              <button
                onClick={fetchRedemptions}
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
          {filteredRedemptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No redemptions found.</p>
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
                      Service Period
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRedemptions.map((redemption) => (
                    <tr
                      key={redemption.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {/* Customer */}
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {redemption.users?.full_name || "Unknown User"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {redemption.users?.email || redemption.email}
                          </p>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="px-6 py-3 text-slate-700">
                        {redemption.user_subscriptions.subscription_packages.name}
                      </td>

                      {/* Service Type */}
                      <td className="px-6 py-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {redemption.user_subscriptions.subscription_packages
                            .service_type === "nanny" ? (
                            <Baby className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          <span>
                            {redemption.user_subscriptions.subscription_packages
                              .service_type === "nanny"
                              ? "Nanny"
                              : "Security"}
                          </span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        <div>{redemption.days_to_redeem} days</div>
                        <div className="text-slate-500">
                          {formatDate(redemption.created_at)}
                        </div>
                      </td>

                      {/* Service Period */}
                      <td className="px-6 py-3 text-slate-700 text-xs">
                        <div>{formatDate(redemption.service_start_date)}</div>
                        <div>→ {formatDate(redemption.service_end_date)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">{getStatusBadge(redemption.status)}</td>

                      {/* Actions */}
                      <td className="px-6 py-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {redemption.status === "pending" && (
                            <>
                              <button
                                onClick={() => approveRedemption(redemption.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectRedemption(redemption.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          {redemption.status === "approved" && (
                            <button
                              onClick={() => completeRedemption(redemption.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark Completed
                            </button>
                          )}
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

