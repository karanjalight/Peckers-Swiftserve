"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  Baby,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";

interface Subscription {
  id: string;
  service_days_remaining: number;
  service_days_total: number;
  service_days_used: number;
  expiry_date: string;
  subscription_packages: {
    name: string;
    service_type: "nanny" | "security";
  };
}

export default function RedeemSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    days_to_redeem: 1,
    service_start_date: "",
    service_end_date: "",
    location: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, [subscriptionId]);

  useEffect(() => {
    // Auto-calculate end date when start date or days change
    if (formData.service_start_date && formData.days_to_redeem > 0) {
      const startDate = new Date(formData.service_start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + formData.days_to_redeem - 1);
      setFormData({
        ...formData,
        service_end_date: endDate.toISOString().split("T")[0],
      });
    }
  }, [formData.service_start_date, formData.days_to_redeem]);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/login?redirect=/subscriptions/redeem/${subscriptionId}`);
        return;
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUser(userData);
      setFormData({
        ...formData,
        phone: userData?.phone || "",
        email: userData?.email || "",
      });

      // Fetch subscription
      const { data: subscriptionData, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          subscription_packages (
            name,
            service_type
          )
        `
        )
        .eq("id", subscriptionId)
        .eq("user_id", session.user.id)
        .single();

      if (error || !subscriptionData) {
        console.error("Error fetching subscription:", error);
        alert("Subscription not found");
        router.push("/account?tab=subscriptions");
        return;
      }

      // Check if subscription is valid
      if (new Date(subscriptionData.expiry_date) < new Date()) {
        alert("This subscription has expired");
        router.push("/account?tab=subscriptions");
        return;
      }

      if (subscriptionData.service_days_remaining <= 0) {
        alert("No remaining days to redeem");
        router.push("/account?tab=subscriptions");
        return;
      }

      setSubscription(subscriptionData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!subscription || !user) return;

      // Validate days
      if (formData.days_to_redeem > subscription.service_days_remaining) {
        alert(
          `You only have ${subscription.service_days_remaining} days remaining`
        );
        setSubmitting(false);
        return;
      }

      // Create redemption request
      const { data, error } = await supabase
        .from("subscription_redemptions")
        .insert([
          {
            subscription_id: subscription.id,
            user_id: user.id,
            days_to_redeem: formData.days_to_redeem,
            service_start_date: formData.service_start_date,
            service_end_date: formData.service_end_date,
            location: formData.location,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            status: "pending",
          },
        ])
        .select();

      if (error) {
        console.error("Error creating redemption:", error);
        alert("Failed to submit redemption request: " + error.message);
      } else {
        alert(
          "Redemption request submitted successfully! Our team will contact you shortly."
        );
        router.push("/account?tab=subscriptions");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Subscription not found</p>
          <button
            onClick={() => router.push("/account?tab=subscriptions")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const minDate = new Date().toISOString().split("T")[0];
  const maxDate = new Date(subscription.expiry_date).toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Subscriptions
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div
            className={`p-6 text-white ${
              subscription.subscription_packages?.service_type === "nanny"
                ? "bg-gradient-to-br from-pink-500 to-pink-600"
                : "bg-gradient-to-br from-green-500 to-green-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  subscription.subscription_packages?.service_type === "nanny"
                    ? "bg-pink-400"
                    : "bg-green-400"
                }`}
              >
                {subscription.subscription_packages?.service_type === "nanny" ? (
                  <Baby className="w-6 h-6" />
                ) : (
                  <Shield className="w-6 h-6" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Redeem Subscription Days</h1>
                <p className="text-white/90">
                  {subscription.subscription_packages?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="p-6 bg-blue-50 border-b">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.service_days_remaining}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Days Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.service_days_used}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.service_days_total}
                </p>
              </div>
            </div>
          </div>

          {/* Redemption Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days to Redeem *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={subscription.service_days_remaining}
                  value={formData.days_to_redeem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      days_to_redeem: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  You have {subscription.service_days_remaining} days available
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    max={maxDate}
                    value={formData.service_start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_start_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.service_end_date}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated based on days selected
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Where will the service be provided?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+254..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requirements or preferences..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Once submitted, your redemption request will
                  be reviewed by our team. We'll contact you within 24 hours to confirm
                  and schedule the service.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                  submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : subscription.subscription_packages?.service_type === "nanny"
                    ? "bg-pink-600 hover:bg-pink-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Redemption Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}


















