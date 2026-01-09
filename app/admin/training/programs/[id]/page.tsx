"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Edit, GraduationCap, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

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
  updated_at: string;
}

export default function TrainingProgramDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchProgram();
    } else {
      setError("Invalid program ID");
      setLoading(false);
    }
  }, [id]);

  const fetchProgram = async () => {
    if (!id) {
      setError("Program ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProgram(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch program details");
    } finally {
      setLoading(false);
    }
  };

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
    <SidebarLayout title="Training Program Detail">
      <div className="flex-1 p-6 min-h-screen">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">Loading program details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 text-lg font-medium">{error}</div>
        ) : program ? (
          <div className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.name}</h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Cohort #{program.cohort_number}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        program.is_active,
                        program.is_published
                      )}`}
                    >
                      {getStatusText(program.is_active, program.is_published)}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/admin/training/programs/edit/${program.id}`}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Program
              </Link>
            </div>

            {/* Description */}
            {program.description && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-gray-700 font-semibold mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{program.description}</p>
              </div>
            )}

            {/* Program Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              {/* Pricing */}
              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Total Price</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(program.total_price)}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Deposit Amount</h3>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(program.deposit_amount)}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Balance Due Days</h3>
                <p className="text-gray-600">{program.balance_due_days} days after deposit</p>
              </div>

              {/* Participants */}
              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Participants</h3>
                <p className="text-gray-600">
                  {program.current_participants}
                  {program.max_participants ? ` / ${program.max_participants} max` : " enrolled"}
                </p>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Start Date</h3>
                <p className="text-gray-600">{formatDate(program.start_date)}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">End Date</h3>
                <p className="text-gray-600">{formatDate(program.end_date)}</p>
              </div>

              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Enrollment Deadline</h3>
                <p className="text-gray-600">{formatDate(program.enrollment_deadline)}</p>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-gray-700 font-semibold mb-1">Created</h3>
                <p className="text-gray-600">{formatDate(program.created_at)}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-700 font-semibold mb-2">Program Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${program.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-600">
                        {program.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${program.is_published ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className="text-gray-600">
                        {program.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SidebarLayout>
  );
}

