"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  smartphone_required?: boolean;
  is_marketed?: boolean;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchJob();
    } else {
      setError("Invalid job ID");
      setLoading(false);
    }
  }, [id]);

  const fetchJob = async () => {
    if (!id) {
      setError("Job ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SidebarLayout title="Job Detail">
      <div className="flex-1 p-6 min-h-screen">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg font-medium">Loading job details...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 text-lg font-medium">{error}</div>
        ) : job ? (
          <div className=" bg-white rounded-2xl  p-8 space-y-6 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{job.title}</h1>

            {/* Job Info Grid (Display only, like the form layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <h3 className="text-gray-700 font-semibold mb-1">Description</h3>
                <p className="text-gray-600 leading-relaxed">{job.description || "—"}</p>
              </div>

              <div className="col-span-2">
                <h3 className="text-gray-700 font-semibold mb-1">Requirements</h3>
                <p className="text-gray-600 leading-relaxed">{job.requirements || "—"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Location</h3>
                <p className="text-gray-600">{job.location || "—"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Employment Type</h3>
                <p className="text-gray-600">{job.employment_type || "—"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Salary Min</h3>
                <p className="text-gray-600">{job.salary_min ? `Ksh ${job.salary_min.toLocaleString()}` : "—"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Salary Max</h3>
                <p className="text-gray-600">{job.salary_max ? `Ksh ${job.salary_max.toLocaleString()}` : "—"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Application Deadline</h3>
                <p className="text-gray-600">{formatDate(job.application_deadline)}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Smartphone Required</h3>
                <p className="text-gray-600">{job.smartphone_required ? "Yes" : "No"}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Marketed</h3>
                <p className="text-gray-600">{job.is_marketed ? "Yes" : "No"}</p>
              </div>
            </div>

            {/* Edit Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => router.push(`/admin/ats/jobs/edit/${job.id}`)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                Edit Job
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </SidebarLayout>
  );
}
