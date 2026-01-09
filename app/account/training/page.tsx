"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  GraduationCap,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Download,
  IdCard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import AboutHero from "@/components/hero/AboutHero";
import usePaystack from "@/app/hooks/usePaystack";
import { supabase } from "@/lib/supabase";

interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
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
}

interface Enrollment {
  id: string;
  enrollment_status: "pending" | "deposit_paid" | "fully_paid" | "completed" | "cancelled";
  deposit_paid_at: string | null;
  balance_due_date: string | null;
  balance_paid_at: string | null;
  created_at: string;
  training_programs: TrainingProgram;
  payments: TrainingPayment[];
}

interface TrainingPayment {
  id: string;
  payment_type: "deposit" | "balance";
  amount: number;
  status: "pending" | "paid" | "failed";
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function TrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollingProgramId, setEnrollingProgramId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"programs" | "my-enrollments">("programs");

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.push("/login?redirect=/account/training");
        return;
      }

      setUser(authUser);

      // Fetch user profile
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUser({ ...authUser, ...userData });
      }

      // Fetch available programs
      const programsRes = await fetch("/api/training/cohorts");
      const programsData = await programsRes.json();
      if (programsData.success) {
        setPrograms(programsData.programs || []);
      }

      // Fetch user enrollments
      await fetchEnrollments();

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      router.push("/login?redirect=/account/training");
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/training/my-enrollments", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnrollments(data.enrollments || []);
        }
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const handleEnroll = async (programId: string) => {
    if (!user?.email) {
      alert("Please ensure you're logged in with a valid email");
      return;
    }

    setEnrollingProgramId(programId);

    try {
      const response = await fetch("/api/training/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ programId }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to enroll. Please try again.");
        setEnrollingProgramId(null);
        return;
      }

      // Start payment for deposit
      const program = programs.find((p) => p.id === programId);
      if (!program) return;

      const onSuccess = async (paymentResponse: { reference: string }) => {
        console.log("✅ Payment successful:", paymentResponse.reference);

        // Verify payment
        await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: paymentResponse.reference,
            type: "training",
            paymentId: data.payment.id,
          }),
        });

        // Refresh enrollments
        await fetchEnrollments();
        setEnrollingProgramId(null);
        alert("Enrollment successful! Deposit payment received.");
      };

      const onClose = () => {
        console.log("❌ Payment popup closed");
        setEnrollingProgramId(null);
      };

      initializePayment(
        {
          email: user.email,
          amount: data.depositAmount * 100, // Convert to kobo (cents)
          currency: "KES",
          reference: `training_${data.enrollment.id}_${Date.now()}`,
        },
        onSuccess,
        onClose
      );
    } catch (error: any) {
      console.error("Error enrolling:", error);
      alert(error.message || "Failed to enroll. Please try again.");
      setEnrollingProgramId(null);
    }
  };

  const handlePayBalance = async (enrollment: Enrollment) => {
    const program = enrollment.training_programs;
    const balanceAmount = program.total_price - program.deposit_amount;
    const balancePayment = enrollment.payments.find((p) => p.payment_type === "balance" && p.status === "pending");

    if (!balancePayment) {
      // Create balance payment if it doesn't exist
      try {
        const response = await fetch("/api/training/create-balance-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            enrollmentId: enrollment.id,
            amount: balanceAmount,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          alert(data.error || "Failed to create payment. Please try again.");
          return;
        }

        // Start payment with new payment ID
        startBalancePayment(data.payment.id, balanceAmount, enrollment.id);
      } catch (error: any) {
        alert(error.message || "Failed to process payment. Please try again.");
      }
    } else {
      startBalancePayment(balancePayment.id, balanceAmount, enrollment.id);
    }
  };

  const handleDownloadID = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/training/download-id?enrollmentId=${enrollmentId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to download ID card. Please ensure deposit is paid.");
        return;
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Peckers-ID-Card.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error downloading ID card:", error);
      alert("Failed to download ID card. Please try again.");
    }
  };

  const startBalancePayment = (paymentId: string, amount: number, enrollmentId: string) => {
    if (!user?.email) return;

    const onSuccess = async (paymentResponse: { reference: string }) => {
      console.log("✅ Balance payment successful:", paymentResponse.reference);

      await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paymentResponse.reference,
          type: "training",
          paymentId: paymentId,
        }),
      });

      await fetchEnrollments();
      alert("Balance payment successful! Your enrollment is now fully paid.");
    };

    const onClose = () => {
      console.log("❌ Payment popup closed");
    };

    initializePayment(
      {
        email: user.email,
        amount: amount * 100,
        currency: "KES",
        reference: `training_balance_${enrollmentId}_${Date.now()}`,
      },
      onSuccess,
      onClose
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case "fully_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Fully Paid
          </span>
        );
      case "deposit_paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Deposit Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            Pending Deposit
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AboutHero title="Medical Training Program" highlight="Enroll Now" background="/planding3.jpeg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("programs")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "programs"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Available Programs
              </button>
              <button
                onClick={() => setActiveTab("my-enrollments")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "my-enrollments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Enrollments ({enrollments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Available Programs Tab */}
            {activeTab === "programs" && (
              <div className="space-y-6">
                {programs.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No training programs available at the moment.</p>
                    <p className="text-sm text-gray-400 mt-2">Check back later for new cohorts.</p>
                  </div>
                ) : (
                  programs.map((program) => {
                    const isEnrolled = enrollments.some((e) => e.training_programs.id === program.id);
                    const enrollment = enrollments.find((e) => e.training_programs.id === program.id);

                    return (
                      <div
                        key={program.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <GraduationCap className="w-6 h-6 text-blue-600" />
                              <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Cohort {program.cohort_number}
                              </span>
                            </div>
                            {program.description && (
                              <p className="text-gray-600 mt-2">{program.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              <strong>Start:</strong> {formatDate(program.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              <strong>End:</strong> {formatDate(program.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">
                              {program.current_participants}
                              {program.max_participants ? ` / ${program.max_participants}` : ""} participants
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Total Program Price</p>
                              <p className="text-2xl font-bold text-gray-900">
                                KES {program.total_price.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Deposit Required</p>
                              <p className="text-xl font-semibold text-blue-600">
                                KES {program.deposit_amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Balance due in {program.balance_due_days} days
                              </p>
                            </div>
                          </div>
                        </div>

                        {isEnrolled ? (
                          <div className="flex items-center justify-between">
                            {getEnrollmentStatusBadge(enrollment?.enrollment_status || "pending")}
                            <button
                              onClick={() => setActiveTab("my-enrollments")}
                              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                            >
                              View Enrollment <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(program.id)}
                            disabled={enrollingProgramId === program.id}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {enrollingProgramId === program.id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Enroll Now (Pay Deposit KES {program.deposit_amount.toLocaleString()})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* My Enrollments Tab */}
            {activeTab === "my-enrollments" && (
              <div className="space-y-6">
                {enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">You have no enrollments yet.</p>
                    <button
                      onClick={() => setActiveTab("programs")}
                      className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Programs
                    </button>
                  </div>
                ) : (
                  enrollments.map((enrollment) => {
                    const program = enrollment.training_programs;
                    const depositPayment = enrollment.payments.find((p) => p.payment_type === "deposit");
                    const balancePayment = enrollment.payments.find((p) => p.payment_type === "balance");
                    const balanceAmount = program.total_price - program.deposit_amount;
                    const isBalanceDue = enrollment.balance_due_date && new Date(enrollment.balance_due_date) < new Date();

                    return (
                      <div
                        key={enrollment.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <GraduationCap className="w-6 h-6 text-blue-600" />
                              <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                            </div>
                            {getEnrollmentStatusBadge(enrollment.enrollment_status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Payment Details</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Total Price:</span>
                                <span className="font-semibold">KES {program.total_price.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Deposit:</span>
                                <span className={depositPayment?.status === "paid" ? "text-green-600 font-semibold" : ""}>
                                  {depositPayment?.status === "paid" ? "✓ Paid" : "Pending"} - KES {program.deposit_amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Balance:</span>
                                <span className={balancePayment?.status === "paid" ? "text-green-600 font-semibold" : ""}>
                                  {balancePayment?.status === "paid" ? "✓ Paid" : "Pending"} - KES {balanceAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Program Schedule</p>
                            <div className="space-y-2 text-sm">
                              <div>
                                <strong>Start:</strong> {formatDate(program.start_date)}
                              </div>
                              <div>
                                <strong>End:</strong> {formatDate(program.end_date)}
                              </div>
                              {enrollment.balance_due_date && (
                                <div className={isBalanceDue ? "text-red-600 font-semibold" : ""}>
                                  <strong>Balance Due:</strong> {formatDate(enrollment.balance_due_date)}
                                  {isBalanceDue && " (Overdue)"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-3">
                          {/* View Details Button */}
                          <Link
                            href={`/account/training/${enrollment.id}`}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <GraduationCap className="w-4 h-4" />
                            View Enrollment Details
                          </Link>

                          {/* Download ID Card Button - Available after deposit is paid */}
                          {(enrollment.enrollment_status === "deposit_paid" || enrollment.enrollment_status === "fully_paid") && (
                            <button
                              onClick={() => handleDownloadID(enrollment.id)}
                              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download Student ID Card
                            </button>
                          )}

                          {/* Pay Balance Button */}
                          {enrollment.enrollment_status === "deposit_paid" && balancePayment?.status !== "paid" && (
                            <>
                              {isBalanceDue && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center gap-2 text-red-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm font-medium">Balance payment is overdue</p>
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() => handlePayBalance(enrollment)}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                Pay Balance (KES {balanceAmount.toLocaleString()})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

