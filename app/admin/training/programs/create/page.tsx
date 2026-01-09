"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateTrainingProgramPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cohort_number: "",
    total_price: "",
    deposit_amount: "3000",
    balance_due_days: "14",
    start_date: "",
    end_date: "",
    enrollment_deadline: "",
    max_participants: "",
    is_active: true,
    is_published: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      const insertData: any = {
        name: formData.name,
        description: formData.description || null,
        cohort_number: parseInt(formData.cohort_number),
        total_price: parseFloat(formData.total_price),
        deposit_amount: parseFloat(formData.deposit_amount),
        balance_due_days: parseInt(formData.balance_due_days),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        enrollment_deadline: formData.enrollment_deadline || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        is_active: formData.is_active,
        is_published: formData.is_published,
      };

      const { error } = await supabase.from("training_programs").insert([insertData]);

      if (error) throw error;

      alert("Training program created successfully ✅");
      router.push("/admin/training/programs");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create training program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout title="Create Training Program">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Training Program</h1>
            <p className="text-slate-600 text-sm">Fill the details to create a new training program</p>
          </div>

          <Link
            href="/admin/training/programs"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-300 rounded-xl p-6 space-y-6 shadow-sm"
        >
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Program Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Graduate Medical Representative Training"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Cohort Number *</label>
              <input
                type="number"
                name="cohort_number"
                required
                value={formData.cohort_number}
                onChange={handleChange}
                placeholder="1, 2, 3..."
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Max Participants</label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                placeholder="Optional"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Program description, objectives, curriculum overview..."
              className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Total Price (Ksh) *</label>
              <input
                type="number"
                name="total_price"
                required
                value={formData.total_price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Deposit Amount (Ksh) *</label>
              <input
                type="number"
                name="deposit_amount"
                required
                value={formData.deposit_amount}
                onChange={handleChange}
                placeholder="3000"
                step="0.01"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Balance Due Days *</label>
              <input
                type="number"
                name="balance_due_days"
                required
                value={formData.balance_due_days}
                onChange={handleChange}
                placeholder="14"
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Enrollment Deadline</label>
              <input
                type="date"
                name="enrollment_deadline"
                value={formData.enrollment_deadline}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid md:grid-cols-2 gap-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-sm text-slate-700">Active (accepting enrollments)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-sm text-slate-700">Published (visible to users)</span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              <Save className="w-4 h-4" />
              {loading ? "Creating..." : "Create Training Program"}
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}

