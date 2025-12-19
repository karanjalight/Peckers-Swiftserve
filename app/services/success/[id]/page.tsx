"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  Loader,
  AlertCircle,
  DollarSign,
  LogIn,
  UserPlus,
  Sparkles,
  Baby,
  Star,
  User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/AboutHero";
import Footer from "@/components/landing/Footer";
import usePaystack from "@/app/hooks/usePaystack";

interface HiredNannyApplication {
  id: string;
  status: string;
  applicant_id: string;
  applicants: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    years_of_experience: number | null;
    location: string | null;
  };
  jobs: {
    id: string;
    title: string;
    location: string | null;
  } | null;
}

const requestTableIsNanny = (type: string) => type !== "security";

export default function SuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;
  const requestType = (searchParams?.get("type") as string | null) || "nanny"; // default to nanny

  const [request, setRequest] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hiredNannies, setHiredNannies] = useState<HiredNannyApplication[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(
    null
  );
  const [savingSelection, setSavingSelection] = useState(false);
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  const fetchData = async (options?: { silent?: boolean }) => {
    if (!id) {
      setError("Request ID is required");
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const isSecurity = requestType === "security";
      const requestTable = isSecurity ? "security_requests" : "nanny_requests";
      const paymentTable = isSecurity ? "security_payments" : "nanny_payments";

      // Fetch request
      const { data: reqData, error: reqError } = await supabase
        .from(requestTable)
        .select("*")
        .eq("id", id)
        .single();

      if (reqError) {
        // Try the other table if first fails (for backward compatibility)
        if (!isSecurity) {
          const { data: secData, error: secError } = await supabase
            .from("security_requests")
            .select("*")
            .eq("id", id)
            .single();

          if (!secError && secData) {
            setRequest(secData);
            // Fetch security payment
            const { data: payData } = await supabase
              .from("security_payments")
              .select("*")
              .eq("request_id", id)
              .single();
            setPayment(payData || null);
            setLoading(false);
            return;
          }
        }
        throw reqError;
      }
      setRequest(reqData);

      // Fetch payment
      const { data: payData, error: payError } = await supabase
        .from(paymentTable)
        .select("*")
        .eq("request_id", id)
        .single();

      if (payError && (payError as any).code !== "PGRST116") throw payError; // ignore "no rows"
      setPayment(payData || null);

      // For nanny requests, also fetch available hired nannies from ATS + any existing selection
      if (!isSecurity) {
        // Existing selection (if any)
        const { data: existingSelection } = await supabase
          .from("nanny_customer_selections")
          .select("applicant_id")
          .eq("nanny_request_id", id)
          .maybeSingle();

        if (existingSelection?.applicant_id) {
          setSelectedApplicantId(existingSelection.applicant_id);
          setSelectionSaved(true);
        } else {
          setSelectionSaved(false);
        }

        // Hired nanny applications whose job title is Nanny
        const { data: nannyApps, error: nannyError } = await supabase
          .from("job_applications")
          .select(
            `
              id,
              status,
              applicant_id,
              applicants:applicant_id (
                id,
                first_name,
                last_name,
                phone,
                email,
                years_of_experience,
                location
              ),
              jobs:job_id (
                id,
                title,
                location
              )
            `
          )
          .eq("status", "hired")
          .ilike("jobs.title", "%nanny%")
          .order("applied_at", { ascending: false });

        if (nannyError) {
          console.error("Error loading hired nannies from ATS:", nannyError);
        } else {
          setHiredNannies(
            ((nannyApps || []) as unknown) as HiredNannyApplication[]
          );
        }
      } else {
        setHiredNannies([]);
        setSelectedApplicantId(null);
        setSelectionSaved(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load your payment details.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await checkAuth();
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Lightweight auto-refresh to keep quote/payment up to date without full page refresh
  useEffect(() => {
    if (!id) return;

    // Stop auto-refresh once payment is confirmed
    if (payment && payment.status === "paid") {
      setIsAutoRefreshing(false);
      return;
    }

    setIsAutoRefreshing(true);

    const intervalId = setInterval(() => {
      void fetchData({ silent: true });
    }, 8000); // refresh every 8 seconds

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, requestType, payment?.status]);

  const handlePayment = () => {
    if (!payment || !request) {
      alert("Payment information not available");
      return;
    }

    if (payment.status === "paid") {
      alert("This payment has already been completed.");
      return;
    }

    if (!request.email) {
      alert("Email is required for payment. Please contact support.");
      return;
    }

    setProcessingPayment(true);

    const onSuccess = async (response: { reference: string }) => {
      console.log("✅ Payment successful:", response.reference);

      try {
        // Verify payment with backend
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: response.reference,
            requestId: id,
            type: requestType,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          // Payment verified and updated by API route
          setPaymentSuccess(true);
          // Refresh payment data to get updated status
          await fetchData();
        } else {
          throw new Error("Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        alert("Payment verification failed. Please contact support.");
      } finally {
        setProcessingPayment(false);
      }
    };

    const onClose = () => {
      console.log("❌ Payment popup closed");
      setProcessingPayment(false);
    };

    // Initialize Paystack payment
    initializePayment(
      {
        email: request.email,
        amount: Math.round(parseFloat(payment.amount) * 100), // Convert to kobo
        currency: "KES",
        reference: `${requestType}_${id}_${Date.now()}`,
      },
      onSuccess,
      onClose
    );
  };

  const handleSaveNannySelection = async () => {
    if (!id || !selectedApplicantId) {
      alert("Please select a nanny before confirming.");
      return;
    }

    setSavingSelection(true);
    try {
      const { error: upsertError } = await supabase
        .from("nanny_customer_selections")
        .upsert(
          {
            nanny_request_id: id,
            applicant_id: selectedApplicantId,
          },
          {
            onConflict: "nanny_request_id",
          }
        );

      if (upsertError) throw upsertError;

      setSelectionSaved(true);
      alert(
        "Your preferred nanny selection has been saved. Our team will confirm availability and share a quote."
      );
    } catch (err) {
      console.error("Error saving nanny selection:", err);
      alert(
        "Failed to save your nanny selection. Please try again or contact support."
      );
    } finally {
      setSavingSelection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-slate-600 mb-4">
          {error || "Request not found."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <AboutHero
        title="Success"
        highlight="Booking Confirmed"
        background="/planding3.jpeg"
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top success header */}
        <section className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  Booking Successful
                </h1>
                <p className="text-slate-600 mt-1">
                  Thank you for making a booking. Your request has been received and
                  our team is reviewing the details.
                </p>
              </div>
            </div>
            {payment && (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Payment Status
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : payment.status === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      payment.status === "paid"
                        ? "bg-emerald-500"
                        : payment.status === "pending"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  {payment.status === "paid"
                    ? "Paid"
                    : payment.status === "pending"
                    ? "Pending"
                    : "Failed"}
                </span>
                {isAutoRefreshing && payment.status === "pending" && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader className="w-3 h-3 animate-spin" />
                    Updating quote in real-time
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Main two-column layout */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)] gap-8 items-start">
          {/* Left column: request + nanny + account */}
          <div className="space-y-6">
            {/* Request Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Request Details
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-4">
                Summary of the service you requested
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-900">
                    {request.full_name}
                  </dd>
                </div>
                {request.service_needed && (
                  <div>
                    <dt className="text-slate-500">Service</dt>
                    <dd className="font-medium text-slate-900">
                      {request.service_needed}
                    </dd>
                  </div>
                )}
                {request.dog_option && (
                  <div>
                    <dt className="text-slate-500">Security Package</dt>
                    <dd className="font-medium text-slate-900">
                      {request.dog_option === "one_dog_one_handler"
                        ? "1 Dog + Handler"
                        : request.dog_option === "two_dogs_two_handlers"
                        ? "2 Dogs + Handlers"
                        : "3+ Dogs"}
                    </dd>
                  </div>
                )}
                {request.reason && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Reason</dt>
                    <dd className="font-medium text-slate-900">
                      {request.reason}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-900">
                    {request.location}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Nanny Selection (for nanny requests) */}
            {requestTableIsNanny(requestType) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Baby className="w-5 h-5 text-pink-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Choose Your Preferred Nanny
                  </h2>
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                  Curated from our ATS-approved, hired nannies
                </p>
                <p className="text-sm text-slate-600">
                  Browse through our vetted{" "}
                  <span className="font-semibold">
                    ATS-approved nannies (status: hired)
                  </span>{" "}
                  and pick who you feel is the best fit. We&apos;ll confirm
                  availability and finalize your quote on our side.
                </p>

                {hiredNannies.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-4">
                    We&apos;re currently finalizing nanny assignments for this
                    service. Our team will reach out shortly with available
                    options and a confirmed quote.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                    {hiredNannies.map((app) => {
                      const applicant = app.applicants;
                      const fullName = `${applicant.first_name} ${applicant.last_name}`;
                      const jobLocation =
                        app.jobs?.location ||
                        applicant.location ||
                        "Location on file";
                      const jobTitle = app.jobs?.title || "Nanny";
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedApplicantId(applicant.id)}
                          className={`w-full text-left border rounded-xl px-4 py-3 flex items-start gap-3 transition ${
                            selectedApplicantId === applicant.id
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="mt-1">
                            <input
                              type="radio"
                              className="h-4 w-4 text-blue-600"
                              checked={selectedApplicantId === applicant.id}
                              onChange={() =>
                                setSelectedApplicantId(applicant.id)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <p className="font-semibold text-slate-900">
                                {fullName}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {jobLocation}{" "}
                              •{" "}
                              {applicant.years_of_experience != null
                                ? `${applicant.years_of_experience} yrs experience`
                                : "Experience on file"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Phone: {applicant.phone}
                              {applicant.email && (
                                <> • Email: {applicant.email}</>
                              )}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-700 bg-emerald-50 inline-flex px-2 py-1 rounded-full">
                              <Star className="w-3 h-3 text-emerald-600" />
                              <span>
                                ATS Status: Hired ({jobTitle})
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    You can change your selection until we confirm your booking
                    and send a final quote.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveNannySelection}
                    disabled={
                      !selectedApplicantId ||
                      savingSelection ||
                      hiredNannies.length === 0
                    }
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingSelection ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : selectionSaved ? (
                      "Update Selection"
                    ) : (
                      "Confirm Selection"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Account & booking guidance blocks */}
            <div className="space-y-4">
              {/* Account Creation Prompt - Show if not authenticated */}
              {!checkingAuth && !isAuthenticated && (
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Create Your Account
                      </h3>
                      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        Track all your bookings, view payment history, and
                        manage your services in one place. We&apos;ll
                        automatically link this request to your account.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() =>
                            router.push(
                              `/signup?email=${encodeURIComponent(
                                request?.email || ""
                              )}&phone=${encodeURIComponent(
                                request?.phone || ""
                              )}&redirect=/services/success/${id}?type=${requestType}`
                            )
                          }
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-medium"
                        >
                          <UserPlus className="w-5 h-5" />
                          Create Free Account
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/login?redirect=/services/success/${id}?type=${requestType}`
                            )
                          }
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
                        >
                          <LogIn className="w-5 h-5" />
                          Already have an account?
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If authenticated, show account link */}
              {!checkingAuth && isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <p className="text-blue-900 font-medium">
                        You&apos;re logged in!
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/account")}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View My Account →
                    </button>
                  </div>
                </div>
              )}

              {/* If payment is paid, guidance blocks */}
              {payment &&
                payment.status === "paid" &&
                !paymentSuccess &&
                !isAuthenticated && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-green-900 mb-2">
                            Payment Completed
                          </h3>
                          <p className="text-sm text-green-800 mb-4">
                            Your payment has been received. Create an account to
                            track your order and manage all your bookings.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/signup?email=${encodeURIComponent(
                                    request?.email || ""
                                  )}&phone=${encodeURIComponent(
                                    request?.phone || ""
                                  )}&redirect=/account`
                                )
                              }
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <UserPlus className="w-4 h-4" />
                              Create Account
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/login?redirect=/account`)
                              }
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition"
                            >
                              <LogIn className="w-4 h-4" />
                              Login
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {payment &&
                payment.status === "paid" &&
                !paymentSuccess &&
                isAuthenticated && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-green-900 mb-2">
                            Payment Completed
                          </h3>
                          <p className="text-sm text-green-800 mb-4">
                            Your payment has been received. View all your
                            bookings in your account dashboard.
                          </p>
                          <button
                            onClick={() => router.push("/account")}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            <User className="w-4 h-4" />
                            Go to My Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* If no payment yet, show home + account CTA */}
              {!payment && (
                <div className="space-y-3">
                  {!isAuthenticated && (
                    <button
                      onClick={() =>
                        router.push(
                          `/signup?email=${encodeURIComponent(
                            request?.email || ""
                          )}&phone=${encodeURIComponent(
                            request?.phone || ""
                          )}&redirect=/services/success/${id}?type=${requestType}`
                        )
                      }
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-md font-medium"
                    >
                      Create Account to Track This Request
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition"
                  >
                    Go Home
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column: dedicated payment section */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Payment Summary
                  </p>
                  <h2 className="text-xl font-semibold mt-1">
                    Secure Online Payment
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {payment ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs text-slate-300 mb-1">
                      Total Amount
                    </p>
                    <p className="text-3xl font-semibold">
                      KES {parseFloat(payment.amount).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-200">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-300">Status</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                            : payment.status === "pending"
                            ? "bg-amber-500/15 text-amber-200 border border-amber-400/40"
                            : "bg-red-500/15 text-red-200 border border-red-400/40"
                        }`}
                      >
                        {payment.status === "paid"
                          ? "Paid"
                          : payment.status === "pending"
                          ? "Pending"
                          : "Failed"}
                      </span>
                    </p>
                    {payment.mpesa_reference && (
                      <p className="flex items-center justify-between">
                        <span className="text-slate-300">M-Pesa Ref</span>
                        <span className="font-mono text-xs">
                          {payment.mpesa_reference}
                        </span>
                      </p>
                    )}
                    {payment.paid_at && (
                      <p className="flex items-center justify-between">
                        <span className="text-slate-300">Paid At</span>
                        <span className="text-xs">
                          {new Date(payment.paid_at).toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Payment CTA */}
                  {payment.status === "pending" && !paymentSuccess && (
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="w-full mt-5 py-3 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        "Pay Securely with Paystack"
                      )}
                    </button>
                  )}

                  {payment.status === "paid" && (
                    <p className="mt-4 text-xs text-emerald-200">
                      Your payment is complete. A confirmation has been sent to
                      your email, and our team is finalizing your booking.
                    </p>
                  )}

                  {payment.status !== "paid" && isAutoRefreshing && (
                    <p className="mt-3 text-[11px] text-slate-300 flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                      Monitoring your payment and quote in real-time.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-200 mt-2">
                    Your quote is being prepared. You&apos;ll see your payment
                    details here as soon as they&apos;re ready—no refresh
                    needed.
                  </p>
                  {isAutoRefreshing && (
                    <p className="mt-4 text-[11px] text-slate-300 flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                      Checking for your quote and payment details...
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Payment Success Message */}
            {paymentSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-1">
                      Payment Successful
                    </h3>
                    <p className="text-sm text-green-800 mb-4">
                      Your payment has been processed successfully. To track
                      your order and manage your bookings, please log in to your
                      account.
                    </p>
                    <button
                      onClick={() => router.push("/login")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      <LogIn className="w-4 h-4" />
                      Login to Your Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Global home CTA */}
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-white text-slate-800 rounded-2xl border border-slate-200 hover:bg-slate-100 transition text-sm font-medium"
            >
              Return to Home
            </button>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}


