"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  Baby,
  Shield,
  DollarSign,
  Calendar,
  Check,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import usePaystack from "@/app/hooks/usePaystack";

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  service_type: "nanny" | "security";
  price: string;
  service_days: number;
  validity_days: number;
  description: string;
  features: string[];
  terms_conditions: string;
}

export default function PurchaseSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pkg, setPkg] = useState<SubscriptionPackage | null>(null);
  const [user, setUser] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [slug]);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/login?redirect=/subscriptions/purchase/${slug}`);
        return;
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUser(userData);

      // Fetch package
      const { data: packageData, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (error || !packageData) {
        console.error("Error fetching package:", error);
        alert("Package not found or inactive");
        router.push("/subscriptions");
        return;
      }

      setPkg(packageData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    if (!pkg || !user) return;

    setProcessing(true);

    try {
      // Create subscription record with pending payment
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.validity_days);

      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .insert([
          {
            user_id: user.id,
            package_id: pkg.id,
            status: "active",
            expiry_date: expiryDate.toISOString(),
            service_days_total: pkg.service_days,
            service_days_used: 0,
            service_days_remaining: pkg.service_days,
            amount_paid: parseFloat(pkg.price),
            payment_status: "pending",
          },
        ])
        .select()
        .single();

      if (subError || !subscription) {
        console.error("Error creating subscription:", subError);
        alert("Failed to create subscription");
        setProcessing(false);
        return;
      }

      const onSuccess = async (response: { reference: string }) => {
        try {
          // Verify payment via backend (similar pattern to nanny flow)
          const res = await fetch("/api/subscriptions/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              subscription_id: subscription.id,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || "Payment verification failed");
          }

          alert("Subscription purchased successfully!");
          router.push(`/account?tab=subscriptions`);
        } catch (err) {
          console.error("Payment verification error:", err);
          alert("Payment verification failed. Please contact support.");
        } finally {
          setProcessing(false);
        }
      };

      const onClose = () => {
        setProcessing(false);
      };

      initializePayment(
        {
          email: user.email,
          amount: Math.round(parseFloat(pkg.price) * 100),
          currency: "KES",
          reference: `SUB-${subscription.id}-${Date.now()}`,
        },
        onSuccess,
        onClose
      );
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Package not found</p>
          <button
            onClick={() => router.push("/subscriptions")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Packages
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Package Header */}
          <div
            className={`p-8 text-white ${
              pkg.service_type === "nanny"
                ? "bg-gradient-to-br from-pink-500 to-pink-600"
                : "bg-gradient-to-br from-green-500 to-green-600"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  pkg.service_type === "nanny" ? "bg-pink-400" : "bg-green-400"
                }`}
              >
                {pkg.service_type === "nanny" ? (
                  <Baby className="w-8 h-8" />
                ) : (
                  <Shield className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{pkg.name}</h1>
                <p className="text-white/90 mt-1">{pkg.description}</p>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Price</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  KES {parseFloat(pkg.price).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Service Days</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {pkg.service_days} days
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Validity</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {pkg.validity_days} days
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What's Included
              </h2>
              <ul className="space-y-3">
                {pkg.features && pkg.features.length > 0 ? (
                  pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No features listed</li>
                )}
              </ul>
            </div>

            {/* Terms & Conditions */}
            {pkg.terms_conditions && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Terms & Conditions
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {pkg.terms_conditions}
                </p>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the terms and conditions and understand that this
                  subscription provides {pkg.service_days} days of service valid for{" "}
                  {pkg.validity_days} days from the date of purchase.
                </span>
              </label>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!agreedToTerms || processing}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                !agreedToTerms || processing
                  ? "bg-gray-400 cursor-not-allowed"
                  : pkg.service_type === "nanny"
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Proceed to Payment
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

