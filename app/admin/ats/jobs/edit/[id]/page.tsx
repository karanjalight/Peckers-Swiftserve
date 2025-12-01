"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save } from "lucide-react";

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    employment_type: "full_time",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
    application_deadline: "",
    status: "draft",
    is_marketed: false,
    smartphone_required: false,
  });

  const employmentTypes = ["full_time", "part_time", "contract", "internship", "temporary", "freelance"];

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || "",
        department: data.department || "",
        location: data.location || "",
        employment_type: data.employment_type || "full_time",
        description: data.description || "",
        requirements: data.requirements || "",
        salary_min: data.salary_min || "",
        salary_max: data.salary_max || "",
        application_deadline: data.application_deadline ? data.application_deadline.split("T")[0] : "",
        status: data.status || "draft",
        is_marketed: data.is_marketed || false,
        smartphone_required: data.smartphone_required || false,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          ...formData,
          salary_min: formData.salary_min ? Number(formData.salary_min) : null,
          salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        })
        .eq("id", id);

      if (error) throw error;
      alert("Job updated successfully ✅");
      router.push("/admin/ats/jobs");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout title="Edit Job">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Job Post</h1>
            <p className="text-slate-600 text-sm">Update the job details below</p>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-300 rounded-xl p-6 space-y-6 ">
          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Job Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Engineering, HR, Sales…"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Remote / Nairobi"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Employment Type</label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700">Job Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe responsibilities, expectations, company, etc..."
              className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-sm font-semibold text-slate-700">Requirements</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={6}
              placeholder="Experience, skills, certifications..."
              className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Salary & Deadline */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Min Salary</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                placeholder="Optional"
                className="mt-1 w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Max Salary</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                placeholder="Optional"
                className="mt-1 w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Application Deadline</label>
              <input
                type="date"
                name="application_deadline"
                value={formData.application_deadline}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid md:grid-cols-3 gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_marketed"
                checked={formData.is_marketed}
                onChange={handleChange}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-sm text-slate-700">Market this job</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="smartphone_required"
                checked={formData.smartphone_required}
                onChange={handleChange}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-sm text-slate-700">Smartphone required</span>
            </label>

            <div>
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
