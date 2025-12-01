"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateJobPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("jobs").insert([
        {
          title: formData.title,
          department: formData.department,
          location: formData.location,
          employment_type: formData.employment_type,
          description: formData.description,
          requirements: formData.requirements,
          salary_min: formData.salary_min
            ? Number(formData.salary_min)
            : null,
          salary_max: formData.salary_max
            ? Number(formData.salary_max)
            : null,
          application_deadline: formData.application_deadline || null,
          status: formData.status,
          is_marketed: formData.is_marketed,
          smartphone_required: formData.smartphone_required,
        },
      ]);

      if (error) throw error;

      alert("Job created successfully ✅");
      router.push("/admin/ats/jobs");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (formData.status) {
      case "published":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <SidebarLayout title="Create Job">
      <div className="p-4 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Create Job Post
            </h1>
            <p className="text-slate-600 text-sm">
              Fill the details to publish a new job
            </p>
          </div>

          <Link
            href="/admin/ats/jobs"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}
          >
            {formData.status.toUpperCase()}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-300 rounded-xl p-6 space-y-6 shadow-sm"
        >
          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Job Title
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Department
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Location
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Employment Type
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part_time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Job Description
            </label>
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
            <label className="text-sm font-semibold text-slate-700">
              Requirements
            </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Min Salary
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Max Salary
              </label>
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
              <label className="text-sm font-semibold text-slate-700">
                Application Deadline
              </label>
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
              <span className="text-sm text-slate-700">
                Market this job
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="smartphone_required"
                checked={formData.smartphone_required}
                onChange={handleChange}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-sm text-slate-700">
                Smartphone required
              </span>
            </label>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>
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
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
