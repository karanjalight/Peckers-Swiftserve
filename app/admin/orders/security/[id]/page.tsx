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
  Shield,
  Check,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SidebarLayout from "@/components/layouts/SidebarLayout";

type SecurityDogOption = "one_dog_one_handler" | "two_dogs_two_handlers" | "three_plus";
type SecurityReason = "travel_vacation" | "night_shift" | "house_help_exit" | "construction_period" | "high_risk_period" | "other";

interface SecurityRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  id_number: string;
  start_date: string;
  end_date: string;
  dog_option: SecurityDogOption | null;
  reason: SecurityReason | null;
  notes: string | null;
  is_paid: boolean;
  is_assigned: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

interface SecurityPayment {
  id: string;
  request_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  mpesa_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

const DOG_OPTIONS: Record<SecurityDogOption, string> = {
  one_dog_one_handler: "1 Dog + Handler",
  two_dogs_two_handlers: "2 Dogs + Handlers",
  three_plus: "3+ Dogs",
};

const REASONS: Record<SecurityReason, string> = {
  travel_vacation: "Travel / Vacation",
  night_shift: "Night Shift Work",
  house_help_exit: "House Help Exited",
  construction_period: "Construction / Renovation",
  high_risk_period: "High-Risk Period",
  other: "Other",
};

const STATUS_STEPS = [
  { key: "pending", label: "Pending", icon: Clock, color: "yellow" },
  { key: "assigned", label: "Assigned", icon: Users, color: "blue" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "green" },
];

export default function SecurityRequestDetail() {
  const router = useRouter();
  const [request, setRequest] = useState<SecurityRequest | null>(null);
  const [payment, setPayment] = useState<SecurityPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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
      // Fetch security request
      const { data: reqData, error: reqError } = await supabase
        .from("security_requests")
        .select("*")
        .eq("id", params.id)
        .single();

      if (reqError) throw reqError;
      setRequest(reqData);

      // Fetch payment if exists
      const { data: payData } = await supabase
        .from("security_payments")
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
        .from("security_requests")
        .update({ [field]: value })
        .eq("id", params.id);

      if (updateError) throw updateError;
      setRequest((prev) => prev ? { ...prev, [field]: value } : null);
      setSuccessMessage("Status updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
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
          .from("security_payments")
          .update({
            amount,
          })
          .eq("id", payment.id);

        if (updateError) throw updateError;
      } else {
        const { data: newPayment, error: createError } = await supabase
          .from("security_payments")
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

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const paymentLink = `${baseUrl}/services/success/${params.id}?type=security`;
      
      // Track notification results
      let smsSent = false;
      let emailSent = false;
      const notifications: string[] = [];

      // Send SMS to customer
      if (request?.phone) {
        try {
          const message = `Hello ${request.full_name}, your security service quote is ready! Amount: Ksh ${amount.toLocaleString()}. Click this link to pay: ${paymentLink}`;

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

      // Send Email to customer
      if (request?.email) {
        try {
          const dogOptionText = request.dog_option ? DOG_OPTIONS[request.dog_option] : "Not specified";
          const reasonText = request.reason ? REASONS[request.reason] : "Not specified";
          
          const emailHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <title>Security Service Quote - Peckers Swiftserve</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; line-height: 1.6; color: #333333;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background-color: #667eea; padding: 30px 20px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Peckers Swiftserve</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 30px 20px;">
                          <h2 style="margin: 0 0 20px 0; color: #667eea; font-size: 20px; font-weight: 600;">Hello ${request.full_name},</h2>
                          
                          <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Your security service quote is ready!</p>
                          
                          <!-- Service Details -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-left: 4px solid #667eea; margin: 20px 0; padding: 20px;">
                            <tr>
                              <td style="padding: 15px;">
                                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">Service Details</h3>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">Service Type:</strong> Security Service</p>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">Dog Option:</strong> ${dogOptionText}</p>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">Reason:</strong> ${reasonText}</p>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">Start Date:</strong> ${formatDate(request.start_date)}</p>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">End Date:</strong> ${formatDate(request.end_date)}</p>
                                <p style="margin: 8px 0; font-size: 14px; color: #555555;"><strong style="color: #333333;">Location:</strong> ${request.location}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Amount -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="margin: 0 0 10px 0; color: #856404; font-size: 18px; font-weight: 600;">Quotation Amount</h3>
                                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #856404;">Ksh ${amount.toLocaleString()}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Payment Button -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                            <tr>
                              <td align="center" style="padding: 10px 0;">
                                <a href="${paymentLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 5px; font-weight: 600; font-size: 16px; text-align: center;">Pay Now</a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Payment Link -->
                          <p style="margin: 20px 0 0 0; font-size: 14px; color: #666666; line-height: 1.8;">
                            Or copy and paste this link into your browser:<br>
                            <span style="word-break: break-all; color: #667eea;">${paymentLink}</span>
                          </p>
                          
                          <!-- Footer -->
                          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                          <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.6;">
                            If you have any questions, please contact us at your convenience.<br>
                            Thank you for choosing Peckers Swiftserve!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: request.email,
              subject: `Your Security Service Quote - Ksh ${amount.toLocaleString()}`,
              html: emailHtml,
              customerName: request.full_name,
              amount: amount,
              paymentLink: paymentLink,
              serviceType: "security",
            }),
          });

          const emailData = await emailResponse.json();
          
          if (emailData.success) {
            emailSent = true;
            notifications.push("Email");
          } else {
            console.error("Email sending failed:", emailData.error);
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }

      // Set success message based on what was sent
      if (notifications.length > 0) {
        setSuccessMessage(`Quote sent successfully! ${notifications.join(" and ")} notification${notifications.length > 1 ? "s" : ""} sent to customer.`);
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
    <SidebarLayout title="Security Requests">
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
                <p className="text-slate-600 mt-2">
                  {request.dog_option ? DOG_OPTIONS[request.dog_option] : "Security Service"}
                </p>
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

              {request.dog_option && (
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-2">Service Option</p>
                    <p className="text-slate-900 font-semibold">{DOG_OPTIONS[request.dog_option]}</p>
                  </div>
                </div>
              )}

              {request.reason && (
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-medium mb-2">Reason</p>
                    <p className="text-slate-900 font-semibold">{REASONS[request.reason]}</p>
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
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={quoteForm.duration_hours}
                  onChange={(e) =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      duration_hours: e.target.value,
                    }))
                  }
                  placeholder="e.g., 8"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hourly Rate (Ksh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quoteForm.hourly_rate}
                  onChange={(e) =>
                    setQuoteForm((prev) => ({
                      ...prev,
                      hourly_rate: e.target.value,
                    }))
                  }
                  placeholder="e.g., 500"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
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
