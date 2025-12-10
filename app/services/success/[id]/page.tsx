"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader, AlertCircle, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/AboutHero";
import Footer from "@/components/landing/Footer";

export default function SuccessPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch request
      const { data: reqData, error: reqError } = await supabase
        .from("nanny_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (reqError) throw reqError;
      setRequest(reqData);

      // Fetch payment
      const { data: payData, error: payError } = await supabase
        .from("nanny_payments")
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
    fetchData();
  }, [id]);

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
            <p>
              <strong>Service:</strong> {request.service_needed}
            </p>
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
                    payment.status === "completed"
                      ? "text-green-600"
                      : payment.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {payment.status}
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
              {/* <DollarSign className="w-5 h-5 text-blue-900" /> */}
              <p className="text-2xl font-bold text-slate-900">
                KES {payment.amount.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 mt-6 mb-10 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Pay Now
        </button>
      </div>
      </div>

      <Footer />
    </div>
  );
}
