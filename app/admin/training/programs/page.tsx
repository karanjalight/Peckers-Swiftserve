"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Eye, Edit, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  cohort_number: number;
  total_price: number;
  deposit_amount: number;
  balance_due_days: number;
  start_date: string | null;
  end_date: string | null;
  enrollment_deadline: string | null;
  max_participants: number | null;
  current_participants: number;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
}

export default function TrainingProgramsPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPublished, setFilterPublished] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err: any) {
      console.error("Error fetching training programs:", err);
      setError(err.message || "Failed to load training programs");
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training program? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.from("training_programs").delete().eq("id", id);

      if (error) throw error;

      setPrograms(programs.filter((program) => program.id !== id));
      alert("Training program deleted successfully");
    } catch (err: any) {
      console.error("Error deleting training program:", err);
      alert(err.message || "Failed to delete training program");
    }
  };

  // Filter and sort programs
  const filteredPrograms = programs
    .filter((program) => {
      const matchesSearch =
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.cohort_number.toString().includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" || 
        (filterStatus === "active" ? program.is_active : !program.is_active);

      const matchesPublished =
        filterPublished === "all" ||
        (filterPublished === "published" ? program.is_published : !program.is_published);

      return matchesSearch && matchesStatus && matchesPublished;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "cohort":
          return a.cohort_number - b.cohort_number;
        case "name":
          return a.name.localeCompare(b.name);
        case "start_date":
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (isActive: boolean, isPublished: boolean) => {
    if (!isActive) return "bg-red-100 text-red-700";
    if (isPublished) return "bg-green-100 text-green-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getStatusText = (isActive: boolean, isPublished: boolean) => {
    if (!isActive) return "Inactive";
    if (isPublished) return "Published";
    return "Draft";
  };

  return (
    <SidebarLayout title="Training Programs">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Training Programs</h1>
            <p className="text-slate-600 mt-1">Manage your training programs and cohorts</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin/training/programs/create"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Create Training
            </Link>
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
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Published Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Published
              </label>
              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="cohort">Cohort Number</option>
                <option value="name">Name (A-Z)</option>
                <option value="start_date">Start Date</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredPrograms.length}
                </span>{" "}
                programs found
              </div>
            </div>
          </div>
        </div>

        {/* Programs Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading training programs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchPrograms}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
                      Program
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Cohort
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Participants
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((program) => (
                    <tr
                      key={program.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="max-w-md">
                            <p className="font-medium text-slate-900 truncate">
                              {program.name}
                            </p>
                            {program.description && (
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {program.description.substring(0, 60)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          #{program.cohort_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>
                          <p className="font-medium">{formatCurrency(program.total_price)}</p>
                          <p className="text-xs text-slate-500">
                            Deposit: {formatCurrency(program.deposit_amount)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {program.current_participants}
                            {program.max_participants && ` / ${program.max_participants}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(program.start_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            program.is_active,
                            program.is_published
                          )}`}
                        >
                          {getStatusText(program.is_active, program.is_published)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/training/programs/${program.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/training/programs/edit/${program.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="Edit program"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProgram(program.id)}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                            title="Delete program"
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

          {!loading && !error && filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-sm">
                No training programs found. Try adjusting your filters or create a new program.
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && !error && programs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Programs</p>
              <p className="text-2xl font-bold text-slate-900">{programs.length}</p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {programs.filter((p) => p.is_active).length}
              </p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Published</p>
              <p className="text-2xl font-bold text-blue-600">
                {programs.filter((p) => p.is_published).length}
              </p>
            </div>
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Participants</p>
              <p className="text-2xl font-bold text-purple-600">
                {programs.reduce((sum, p) => sum + p.current_participants, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

