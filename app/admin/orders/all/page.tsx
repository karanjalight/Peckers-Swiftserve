"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SidebarLayout from "@/components/layouts/SidebarLayout";

type ServiceType = "emergency_under_6_hours" | "sunday_day_bug" | "short_term_daily";
type SecurityDogOption = "one_dog_one_handler" | "two_dogs_two_handlers" | "three_plus";
type SecurityReason = "travel_vacation" | "night_shift" | "house_help_exit" | "construction_period" | "high_risk_period" | "other";

interface BaseRequest {
  id: string;
  type: "nanny" | "security";
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  id_number: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  is_paid: boolean;
  is_assigned: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

interface NannyRequest extends BaseRequest {
  type: "nanny";
  household_description: string | null;
  service_needed: ServiceType;
}

interface SecurityRequest extends BaseRequest {
  type: "security";
  dog_option: SecurityDogOption | null;
  reason: SecurityReason | null;
}

type CombinedRequest = NannyRequest | SecurityRequest;

const SERVICE_TYPES: Record<ServiceType, string> = {
  emergency_under_6_hours: "Emergency (Under 6h)",
  sunday_day_bug: "Sunday / Day-Bug",
  short_term_daily: "Short-Term / Daily",
};

const DOG_OPTIONS: Record<SecurityDogOption, string> = {
  one_dog_one_handler: "1 Dog + Handler",
  two_dogs_two_handlers: "2 Dogs + Handlers",
  three_plus: "3+ Dogs",
};

const REASONS: Record<SecurityReason, string> = {
  travel_vacation: "Travel / Vacation",
  night_shift: "Night Shift Work",
  house_help_exit: "House Help Exited",
  construction_period: "Construction / Renovation",
  high_risk_period: "High-Risk Period",
  other: "Other",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AllRequestsPage() {
  const [requests, setRequests] = useState<CombinedRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CombinedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "nanny" | "security">("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch both request types
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch nanny requests
      const { data: nannyData, error: nannyError } = await supabase
        .from("nanny_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (nannyError) throw nannyError;

      // Fetch security requests
      const { data: securityData, error: securityError } = await supabase
        .from("security_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (securityError) throw securityError;

      // Combine and add type field
      const nannyRequests: NannyRequest[] = (nannyData || []).map((req) => ({
        ...req,
        type: "nanny" as const,
      }));

      const securityRequests: SecurityRequest[] = (securityData || []).map((req) => ({
        ...req,
        type: "security" as const,
      }));

      const combined = [...nannyRequests, ...securityRequests].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRequests(combined);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort requests
  useEffect(() => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.full_name.toLowerCase().includes(term) ||
          req.phone.includes(term) ||
          req.email?.toLowerCase().includes(term) ||
          req.location.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => {
        if (filterStatus === "pending") {
          return !req.is_assigned && !req.is_completed && !req.is_cancelled;
        }
        if (filterStatus === "assigned") return req.is_assigned;
        if (filterStatus === "completed") return req.is_completed;
        if (filterStatus === "cancelled") return req.is_cancelled;
        return true;
      });
    }

    // Sort
    if (sortBy === "price-low") {
      filtered.sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    } else if (sortBy === "price-high") {
      filtered.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    } else if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, filterType, filterStatus, sortBy]);

  // Delete request
  const handleDelete = async (req: CombinedRequest) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const table = req.type === "nanny" ? "nanny_requests" : "security_requests";
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", req.id);

      if (deleteError) throw deleteError;
      setRequests(requests.filter((r) => r.id !== req.id));
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request");
    }
  };

  // Update status flags
  const handleStatusUpdate = async (
    req: CombinedRequest,
    field: "is_paid" | "is_assigned" | "is_completed" | "is_cancelled",
    value: boolean
  ) => {
    try {
      const table = req.type === "nanny" ? "nanny_requests" : "security_requests";
      const { error: updateError } = await supabase
        .from(table)
        .update({ [field]: value })
        .eq("id", req.id);

      if (updateError) throw updateError;
      setRequests(
        requests.map((r) => (r.id === req.id ? { ...r, [field]: value } : r))
      );
    } catch (err) {
      console.error("Error updating request:", err);
      alert("Failed to update request");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = (req: CombinedRequest) => {
    if (req.is_cancelled) return "bg-red-100 text-red-700";
    if (req.is_completed) return "bg-green-100 text-green-700";
    if (req.is_assigned) return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  // Get status text
  const getStatusText = (req: CombinedRequest) => {
    if (req.is_cancelled) return "Cancelled";
    if (req.is_completed) return "Completed";
    if (req.is_assigned) return "Assigned";
    return "Pending";
  };

  // Get service type badge
  const getServiceBadge = (req: CombinedRequest) => {
    if (req.type === "nanny") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          Nanny
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
        Security
      </span>
    );
  };

  // Get service details
  const getServiceDetails = (req: CombinedRequest) => {
    if (req.type === "nanny") {
      return SERVICE_TYPES[req.service_needed];
    }
    return req.reason ? REASONS[req.reason] : "—";
  };

  // Get additional info
  const getAdditionalInfo = (req: CombinedRequest) => {
    if (req.type === "nanny") {
      return req.household_description || "—";
    }
    return req.dog_option ? DOG_OPTIONS[req.dog_option] : "—";
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <SidebarLayout title="All Requests">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">All Requests</h1>
            <p className="text-slate-600 mt-1">Manage nanny and security requests</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Refresh
            </button>
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
                  placeholder="Name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Request Type
              </label>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType((e.target.value as "all" | "nanny" | "security") || "all")
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="nanny">Nanny Requests</option>
                <option value="security">Security Requests</option>
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
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
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
                <option value="price-low">Start Date (Earliest)</option>
                <option value="price-high">Start Date (Latest)</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredRequests.length}
                </span>{" "}
                requests found
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchRequests}
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
                      Type
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Assigned
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      key={`${request.type}-${request.id}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {getServiceBadge(request)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {request.full_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {request.location}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {request.phone}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getServiceDetails(request)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                        {getAdditionalInfo(request)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div>
                          {formatDate(request.start_date)}
                        </div>
                        <div>→ {formatDate(request.end_date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            request
                          )}`}
                        >
                          {getStatusText(request)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleStatusUpdate(request, "is_paid", !request.is_paid)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            request.is_paid
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {request.is_paid ? "Paid" : "Unpaid"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              request,
                              "is_assigned",
                              !request.is_assigned
                            )
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            request.is_assigned
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {request.is_assigned ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Copy request details to clipboard
                              const details = `
Type: ${request.type === "nanny" ? "Nanny" : "Security"}
Name: ${request.full_name}
Phone: ${request.phone}
Email: ${request.email || "N/A"}
Location: ${request.location}
ID: ${request.id_number}
Service: ${getServiceDetails(request)}
Start: ${formatDate(request.start_date)}
End: ${formatDate(request.end_date)}
${request.type === "nanny" ? `Household: ${(request as NannyRequest).household_description || "N/A"}` : `Dogs: ${(request as SecurityRequest).dog_option ? DOG_OPTIONS[(request as SecurityRequest).dog_option!] : "N/A"}`}
Notes: ${request.notes || "N/A"}
                              `.trim();
                              navigator.clipboard.writeText(details);
                              alert("Request details copied!");
                            }}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(request)}
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

          {!loading && !error && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">
                No requests found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}