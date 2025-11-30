"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Eye, Edit, Trash2, Briefcase } from "lucide-react";

interface Job {
  id: string;
  job_code: string;
  title: string;
  department?: string;
  description?: string;
  location?: string;
  employment_type: string;
  status: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) throw error;

      setJobs(jobs.filter((job) => job.id !== id));
    //   alert("Job deleted successfully");
    } catch (err: any) {
      console.error("Error deleting job:", err);
      alert(err.message || "Failed to delete job");
    }
  };

  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || job.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700";
      case "paused":
        return "bg-yellow-100 text-yellow-700";
      case "closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const statuses = ["all", "open", "paused", "closed"];

  return (
    <SidebarLayout title="ATS - Jobs">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
            <p className="text-slate-600 mt-1">Manage job listings</p>
          </div>
          <Link
            href="/admin/ats/jobs/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
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
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* Results */}
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredJobs.length}
                </span>{" "}
                jobs found
              </div>
            </div>

          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchJobs}
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
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Job</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Location</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Created</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {job.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {job.job_code} • {job.department || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {job.location || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-slate-600 capitalize">
                        {job.employment_type.replace("_", " ")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(job.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/ats/jobs/${job.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/admin/ats/jobs/edit/${job.id}`}
                            className="p-1 hover:bg-slate-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded-lg"
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

          {!loading && !error && filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">
                No jobs found. Create your first job post.
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>

            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter((j) => j.status === "open").length}
              </p>
            </div>

            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Paused</p>
              <p className="text-2xl font-bold text-yellow-600">
                {jobs.filter((j) => j.status === "paused").length}
              </p>
            </div>

            <div className="bg-white border border-slate-300 rounded-lg p-4">
              <p className="text-sm text-slate-600">Closed</p>
              <p className="text-2xl font-bold text-red-600">
                {jobs.filter((j) => j.status === "closed").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
