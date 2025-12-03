  "use client";

  import { useState, useEffect } from "react";
  import Link from "next/link";
  import SidebarLayout from "@/components/layouts/SidebarLayout";
  import { supabase } from "@/lib/supabase";
  import { Search, Eye, FileText, Trash2, Filter } from "lucide-react";

  interface Applicant {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    location: string | null;
    availability: string;
    has_smartphone: boolean;
    has_laptop: boolean;
    years_of_experience: number | null;
    shortlisted: boolean;
  }

  interface Job {
    id: string;
    job_code: string;
    title: string;
    department: string | null;
    employment_type: string;
    status: string;
  }

  interface JobApplication {
    id: string;
    applicant_id: string;
    job_id: string;
    status: string;
    notes: string | null;
    applied_at: string;
    updated_at: string;
    applicant: Applicant;
    job: Job;
  }

  export default function JobApplicationsPage() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterJob, setFilterJob] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Jobs list for filter
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
      fetchApplications();
      fetchJobs();
    }, []);

    const fetchApplications = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("job_applications")
          .select(`
            *,
            applicant:applicants(*),
            job:jobs(*)
          `)
          .order("applied_at", { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      } catch (err: any) {
        console.error("Error fetching applications:", err);
        setError(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, job_code, title");
    
        if (error) throw error;
    
        // Tell TS that data is Job[]
        setJobs(data as Job[] || []);
      } catch (err: any) {
        console.error("Error fetching jobs:", err);
      }
    };
    

    const updateApplicationStatus = async (id: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from("job_applications")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;

        // Update local state
        setApplications(
          applications.map((app) =>
            app.id === id ? { ...app, status: newStatus } : app
          )
        );
        alert("Status updated successfully");
      } catch (err: any) {
        console.error("Error updating status:", err);
        alert(err.message || "Failed to update status");
      }
    };

    const deleteApplication = async (id: string) => {
      if (!confirm("Are you sure you want to delete this application?")) return;

      try {
        const { error } = await supabase
          .from("job_applications")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setApplications(applications.filter((app) => app.id !== id));
        alert("Application deleted successfully");
      } catch (err: any) {
        console.error("Error deleting application:", err);
        alert(err.message || "Failed to delete application");
      }
    };

    // Filter and sort applications
    const filteredApplications = applications
      .filter((app) => {
        const applicantName = `${app.applicant.first_name} ${app.applicant.last_name}`.toLowerCase();
        const matchesSearch =
          applicantName.includes(searchTerm.toLowerCase()) ||
          app.applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicant.phone.includes(searchTerm) ||
          app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job.job_code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          filterStatus === "all" || app.status === filterStatus;

        const matchesJob = filterJob === "all" || app.job_id === filterJob;

        return matchesSearch && matchesStatus && matchesJob;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
          case "oldest":
            return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          case "name":
            return `${a.applicant.first_name} ${a.applicant.last_name}`.localeCompare(
              `${b.applicant.first_name} ${b.applicant.last_name}`
            );
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
        case "applied":
          return "bg-blue-100 text-blue-700";
        case "shortlisted":
          return "bg-purple-100 text-purple-700";
        case "interview_scheduled":
          return "bg-orange-100 text-orange-700";
        case "interviewed":
          return "bg-yellow-100 text-yellow-700";
        case "hired":
          return "bg-green-100 text-green-700";
        case "rejected":
          return "bg-red-100 text-red-700";
        default:
          return "bg-slate-100 text-slate-600";
      }
    };

    const statuses = [
      "all",
      "applied",
      "shortlisted",
      "interview_scheduled",
      "interviewed",
      "hired",
      "rejected",
    ];

    return (
      <SidebarLayout title="Job Applications">
        <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Job Applications
              </h1>
              <p className="text-slate-600 mt-1">
                Manage and track applicant submissions
              </p>
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
                    placeholder="Name, email, job..."
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
                      {status === "all"
                        ? "All Statuses"
                        : status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Job Position
                </label>
                <select
                  value={filterJob}
                  onChange={(e) => setFilterJob(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {filteredApplications.length}
                  </span>{" "}
                  applications
                </div>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading applications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchApplications}
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
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Job Position
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Applied Date
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Experience
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {app.applicant.first_name} {app.applicant.last_name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {app.applicant.email || app.applicant.phone}
                            </p>
                            {app.applicant.shortlisted && (
                              <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                Shortlisted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {app.job.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {app.job.job_code} • {app.job.employment_type.replace(/_/g, " ")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateApplicationStatus(app.id, e.target.value)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              app.status
                            )} border-0 cursor-pointer`}
                          >
                            {statuses.slice(1).map((status) => (
                              <option key={status} value={status}>
                                {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(app.applied_at)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {app.applicant.years_of_experience !== null
                            ? `${app.applicant.years_of_experience} yrs`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/ats/applicants/${app.id}`}
                              className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/applicants/${app.applicant_id}`}
                              className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                              title="View applicant profile"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => deleteApplication(app.id)}
                              className="p-1 hover:bg-red-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                              title="Delete application"
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

            {!loading && !error && filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600 text-sm">
                  No applications found. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {!loading && !error && applications.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  {applications.length}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Applied</p>
                <p className="text-2xl font-bold text-blue-600">
                  {applications.filter((a) => a.status === "applied").length}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Shortlisted</p>
                <p className="text-2xl font-bold text-purple-600">
                  {applications.filter((a) => a.status === "shortlisted").length}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Interviewed</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter((a) => a.status === "interviewed").length}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Hired</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter((a) => a.status === "hired").length}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {applications.filter((a) => a.status === "rejected").length}
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    );
  }