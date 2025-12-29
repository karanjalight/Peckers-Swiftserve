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
import StepIndicator, { NANNY_BOOKING_STEPS, SECURITY_BOOKING_STEPS } from "@/components/StepIndicator";

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
    passport_photo_url: string | null;
    active?: boolean | null;
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
  const [selectedNannyDetails, setSelectedNannyDetails] = useState<{
    first_name: string;
    last_name: string;
  } | null>(null);

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
            // Fetch security payment - use maybeSingle to gracefully handle missing records
            const { data: payData, error: secPayError } = await supabase
              .from("security_payments")
              .select("*")
              .eq("request_id", id)
              .maybeSingle();
            if (secPayError) {
              console.error("Error fetching security payment in fallback:", secPayError);
            }
            setPayment(payData || null);
            setLoading(false);
            return;
          }
        }
        throw reqError;
      }
      setRequest(reqData);

      // Fetch payment - use maybeSingle to gracefully handle missing records
      const { data: payData, error: payError } = await supabase
        .from(paymentTable)
        .select("*")
        .eq("request_id", id)
        .maybeSingle();

      if (payError) {
        console.error(`Error fetching payment from ${paymentTable}:`, payError);
        // Don't throw for missing payment - it's okay if payment doesn't exist yet
        // Only throw for actual query errors
        if ((payError as any).code && (payError as any).code !== "PGRST116") {
          throw payError;
        }
      }
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
          
          // Fetch selected nanny details
          const { data: nannyData } = await supabase
            .from("applicants")
            .select("first_name, last_name")
            .eq("id", existingSelection.applicant_id)
            .single();
          
          if (nannyData) {
            setSelectedNannyDetails({
              first_name: nannyData.first_name,
              last_name: nannyData.last_name,
            });
          }
        } else {
          setSelectionSaved(false);
          setSelectedNannyDetails(null);
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
                location,
                passport_photo_url,
                active
              ),
              jobs:job_id (
                id,
                title,
                location
              )
            `
          )
          .eq("status", "hired")
          // .ilike("jobs.title", "%nanny%")
          .order("applied_at", { ascending: false });
         

        console.log("Nanny applications:", nannyApps);
        if (nannyError) {
          console.error("Error loading hired nannies from ATS:", nannyError);
        } else {
          const allHiredNannies =
            ((nannyApps || []) as unknown) as HiredNannyApplication[];

          // Only keep applications where:
          // - job title includes "nanny"
          // - applicant is active (or active is true)
          const nannyOnlyActive = allHiredNannies.filter((app) => {
            const isNannyJob =
              app.jobs?.title &&
              app.jobs.title.toLowerCase().includes("nanny");
            const isActiveApplicant =
              app.applicants?.active === undefined ||
              app.applicants?.active === null ||
              app.applicants?.active === true;

            return isNannyJob && isActiveApplicant;
          });

          setHiredNannies(nannyOnlyActive);
        }
      } else {
        setHiredNannies([]);
        setSelectedApplicantId(null);
        setSelectionSaved(false);
      }
    } catch (err: any) {
      console.error("Error in fetchData:", err);
      // Provide more specific error message if possible
      const errorMessage = err?.message || err?.code || "Unknown error";
      console.error("Error details:", {
        message: errorMessage,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        requestType,
        id,
      });
      setError("Failed to load your payment details. Please try refreshing the page or contact support if the issue persists.");
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
          // If this is a nanny booking and a nanny has been selected,
          // mark that applicant as inactive and flag the request as assigned
          // to avoid double booking.
          if (requestTableIsNanny(requestType) && selectedApplicantId) {
            try {
              const { error: applicantUpdateError } = await supabase
                .from("applicants")
                .update({ active: false })
                .eq("id", selectedApplicantId);

              if (applicantUpdateError) {
                console.error(
                  "Error marking applicant as inactive after payment:",
                  applicantUpdateError
                );
              } else {
                // Optimistically remove this nanny from the local list
                setHiredNannies((prev) =>
                  prev.filter(
                    (app) => app.applicants.id !== selectedApplicantId
                  )
                );
              }

              // Mark the nanny request as assigned
              const { error: requestUpdateError } = await supabase
                .from("nanny_requests")
                .update({ is_assigned: true })
                .eq("id", id);

              if (requestUpdateError) {
                console.error(
                  "Error marking nanny request as assigned after payment:",
                  requestUpdateError
                );
              }
            } catch (err) {
              console.error(
                "Unexpected error updating applicant/request status:",
                err
              );
            }
          }

          // Send SMS notifications to nanny and employer after successful payment
          if (requestTableIsNanny(requestType) && selectedApplicantId) {
            try {
              // Fetch nanny details directly from database to ensure we have the data
              const { data: nannyData, error: nannyError } = await supabase
                .from("applicants")
                .select("*")
                .eq("id", selectedApplicantId)
                .single();

              if (nannyError || !nannyData) {
                console.error("Error fetching nanny details for SMS:", nannyError);
              } else {
                const nanny = nannyData;
                const nannyPhone = nanny.phone;
                const employerPhone = request.phone;

                // Validate phone numbers are Kenyan (start with 254, +254, or 0)
                const isValidKenyanPhone = (phone: string): boolean => {
                  if (!phone) return false;
                  
                  // Remove all spaces and special characters except +
                  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
                  
                  // Check for obviously invalid patterns
                  if (cleaned.length < 9) return false;
                  
                  // Check if it's a Kenyan number format
                  let digits: string;
                  if (cleaned.startsWith('+254')) {
                    if (cleaned.length !== 13) return false; // +254XXXXXXXXX
                    digits = cleaned.substring(4); // Get the 9 digits after +254
                  } else if (cleaned.startsWith('254')) {
                    if (cleaned.length !== 12) return false; // 254XXXXXXXXX
                    digits = cleaned.substring(3); // Get the 9 digits after 254
                  } else if (cleaned.startsWith('0')) {
                    if (cleaned.length !== 10) return false; // 0XXXXXXXXX
                    digits = cleaned.substring(1); // Get the 9 digits after 0
                  } else {
                    return false;
                  }
                  
                  // Validate Kenyan mobile prefixes (70X, 71X, 72X, 73X, 74X, 75X, 76X, 77X, 78X, 79X)
                  const prefix = digits.substring(0, 2);
                  const validPrefixes = ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'];
                  if (!validPrefixes.includes(prefix)) {
                    console.warn(`⚠️ Invalid Kenyan mobile prefix: ${prefix} for phone ${phone}`);
                    return false;
                  }
                  
                  // Check for test/dummy numbers (all same digits, sequential, etc.)
                  if (/^(\d)\1{8}$/.test(digits)) {
                    console.warn(`⚠️ Suspicious phone number pattern (all same digits): ${phone}`);
                    return false;
                  }
                  
                  return true;
                };

                // Only send SMS if both phone numbers are valid Kenyan numbers
                const canSendSMS = isValidKenyanPhone(nannyPhone) && isValidKenyanPhone(employerPhone);
                
                if (!isValidKenyanPhone(nannyPhone)) {
                  console.error("❌ Skipping SMS - Invalid Kenyan phone number for nanny:", nannyPhone);
                }
                if (!isValidKenyanPhone(employerPhone)) {
                  console.error("❌ Skipping SMS - Invalid Kenyan phone number for employer:", employerPhone);
                }

                if (!canSendSMS) {
                  console.warn("⚠️ Skipping SMS notifications due to invalid phone numbers");
                } else {

                // Calculate days from start_date to end_date
                const startDate = request.start_date
                  ? new Date(request.start_date)
                  : null;
                const endDate = request.end_date
                  ? new Date(request.end_date)
                  : null;
                let daysText = "N/A";
                if (startDate && endDate) {
                  const diffTime = endDate.getTime() - startDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  daysText = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
                }

                const startDateFormatted = startDate
                  ? startDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD";
                const endDateFormatted = endDate
                  ? endDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD";

                // SMS to Nanny: Very basic message
                const nannyMessage = `Hello ${nanny.first_name}, New booking assigned! Thank you!`;

                // SMS to Employer: Very basic message
                const employerMessage = `Hello ${request.full_name}, Thank you for booking! Your nanny has been assigned. Thank you!`;

                // Send SMS to nanny
                try {
                  const nannySmsRes = await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: nannyPhone,
                      message: nannyMessage,
                    }),
                  });

                  const nannySmsData = await nannySmsRes.json();
                  if (nannySmsData.success) {
                    console.log("✅ SMS sent to nanny successfully:", {
                      phone: nannyPhone,
                      messageId: nannySmsData.data?.recipients?.[0]?.messageId,
                      status: nannySmsData.data?.recipients?.[0]?.status,
                    });
                  } else {
                    console.error("❌ Failed to send SMS to nanny:", {
                      phone: nannyPhone,
                      error: nannySmsData.error,
                      details: nannySmsData.details,
                    });
                  }
                } catch (smsError) {
                  console.error("Error sending SMS to nanny:", smsError);
                }

                // Send SMS to employer
                try {
                  const employerSmsRes = await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: employerPhone,
                      message: employerMessage,
                    }),
                  });

                  const employerSmsData = await employerSmsRes.json();
                  if (employerSmsData.success) {
                    console.log("✅ SMS sent to employer successfully:", {
                      phone: employerPhone,
                      messageId: employerSmsData.data?.recipients?.[0]?.messageId,
                      status: employerSmsData.data?.recipients?.[0]?.status,
                    });
                  } else {
                    console.error("❌ Failed to send SMS to employer:", {
                      phone: employerPhone,
                      error: employerSmsData.error,
                      details: employerSmsData.details,
                    });
                  }
                } catch (smsError) {
                  console.error("Error sending SMS to employer:", smsError);
                }
                }
              }
            } catch (smsError) {
              console.error("Error sending SMS notifications:", smsError);
              // Don't fail the payment process if SMS fails
            }
          }

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

  const handleDownloadReceipt = async () => {
    if (!payment || !request) return;

    try {
      const jsPDFModule = await import("jspdf");
      // Support both ESM named export and default export shapes
      const JsPDFConstructor: any =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (jsPDFModule as any).jsPDF || (jsPDFModule as any).default;

      if (!JsPDFConstructor) {
        throw new Error("jsPDF library could not be loaded");
      }

      const doc = new JsPDFConstructor();

      const primaryColor = "#0f172a"; // slate-900
      const accentColor = "#1d4ed8"; // blue-700
      const mutedColor = "#6b7280"; // gray-500

      // Header
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageWidthHeader = (doc as any).internal?.pageSize?.getWidth?.() || 210;
      const centerX = pageWidthHeader / 2;

      // Premium gradient-style bar
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidthHeader, 36, "F");

      // Brand name (top left)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      // doc.text("Peckers SwiftServe", 14, 14);

      // Premium title + subtitle, centered (stacked, no overlap)
      doc.setFontSize(14);
      doc.setTextColor(226, 232, 240);
      doc.text("Peckers SwiftServe Booking Receipt", centerX, 16, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Securely generated by Peckers SwiftServe for your records",
        centerX,
        22,
        { align: "center" }
      );

      // Common layout measurements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() || 210;
      const marginX = 14;
      const tableWidth = pageWidth - marginX * 2;
      const labelX = marginX + 4;
      const valueX = marginX + tableWidth / 2;

      let y = 40;

      const drawSectionTitle = (title: string) => {
        doc.setFontSize(13);
        doc.setTextColor(primaryColor);
        doc.text(title, marginX, y);
        y += 4;
        doc.setDrawColor(229, 231, 235);
        doc.line(marginX, y, marginX + tableWidth, y);
        y += 4;
      };

      const drawRow = (label: string, value: string | string[]) => {
        const rowHeight = 8;
        doc.setDrawColor(226, 232, 240); // light border
        doc.rect(marginX, y - 5, tableWidth, rowHeight, "S");

        doc.setFontSize(10);
        doc.setTextColor(mutedColor);
        doc.text(label, labelX, y);

        doc.setTextColor(primaryColor);
        if (Array.isArray(value)) {
          doc.text(value, valueX, y);
        } else {
          doc.text(String(value || "-"), valueX, y);
        }

        y += rowHeight;
      };

      // Receipt meta as table
      drawSectionTitle("Receipt Summary");

      const paidDate = payment.paid_at
        ? new Date(payment.paid_at).toLocaleString()
        : new Date().toLocaleString();

      const statusText =
        payment.status === "paid"
          ? "Paid"
          : payment.status === "pending"
          ? "Pending"
          : "Failed";

      drawRow("Receipt No.", String(payment.id || payment.reference || "-"));
      drawRow("Date", paidDate);
      drawRow("Status", statusText);

      y += 6;

      // Customer details table
      drawSectionTitle("Customer Details");
      drawRow("Name", String(request.full_name || "-"));
      drawRow("Email", String(request.email || "-"));
      drawRow("Phone", String(request.phone || "-"));
      drawRow("Location", String(request.location || "-"));

      y += 6;

      // Service details table
      drawSectionTitle("Service Details");
      drawRow(
        "Service Type",
        String(request.service_needed || requestType || "-")
      );

      if (request.reason) {
        const splitReason = doc.splitTextToSize(
          String(request.reason),
          tableWidth / 2 - 8
        );
        drawRow("Reason", splitReason);
      }

      y += 6;

      // Payment breakdown table
      drawSectionTitle("Payment Summary");

      const amountNumber = parseFloat(payment.amount);
      const amountText = isNaN(amountNumber)
        ? "-"
        : `KES ${amountNumber.toLocaleString()}`;

      drawRow("Amount Paid", amountText);

      if (payment.reference) {
        drawRow("Gateway Ref", String(payment.reference));
      }

      y += 10;

      // Footer note
      doc.setDrawColor(229, 231, 235);
      doc.line(14, y, 196, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(mutedColor);
      doc.text(
        "Thank you for choosing Peckers SwiftServe. For any queries about this receipt, contact our support team.",
        14,
        y
      );

      doc.save(
        `peckers-receipt-${requestType}-${id || ""}-${Date.now()}.pdf`
      );
    } catch (err) {
      console.error("Error generating receipt PDF:", err);
      alert("Failed to generate receipt. Please try again.");
    }
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
        highlight={
          payment && payment.status === "paid"
            ? "Booking Confirmed"
            : "Form Submitted"
        }
        background="/planding3.jpeg"
      />

      <main className="lg:px-20 mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Step Indicator */}
        <section className="mb-8">
          {(() => {
            // Determine current step based on payment status and request type
            const isNannyRequest = requestTableIsNanny(requestType);
            let currentStep = 0; // Start at Request Submitted
            
            if (isNannyRequest) {
              // For nanny requests: Request (0) -> Selection (1) -> Payment (2) -> Confirmed (3)
              if (payment?.status === "paid") {
                currentStep = 3; // Booking Confirmed
              } else if (payment && payment.status === "pending") {
                currentStep = 2; // Payment (selection already done or skipped)
              } else if (request) {
                // Request exists but no payment yet - show selection step
                currentStep = 1; // Nanny Selection
              }
              // else currentStep = 0 (Request Submitted)
            } else {
              // For security requests: Request (0) -> Payment (1) -> Confirmed (2)
              if (payment?.status === "paid") {
                currentStep = 2; // Booking Confirmed
              } else if (payment && payment.status === "pending") {
                currentStep = 1; // Payment
              }
              // else currentStep = 0 (Request Submitted)
            }

            return (
              <StepIndicator
                currentStep={currentStep}
                steps={isNannyRequest ? NANNY_BOOKING_STEPS : SECURITY_BOOKING_STEPS}
                showDescriptions={true}
              />
            );
          })()}
        </section>

        {/* Top success header */}
        <section className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                {payment && payment.status === "paid"
                  ? "Booking Successful"
                  : "Form Submitted Successfully"}
              </h1>
              <p className="text-slate-600 mt-1">
                {payment && payment.status === "paid"
                  ? "Thank you for making a booking. Your payment has been confirmed and our team is finalizing your booking."
                  : "Thank you for submitting your request. Our team is reviewing your details and will prepare a quote shortly."}
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

            {/* Nanny Selection (for nanny requests, before payment is completed) */}
            {requestTableIsNanny(requestType) && payment?.status !== "paid" && (
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

                {/* Selected Nanny Confirmation */}
                {selectedApplicantId && (() => {
                  // Try to find in current list first
                  const selectedNanny = hiredNannies.find(
                    (app) => app.applicants.id === selectedApplicantId
                  );
                  
                  // Use details from list or from fetched details
                  const fullName = selectedNanny
                    ? `${selectedNanny.applicants.first_name} ${selectedNanny.applicants.last_name}`
                    : selectedNannyDetails
                    ? `${selectedNannyDetails.first_name} ${selectedNannyDetails.last_name}`
                    : "Selected Nanny";
                  
                  return (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                          You have selected:
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 font-medium">
                        {fullName}
                      </p>
                      {selectionSaved && (
                        <p className="text-xs text-blue-600 mt-1">
                          Selection saved. Our team will confirm availability and prepare your quote.
                        </p>
                      )}
                    </div>
                  );
                })()}

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
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {hiredNannies.map((app) => {
                      const applicant = app.applicants;
                      const fullName = `${applicant.first_name} ${applicant.last_name}`;
                      const jobLocation =
                        app.jobs?.location ||
                        applicant.location ||
                        "Location on file";
                      const jobTitle = app.jobs?.title || "Nanny";
                      const isSelected = selectedApplicantId === applicant.id;
                      return (
                        <div
                          key={app.id}
                          className={`relative border rounded-xl overflow-hidden bg-white transition-all hover:shadow-lg ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50/50"
                              : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            {/* Large photo section */}
                            <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                              {applicant.passport_photo_url ? (
                                <img
                                  src={applicant.passport_photo_url}
                                  alt={fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                  <User className="w-16 h-16 text-blue-600" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content section */}
                            <div className="p-4 text-center flex-1 flex flex-col">
                            <div className="mb-3 flex-1">
                              <h3 className="font-semibold text-slate-900 text-sm mb-1">
                                {fullName}
                              </h3>
                              <p className="text-xs text-slate-600 mb-2">
                                {jobLocation}
                              </p>
                              {applicant.years_of_experience != null && (
                                <div className="flex items-center justify-center gap-1 mb-2">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs text-slate-600">
                                    {applicant.years_of_experience} yrs experience
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 bg-emerald-50 inline-flex px-2 py-1 rounded-full">
                                <Star className="w-3 h-3 text-emerald-600" />
                                <span>ATS: Hired</span>
                              </div>
                            </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(applicant.id);
                                setSelectedNannyDetails({
                                  first_name: applicant.first_name,
                                  last_name: applicant.last_name,
                                });
                              }}
                              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition ${
                                isSelected
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </div>
                        </div>
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
                    <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-green-900">
                              Payment Completed - Next Step: Create Account
                            </h3>
                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                              Required
                            </span>
                          </div>
                          <p className="text-base text-green-800 mb-1 font-medium">
                            Your payment has been successfully processed! 
                          </p>
                          <p className="text-sm text-green-700 mb-5">
                            Create an account or log in to track your booking, download receipts, and manage all your services in one place.
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
                              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md font-semibold text-base"
                            >
                              <UserPlus className="w-5 h-5" />
                              Create Account Now
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/login?redirect=/account`)
                              }
                              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-base shadow-sm"
                            >
                              <LogIn className="w-5 h-5" />
                              Log In Instead
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
              {!payment && !isAuthenticated && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-blue-900 mb-3 text-center">
                    Next Step: Create an account to track your request
                  </p>
                  <div className="flex flex-col gap-2">
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
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-md font-semibold text-base flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/login?redirect=/services/success/${id}?type=${requestType}`
                        )
                      }
                      className="w-full py-2.5 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition font-medium flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Or Log In
                    </button>
                  </div>
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
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-emerald-200">
                        Your payment is complete. A confirmation has been sent
                        to your email, and our team is finalizing your booking.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadReceipt}
                        className="w-full py-2.5 rounded-xl bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 transition border border-slate-300 flex items-center justify-center gap-2"
                      >
                        <span>Download Receipt (PDF)</span>
                      </button>
                    </div>
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


