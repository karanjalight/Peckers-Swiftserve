"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
}

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  availability: string;
  years_of_experience?: number;
  created_at: string;
  jobs_applied: Job[];
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterJob, setFilterJob] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const availabilities = ["all", "immediately", "after_2_weeks", "after_4_weeks"];

  useEffect(() => {
    fetchJobs();
    fetchApplicants();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("id, title");
    if (data) setJobs(data);
  };

  const fetchApplicants = async () => {
    setLoading(true);
    setError("");
    try {
      // 1️⃣ Fetch all applicants
      const { data: applicantsData, error: applicantsError } = await supabase
        .from("applicants")
        .select("*")
        .order("created_at", { ascending: false });

      if (applicantsError) throw applicantsError;

      // 2️⃣ Fetch all job applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("job_applications")
        .select(`
          applicant:applicant_id (
            id
          ),
          job:job_id (id, title)
        `);

      if (applicationsError) throw applicationsError;

      // 3️⃣ Map jobs to applicants
      const applicantMap: Record<string, Applicant> = {};
      applicantsData?.forEach((a: any) => {
        applicantMap[a.id] = { ...a, jobs_applied: [] };
      });

      applicationsData?.forEach((app: any) => {
        const applicantId = app.applicant.id;
        if (applicantMap[applicantId] && app.job) {
          applicantMap[applicantId].jobs_applied.push(app.job);
        }
      });

      setApplicants(Object.values(applicantMap));
    } catch (err: any) {
      console.error("Error fetching applicants:", err);
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const deleteApplicant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    const { error } = await supabase.from("applicants").delete().eq("id", id);
    if (!error) setApplicants(applicants.filter((a) => a.id !== id));
  };

  const filteredApplicants = applicants
    .filter((a) => {
      const matchesSearch =
        a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.phone.includes(searchTerm);

      const matchesAvailability =
        filterAvailability === "all" || a.availability === filterAvailability;

      const matchesJob =
        filterJob === "all" || a.jobs_applied.some((job) => job.id === filterJob);

      return matchesSearch && matchesAvailability && matchesJob;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.first_name.localeCompare(b.first_name);
        case "job":
          const jobA = a.jobs_applied[0]?.title || "";
          const jobB = b.jobs_applied[0]?.title || "";
          return jobA.localeCompare(jobB);
        default:
          return 0;
      }
    });

  return (
    <SidebarLayout title="ATS - Applicants">
      <div className="flex-1 space-y-6 p-2 pt-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
            <p className="text-slate-600 mt-1">Manage job applicants</p>
          </div>
          <div className="lg:ex hidden gap-4">
            <Link
              href="/admin/ats/applicants/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Applicant
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-300 rounded-lg p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Availability</label>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availabilities.map((av) => (
                  <option key={av} value={av}>
                    {av === "all" ? "All" : av.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Job</label>
              <select
                value={filterJob}
                onChange={(e) => setFilterJob(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name (A-Z)</option>
                <option value="job">Job (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">Loading applicants...</div>
          ) : error ? (
            <div className="text-center py-12">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Email</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Phone</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Availability</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Experience</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Jobs Applied</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{a.first_name} {a.last_name}</td>
                      <td className="px-6 py-4 text-slate-600">{a.email || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-600">{a.phone}</td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{a.availability.replace("_", " ")}</td>
                      <td className="px-6 py-4 text-slate-600">{a.years_of_experience || 0} yrs</td>
                      <td className="px-6 py-4 text-slate-600">
                        {a.jobs_applied.length > 0 ? a.jobs_applied.map((job) => job.title).join(", ") : "None"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link href={`/admin/ats/applicants/${a.id}`} className="p-1 hover:bg-slate-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/ats/applicants/edit/${a.id}`} className="p-1 hover:bg-slate-100 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteApplicant(a.id)} className="p-1 hover:bg-red-100 text-red-600 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredApplicants.length === 0 && (
            <div className="text-center py-12">No applicants found.</div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
