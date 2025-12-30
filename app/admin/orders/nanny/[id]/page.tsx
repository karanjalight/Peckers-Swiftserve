"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader,
  Users,
  Star,
  Briefcase,
  Check,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarLayout from "@/components/layouts/SidebarLayout";

type ServiceType = "emergency_under_6_hours" | "sunday_day_bug" | "short_term_daily";
type NannyStatus = "available" | "busy" | "on_leave" | "inactive";

interface NannyRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  id_number: string;
  household_description: string | null;
  service_needed: ServiceType;
  start_date: string;
  end_date: string;
  notes: string | null;
  first_aid: boolean | null;
  driving: boolean | null;
  cooking: boolean | null;
  cleaning: boolean | null;
  is_assigned: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
}

interface NannyPayment {
  id: string;
  request_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  mpesa_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Nanny {
  id: string;
  full_name: string;
  phone: string;
  experience_years: number;
  rating: number;
  status: NannyStatus;
  created_at: string;
}

interface NannyAssignment {
  id: string;
  request_id: string;
  nanny_id: string;
  assigned_at: string;
  started_at: string | null;
  ended_at: string | null;
  is_active: boolean;
  nanny: Nanny;
}

interface AtsApplicant {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  years_of_experience: number | null;
  location: string | null;
}

interface CustomerPreferredNanny {
  applicant_id: string;
  applicant: AtsApplicant | null;
}

const SERVICE_TYPES: Record<ServiceType, string> = {
  emergency_under_6_hours: "Emergency Nanny (Under 6 Hours)",
  sunday_day_bug: "Sunday / Day-Bug Nanny",
  short_term_daily: "Short-Term / Daily Nanny",
};

const STATUS_STEPS = [
  { key: "pending", label: "Pending", icon: Clock, color: "yellow" },
  { key: "assigned", label: "Assigned", icon: Users, color: "blue" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "green" },
];

export default function NannyRequestDetail() {
  const router = useRouter();
  const [request, setRequest] = useState<NannyRequest | null>(null);
  const [payment, setPayment] = useState<NannyPayment | null>(null);
  const [nannies, setNannies] = useState<Nanny[]>([]);
  const [assignment, setAssignment] = useState<NannyAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assigningNanny, setAssigningNanny] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedNannyId, setSelectedNannyId] = useState("");
  const [showNannyDropdown, setShowNannyDropdown] = useState(false);
  const [preferredNanny, setPreferredNanny] = useState<CustomerPreferredNanny | null>(null);
  const params = useParams();
  const id = params?.id as string;


  const [quoteForm, setQuoteForm] = useState({
    amount: "",
    duration_hours: "",
    hourly_rate: "",
    notes: "",
  });

  // Fetch request details
  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch nanny request
      const { data: reqData, error: reqError } = await supabase
        .from("nanny_requests")
        .select("*")
        .eq("id", params.id)
        .single();

      if (reqError) throw reqError;
      setRequest(reqData);

      // Fetch payment if exists
      const { data: payData } = await supabase
        .from("nanny_payments")
        .select("*")
        .eq("request_id", params.id)
        .single();

      if (payData) {
        setPayment(payData);
        setQuoteForm((prev) => ({
          ...prev,
          amount: payData.amount.toString(),
        }));
      }

      // Fetch nannies
      const { data: nanniesData, error: nanniesError } = await supabase
        .from("nannies")
        .select("*")
        .order("rating", { ascending: false });

      if (nanniesError) throw nanniesError;
      setNannies(nanniesData || []);

      // Fetch assignment if exists
      const { data: assignData } = await supabase
        .from("nanny_assignments")
        .select("*, nanny:nanny_id(*)")
        .eq("request_id", params.id)
        .eq("is_active", true)
        .single();

      if (assignData) {
        setAssignment(assignData);
        setSelectedNannyId(assignData.nanny_id);
      }

      // Fetch customer preferred nanny from ATS (if any)
      const { data: selection } = await supabase
        .from("nanny_customer_selections")
        .select("applicant_id")
        .eq("nanny_request_id", params.id)
        .maybeSingle();

      if (selection?.applicant_id) {
        const { data: applicant } = await supabase
          .from("applicants")
          .select(
            "id, first_name, last_name, phone, email, years_of_experience, location"
          )
          .eq("id", selection.applicant_id)
          .maybeSingle();

        setPreferredNanny({
          applicant_id: selection.applicant_id,
          applicant: applicant || null,
        });
      } else {
        setPreferredNanny(null);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      setError("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (field: string, value: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("nanny_requests")
        .update({ [field]: value })
        .eq("id", params.id);

      if (updateError) throw updateError;
      setRequest((prev) => prev ? { ...prev, [field]: value } : null);
      
      // If marking as completed, activate the applicant
      if (field === "is_completed" && value === true) {
        // Find the applicant linked to this request
        const { data: selection } = await supabase
          .from("nanny_customer_selections")
          .select("applicant_id")
          .eq("nanny_request_id", params.id)
          .maybeSingle();

        if (selection?.applicant_id) {
          // Set applicant active = true
          const { error: applicantError } = await supabase
            .from("applicants")
            .update({ active: true })
            .eq("id", selection.applicant_id);

          if (applicantError) {
            console.error("Error updating applicant:", applicantError);
          }
        }

        // Also update nanny status if assigned
        if (assignment?.nanny_id) {
          const { error: nannyError } = await supabase
            .from("nannies")
            .update({ status: "available" })
            .eq("id", assignment.nanny_id);

          if (nannyError) {
            console.error("Error updating nanny status:", nannyError);
          }
        }
      }
      
      setSuccessMessage("Status updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  // Assign nanny
  const handleAssignNanny = async () => {
    if (!selectedNannyId) {
      alert("Please select a nanny");
      return;
    }

    setAssigningNanny(true);
    try {
      // If there's an existing assignment, deactivate it
      if (assignment) {
        await supabase
          .from("nanny_assignments")
          .update({ is_active: false })
          .eq("id", assignment.id);
      }

      // Create new assignment
      const { data: newAssignment, error: assignError } = await supabase
        .from("nanny_assignments")
        .insert({
          request_id: params.id,
          nanny_id: selectedNannyId,
        })
        .select("*, nanny:nanny_id(*)")
        .single();

      if (assignError) throw assignError;
      setAssignment(newAssignment);

      // Update request is_assigned flag
      await updateRequestStatus("is_assigned", true);

      setSuccessMessage("Nanny assigned successfully!");
      setShowNannyDropdown(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error assigning nanny:", err);
      alert("Failed to assign nanny");
    } finally {
      setAssigningNanny(false);
    }
  };

  // Handle quote submission
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");

    try {
      const amount = parseFloat(quoteForm.amount);
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        setSubmitting(false);
        return;
      }

      if (payment) {
        const { error: updateError } = await supabase
          .from("nanny_payments")
          .update({
            amount,
          })
          .eq("id", payment.id);

        if (updateError) throw updateError;
      } else {
        const { data: newPayment, error: createError } = await supabase
          .from("nanny_payments")
          .insert({
            request_id: params.id,
            amount,
            status: "pending",
          })
          .select()
          .single();

        if (createError) throw createError;
        setPayment(newPayment);
      }

      // Track notification results
      let smsSent = false;
      const notifications: string[] = [];

      // Send SMS to customer
      if (request?.phone) {
        try {
          // Simple message format without links
          const message = `Hello ${request.full_name.toUpperCase()}, your nanny service quote is ready! Amount: Ksh ${amount.toLocaleString()}. Thank you!`;

          const smsResponse = await fetch("/api/send-sms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: request.phone,
              message: message,
            }),
          });

          const smsData = await smsResponse.json();
          
          if (smsData.success) {
            smsSent = true;
            notifications.push("SMS");
          } else {
            console.error("SMS sending failed:", smsData.error);
          }
        } catch (smsError) {
          console.error("Error sending SMS:", smsError);
        }
      }

      // Set success message based on what was sent
      if (notifications.length > 0) {
        setSuccessMessage(`Quote sent successfully! SMS notification sent to customer.`);
      } else {
        setSuccessMessage("Quote saved successfully!");
      }

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error submitting quote:", err);
      alert("Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCurrentStatus = () => {
    if (request?.is_cancelled) return "cancelled";
    if (request?.is_completed) return "completed";
    if (request?.is_assigned) return "assigned";
    return "pending";
  };

  const calculateDays = () => {
    if (!request) return 0;
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusColor = (status: NannyStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "busy":
        return "bg-blue-100 text-blue-700";
      case "on_leave":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  // Refresh data periodically and on window focus to catch payment updates
  useEffect(() => {
    if (!params.id) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!loading) {
        fetchDetails();
      }
    }, 10000); // Refresh every 10 seconds

    const handleFocus = () => {
      // Refresh when window gains focus
      if (!loading) {
        fetchDetails();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-slate-600 mb-6">{error || "Request not found"}</p>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const days = calculateDays();
  const currentStatus = getCurrentStatus();

  return (
    <SidebarLayout title="Nanny Requests">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Requests</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Card */}
          <div className="bg-white rounded border border-gray-300 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{request.full_name}</h1>
                <p className="text-slate-600 mt-2">{SERVICE_TYPES[request.service_needed]}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Phone</p>
                  <p className="text-slate-900 font-semibold">{request.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Email</p>
                  <p className="text-slate-900 font-semibold">{request.email || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Location</p>
                  <p className="text-slate-900 font-semibold">{request.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">ID Number</p>
                  <p className="text-slate-900 font-semibold">{request.id_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded border border-gray-300 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Request Status</h2>

            <div className="flex items-center justify-between mb-8">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = STATUS_STEPS.findIndex((s) => s.key === currentStatus) >= idx;
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all ${
                          isActive
                            ? `bg-${step.color}-100`
                            : "bg-gray-100"
                        }`}
                      >
                        <StepIcon
                          className={`w-8 h-8 ${
                            isActive ? `text-${step.color}-600` : "text-gray-400"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>

                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 ${
                          isActive ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {!request.is_cancelled && (
              <div className="grid grid-cols-3 gap-4">
                {!request.is_completed && (
                  <>
                    <button
                      onClick={() => updateRequestStatus("is_assigned", !request.is_assigned)}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${
                        request.is_assigned
                          ? "bg-blue-900 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-slate-700 hover:bg-gray-200"
                      }`}
                    >
                      {request.is_assigned ? "✓ Assigned" : "Mark Assigned"}
                    </button>

                    <button
                      onClick={() => updateRequestStatus("is_completed", true)}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      Complete
                    </button>
                  </>
                )}

                <button
                  onClick={() => updateRequestStatus("is_cancelled", true)}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="bg-white rounded border border-gray-300 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Details</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                <Calendar className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 font-medium mb-2">Duration</p>
                  <div className="space-y-2">
                    <p className="text-slate-900 font-semibold">
                      {formatDate(request.start_date)} → {formatDate(request.end_date)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {days} day{days !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {request.household_description && (
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <User className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-2">Household Info</p>
                    <p className="text-slate-900 font-semibold">{request.household_description}</p>
                  </div>
                </div>
              )}

              {(request.first_aid || request.driving || request.cooking || request.cleaning) && (
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <Briefcase className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-3">Extra Skills Required</p>
                    <div className="flex flex-wrap gap-2">
                      {request.first_aid && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          First Aid
                        </span>
                      )}
                      {request.driving && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Driving
                        </span>
                      )}
                      {request.cooking && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Cooking
                        </span>
                      )}
                      {request.cleaning && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Cleaning
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="flex items-start gap-4">
                  <FileText className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-2">Client Notes</p>
                    <p className="text-slate-900">{request.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Preferred Nanny from ATS */}
          {preferredNanny && preferredNanny.applicant && (
            <div className="bg-white rounded border border-purple-300 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-700" />
                Customer Preferred Nanny (ATS)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Selected by the customer on the booking success page. Use this as a guide when assigning an internal nanny.
              </p>
              <div className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-slate-500 font-medium mb-1">
                  Name
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {preferredNanny.applicant.first_name}{" "}
                  {preferredNanny.applicant.last_name}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  {preferredNanny.applicant.location || "Location on file"}
                  {preferredNanny.applicant.years_of_experience != null && (
                    <>
                      {" "}
                      • {preferredNanny.applicant.years_of_experience} yrs
                      experience
                    </>
                  )}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Phone: {preferredNanny.applicant.phone}
                  {preferredNanny.applicant.email && (
                    <> • Email: {preferredNanny.applicant.email}</>
                  )}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <Star className="w-3 h-3 text-emerald-600" />
                  <span>ATS status: hired nanny</span>
                </div>
              </div>
            </div>
          )}
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Payment Status Card */}
          {payment && (
            <div className="bg-white rounded border border-gray-300 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-900" />
                <h3 className="text-lg font-bold text-slate-900">Payment Status</h3>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600 mb-1">Quote Amount</p>
                <p className="text-3xl font-bold text-slate-900">
                  Ksh {payment.amount.toLocaleString()}
                </p>
              </div>

              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  payment.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : payment.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {payment.status === "paid" ? "Paid" : payment.status === "failed" ? "Failed" : "Pending"}
              </div>
              
              {payment.status === "paid" && payment.paid_at && (
                <div className="mt-3 text-sm text-slate-600">
                  <p><strong>Paid At:</strong> {new Date(payment.paid_at).toLocaleString()}</p>
                  {payment.mpesa_reference && (
                    <p><strong>Reference:</strong> {payment.mpesa_reference}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Assign Nanny Card */}
          <div className="bg-white hidden rounded border border-gray-300 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assign Nanny
            </h3>

            {assignment && (
              <div className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-xl p-4 mb-4 border border-purple-200">
                <p className="text-xs text-slate-600 mb-2">Assigned Nanny</p>
                <p className="text-lg font-bold text-slate-900">{assignment.nanny.full_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    {assignment.nanny.rating} ({assignment.nanny.experience_years}y exp)
                  </span>
                </div>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowNannyDropdown(!showNannyDropdown)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-left font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-between"
              >
                <span>
                  {selectedNannyId
                    ? nannies.find((n) => n.id === selectedNannyId)?.full_name
                    : "Select nanny"}
                </span>
                <span className="text-slate-400">▼</span>
              </button>

              {showNannyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {nannies.map((nanny) => (
                    <button
                      key={nanny.id}
                      onClick={() => {
                        setSelectedNannyId(nanny.id);
                        setShowNannyDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{nanny.full_name}</p>
                          <p className="text-xs text-slate-500">
                            {nanny.experience_years}y exp • {nanny.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">{nanny.rating}</span>
                        </div>
                      </div>
                      <div className={`mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusColor(nanny.status)}`}>
                        {nanny.status}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleAssignNanny}
              disabled={assigningNanny || !selectedNannyId}
              className="w-full mt-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {assigningNanny ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Assign Nanny
                </>
              )}
            </button>
          </div>

          {/* Quote Form */}
          <div className="bg-white rounded border border-gray-300 p-6 sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Send Quote</h3>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quote Amount (Ksh) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.amount}
                    onChange={(e) =>
                      setQuoteForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
              </div>

              

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={quoteForm.notes}
                  onChange={(e) =>
                    setQuoteForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any special terms or conditions..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Sending..." : "Send Quote"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </SidebarLayout>
  );
}