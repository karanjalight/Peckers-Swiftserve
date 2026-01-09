"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap,
  User,
  Calendar,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Enrollment {
  id: string;
  enrollment_status: string;
  student_id: string | null;
  created_at: string;
  training_programs: {
    id: string;
    name: string;
    cohort_number: number;
    start_date: string | null;
    end_date: string | null;
  };
  users: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login?redirect=/admin/training/enrollments");
        return;
      }
      await fetchEnrollments();
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to load enrollments");
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("training_enrollments")
        .select(`
          *,
          training_programs(*),
          users(id, full_name, email, phone)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("enrollment_status", statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEnrollments(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching enrollments:", err);
      setError(err.message || "Failed to load enrollments");
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "fully_paid":
        return "bg-green-100 text-green-800";
      case "deposit_paid":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        enrollment.users?.full_name?.toLowerCase().includes(searchLower) ||
        enrollment.users?.email?.toLowerCase().includes(searchLower) ||
        enrollment.users?.phone?.toLowerCase().includes(searchLower) ||
        enrollment.student_id?.toLowerCase().includes(searchLower) ||
        enrollment.training_programs?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  return (
    <SidebarLayout
      title="Training Enrollments"
      breadcrumb={["Peckers", "Training", "Enrollments"]}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Training Enrollments</h1>
            <p className="text-sm text-slate-600">Manage student enrollments and attendance</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, phone, or student ID..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="deposit_paid">Deposit Paid</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{filteredEnrollments.length}</span>{" "}
                enrollments found
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading enrollments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchEnrollments}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No enrollments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Student</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Program</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Student ID</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Enrollment Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {enrollment.users?.full_name || "Unknown Student"}
                            </p>
                            <p className="text-xs text-slate-500">{enrollment.users?.email}</p>
                            {enrollment.users?.phone && (
                              <p className="text-xs text-slate-500">{enrollment.users.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-slate-900">
                              {enrollment.training_programs?.name || "Unknown Program"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Cohort {enrollment.training_programs?.cohort_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.student_id ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {enrollment.student_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            enrollment.enrollment_status
                          )}`}
                        >
                          {enrollment.enrollment_status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(enrollment.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/training/enrollments/${enrollment.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
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




