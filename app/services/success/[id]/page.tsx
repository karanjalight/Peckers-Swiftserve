"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader, AlertCircle, DollarSign, LogIn, UserPlus, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/AboutHero";
import Footer from "@/components/landing/Footer";
import usePaystack from "@/app/hooks/usePaystack";

export default function SuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const requestType = searchParams?.get("type") || "nanny"; // default to nanny for backward compatibility

  const [request, setRequest] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  const fetchData = async () => {
    setLoading(true);

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

      if (payError && payError.code !== "PGRST116") throw payError; // ignore "no rows"
      setPayment(payData || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load your payment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [id]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

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
        <p className="text-slate-600 mb-4">{error || "Request not found."}</p>
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
    <div className="">
      <Navbar />
      <AboutHero title="Success" highlight="Sunday | Emergency"  background="/planding3.jpeg"/>
      <div className="flex flex-col justify-center items-center ">

      <div className="bg-white w-full max-w-xl shadow-lg rounded-lg p-8 space-y-6">
        {/* Success Badge */}
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">
            Booking Successful!
          </h1>
          <p className="text-slate-600 mt-2">
            Thank you for making a booking. Your request has been received.
          </p>
        </div>

        {/* Client Info */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Request Details
          </h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>
              <strong>Name:</strong> {request.full_name}
            </p>
            {request.service_needed && (
              <p>
                <strong>Service:</strong> {request.service_needed}
              </p>
            )}
            {request.dog_option && (
              <p>
                <strong>Service:</strong> {request.dog_option === "one_dog_one_handler" ? "1 Dog + Handler" : request.dog_option === "two_dogs_two_handlers" ? "2 Dogs + Handlers" : "3+ Dogs"}
              </p>
            )}
            {request.reason && (
              <p>
                <strong>Reason:</strong> {request.reason}
              </p>
            )}
            <p>
              <strong>Location:</strong> {request.location}
            </p>
          </div>
        </div>

        {/* Payment Info */}
        {payment ? (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Details
            </h2>

            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>
                <strong>Amount:</strong> KES {payment.amount}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    payment.status === "paid"
                      ? "text-green-600"
                      : payment.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {payment.status === "paid" ? "Paid" : payment.status === "pending" ? "Pending" : "Failed"}
                </span>
              </p>

              {payment.mpesa_reference && (
                <p>
                  <strong>M-Pesa Ref:</strong> {payment.mpesa_reference}
                </p>
              )}

              {payment.paid_at && (
                <p>
                  <strong>Paid At:</strong>{" "}
                  {new Date(payment.paid_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
            <p className="text-slate-600 mt-2">Awaiting payment…</p>
          </div>
        )}

        {payment && (
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Payment Amount</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-900" />
              <p className="text-2xl font-bold text-slate-900">
                KES {parseFloat(payment.amount).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Payment Success Message */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-green-800 mb-4">
                  Your payment has been processed successfully. To track your order and manage your bookings, please log in to your account.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Login to Your Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        {payment && payment.status === "pending" && !paymentSuccess && (
          <button
            onClick={handlePayment}
            disabled={processingPayment}
            className="w-full py-3 mt-6 mb-10 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processingPayment ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              "Pay with Paystack"
            )}
          </button>
        )}

        {/* Account Creation Prompt - Show if not authenticated */}
        {!checkingAuth && !isAuthenticated && (
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Create Your Account
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Track all your bookings, view payment history, and manage your services in one place. 
                  We'll automatically link this request to your account!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push(`/signup?email=${encodeURIComponent(request?.email || "")}&phone=${encodeURIComponent(request?.phone || "")}&redirect=/services/success/${id}?type=${requestType}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-medium"
                  >
                    <UserPlus className="w-5 h-5" />
                    Create Free Account
                  </button>
                  <button
                    onClick={() => router.push(`/login?redirect=/services/success/${id}?type=${requestType}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <p className="text-blue-900 font-medium">You're logged in!</p>
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

        {/* If payment is paid, show login button */}
        {payment && payment.status === "paid" && !paymentSuccess && !isAuthenticated && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Payment Completed
                  </h3>
                  <p className="text-green-800 mb-4">
                    Your payment has been received. Create an account to track your order and manage all your bookings.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => router.push(`/signup?email=${encodeURIComponent(request?.email || "")}&phone=${encodeURIComponent(request?.phone || "")}&redirect=/account`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </button>
                    <button
                      onClick={() => router.push(`/login?redirect=/account`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Go Home
            </button>
          </div>
        )}

        {/* If payment is paid and authenticated */}
        {payment && payment.status === "paid" && !paymentSuccess && isAuthenticated && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Payment Completed
                  </h3>
                  <p className="text-green-800 mb-4">
                    Your payment has been received. View all your bookings in your account dashboard.
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
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Go Home
            </button>
          </div>
        )}

        {/* If no payment yet, show home button */}
        {!payment && (
          <div className="space-y-4">
            {!isAuthenticated && (
              <button
                onClick={() => router.push(`/signup?email=${encodeURIComponent(request?.email || "")}&phone=${encodeURIComponent(request?.phone || "")}&redirect=/services/success/${id}?type=${requestType}`)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-md font-medium"
              >
                Create Account to Track This Request
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
      </div>

      <Footer />
    </div>
  );
}
