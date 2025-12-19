"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Loader, 
  User, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Baby,
  Shield,
  CreditCard,
  Package
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import AboutHero from "@/components/hero/AboutHero";

interface NannyRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  location: string;
  service_needed: string;
  start_date: string;
  end_date: string;
  is_paid: boolean;
  is_assigned: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
}

interface SecurityRequest {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  location: string;
  dog_option: string;
  reason: string;
  start_date: string;
  end_date: string;
  is_paid: boolean;
  is_assigned: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  request_id: string;
  amount: string;
  status: "pending" | "paid" | "failed";
  paid_at: string | null;
  created_at: string;
  type: "nanny" | "security";
}

const SERVICE_TYPES: Record<string, string> = {
  emergency_under_6_hours: "Emergency (Under 6 Hours)",
  sunday_day_bug: "Sunday Day Bug",
  short_term_daily: "Short Term Daily",
};

const DOG_OPTIONS: Record<string, string> = {
  one_dog_one_handler: "1 Dog + Handler",
  two_dogs_two_handlers: "2 Dogs + Handlers",
  three_plus: "3+ Dogs",
};

const REASONS: Record<string, string> = {
  travel_vacation: "Travel/Vacation",
  night_shift: "Night Shift",
  house_help_exit: "House Help Exit",
  construction_period: "Construction Period",
  high_risk_period: "High Risk Period",
  other: "Other",
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [nannyRequests, setNannyRequests] = useState<NannyRequest[]>([]);
  const [securityRequests, setSecurityRequests] = useState<SecurityRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "payments" | "subscriptions" | "redemptions">("overview");

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login?redirect=/account");
        return;
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      setUser(userData);

      // Fetch nanny requests (by user_id, email, or phone)
      const { data: nannyData, error: nannyError } = await supabase
        .from("nanny_requests")
        .select("*")
        .or(`user_id.eq.${session.user.id},email.eq.${userData.email},phone.eq.${userData.phone || 'null'}`)
        .order("created_at", { ascending: false });

      if (nannyError) {
        console.error("Error fetching nanny requests:", nannyError);
      } else if (nannyData) {
        setNannyRequests(nannyData);
      }

      // Fetch security requests (by user_id, email, or phone)
      const { data: securityData, error: securityError } = await supabase
        .from("security_requests")
        .select("*")
        .or(`user_id.eq.${session.user.id},email.eq.${userData.email},phone.eq.${userData.phone || 'null'}`)
        .order("created_at", { ascending: false });

      if (securityError) {
        console.error("Error fetching security requests:", securityError);
      } else if (securityData) {
        setSecurityRequests(securityData);
      }

      // Fetch nanny payments (by user_id or by matching request)
      const { data: nannyPayments, error: nannyPayError } = await supabase
        .from("nanny_payments")
        .select("*")
        .or(`user_id.eq.${session.user.id}${nannyData?.map(r => `,request_id.eq.${r.id}`).join('') || ''}`)
        .order("created_at", { ascending: false });

      if (nannyPayError) {
        console.error("Error fetching nanny payments:", nannyPayError);
      }

      // Fetch security payments (by user_id or by matching request)
      const { data: securityPayments, error: securityPayError } = await supabase
        .from("security_payments")
        .select("*")
        .or(`user_id.eq.${session.user.id}${securityData?.map(r => `,request_id.eq.${r.id}`).join('') || ''}`)
        .order("created_at", { ascending: false });

      if (securityPayError) {
        console.error("Error fetching security payments:", securityPayError);
      }

      const allPayments: Payment[] = [
        ...(nannyPayments || []).map((p: any) => ({ ...p, type: "nanny" as const })),
        ...(securityPayments || []).map((p: any) => ({ ...p, type: "security" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPayments(allPayments);

      // Fetch user subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_packages (
            name,
            service_type,
            service_days,
            validity_days
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (subscriptionsError) {
        console.error("Error fetching subscriptions:", subscriptionsError);
      } else {
        setSubscriptions(subscriptionsData || []);
      }

      // Fetch subscription redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("subscription_redemptions")
        .select(`
          *,
          user_subscriptions (
            subscription_packages (
              name,
              service_type
            )
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (redemptionsError) {
        console.error("Error fetching redemptions:", redemptionsError);
      } else {
        setRedemptions(redemptionsData || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (request: NannyRequest | SecurityRequest) => {
    if (request.is_cancelled) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    if (request.is_completed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (request.is_assigned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Package className="w-3 h-3" />
          Assigned
        </span>
      );
    }
    if (request.is_paid) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          Processing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3" />
        Pending Payment
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Failed
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

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const allRequests = [
    ...nannyRequests.map((r) => ({ ...r, type: "nanny" as const })),
    ...securityRequests.map((r) => ({ ...r, type: "security" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AboutHero title="My Account" highlight="Dashboard" background="/planding3.jpeg" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.full_name || "User"}!
                </h1>
                <p className="text-gray-600 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{allRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingPayments.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nanny Services</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{nannyRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Baby className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Services</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{securityRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Requests ({allRequests.length})
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "payments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Payments ({payments.length})
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "subscriptions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Subscriptions ({subscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab("redemptions")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "redemptions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Redemptions ({redemptions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {pendingPayments.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                      Pending Payments
                    </h3>
                    <div className="space-y-3">
                      {pendingPayments.slice(0, 3).map((payment) => {
                        const request = allRequests.find((r) => r.id === payment.request_id);
                        return (
                          <div
                            key={payment.id}
                            className="bg-white rounded-lg p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.type === "nanny" ? "Nanny Service" : "Security Service"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {request ? formatDate(request.created_at) : "N/A"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                KES {parseFloat(payment.amount).toLocaleString()}
                              </p>
                              <button
                                onClick={() => router.push(`/services/success/${payment.request_id}?type=${payment.type}`)}
                                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                              >
                                Pay Now →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
                  <div className="space-y-3">
                    {allRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/services/success/${request.id}?type=${request.type}`)}
                      >
                        <div className="flex items-center gap-3">
                          {request.type === "nanny" ? (
                            <Baby className="w-5 h-5 text-pink-600" />
                          ) : (
                            <Shield className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.type === "nanny"
                                ? SERVICE_TYPES[(request as NannyRequest).service_needed] || "Nanny Service"
                                : "Security Service"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(request.created_at)} • {request.location}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request)}
                      </div>
                    ))}
                    {allRequests.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No requests yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {allRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/services/success/${request.id}?type=${request.type}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {request.type === "nanny" ? (
                          <Baby className="w-6 h-6 text-pink-600" />
                        ) : (
                          <Shield className="w-6 h-6 text-green-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.type === "nanny"
                              ? SERVICE_TYPES[(request as NannyRequest).service_needed] || "Nanny Service"
                              : "Security Service"}
                          </h3>
                          <p className="text-sm text-gray-600">Request ID: {request.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      {getStatusBadge(request)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Start: {formatDate(request.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>End: {formatDate(request.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{request.location}</span>
                      </div>
                    </div>

                    {request.type === "security" && (request as SecurityRequest).dog_option && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Service:</strong> {DOG_OPTIONS[(request as SecurityRequest).dog_option] || "N/A"}
                      </div>
                    )}
                  </div>
                ))}
                {allRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No requests found</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                {payments.map((payment) => {
                  const request = allRequests.find((r) => r.id === payment.request_id);
                  return (
                    <div
                      key={payment.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {payment.type === "nanny" ? "Nanny Service" : "Security Service"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request ? formatDate(request.created_at) : "N/A"}
                          </p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-lg font-semibold text-gray-900">
                            KES {parseFloat(payment.amount).toLocaleString()}
                          </span>
                        </div>
                        {payment.status === "pending" && (
                          <button
                            onClick={() => router.push(`/services/success/${payment.request_id}?type=${payment.type}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Pay Now
                          </button>
                        )}
                        {payment.status === "paid" && payment.paid_at && (
                          <p className="text-sm text-gray-600">
                            Paid on {formatDate(payment.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {payments.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payments found</p>
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === "subscriptions" && (
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No subscriptions yet</p>
                    <button
                      onClick={() => router.push("/subscriptions")}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Packages
                    </button>
                  </div>
                ) : (
                  subscriptions.map((subscription) => {
                    const isExpired = new Date(subscription.expiry_date) < new Date();
                    const daysRemaining = Math.ceil(
                      (new Date(subscription.expiry_date).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={subscription.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                subscription.subscription_packages?.service_type === "nanny"
                                  ? "bg-pink-100"
                                  : "bg-green-100"
                              }`}
                            >
                              {subscription.subscription_packages?.service_type === "nanny" ? (
                                <Baby className="w-6 h-6 text-pink-600" />
                              ) : (
                                <Shield className="w-6 h-6 text-green-600" />
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {subscription.subscription_packages?.name || "Unknown Package"}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Purchased on {formatDate(subscription.purchase_date)}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-gray-500">Days Remaining</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {subscription.service_days_remaining} / {subscription.service_days_total}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Days Used</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {subscription.service_days_used}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Valid Until</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(subscription.expiry_date)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Status</p>
                                  {isExpired ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <XCircle className="w-3 h-3" />
                                      Expired
                                    </span>
                                  ) : subscription.status === "active" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {subscription.status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!isExpired && subscription.status === "active" && subscription.service_days_remaining > 0 && (
                                <div className="mt-4">
                                  <button
                                    onClick={() =>
                                      router.push(`/subscriptions/redeem/${subscription.id}`)
                                    }
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Redeem Days
                                  </button>
                                </div>
                              )}

                              {daysRemaining <= 7 && daysRemaining > 0 && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    ⚠️ Your subscription expires in {daysRemaining} days
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Redemptions Tab */}
            {activeTab === "redemptions" && (
              <div className="space-y-4">
                {redemptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No redemptions found</p>
                  </div>
                ) : (
                  redemptions.map((redemption) => {
                    const pkg =
                      redemption.user_subscriptions?.subscription_packages;
                    const isCompleted = redemption.status === "completed";
                    const isPending = redemption.status === "pending";
                    const isApproved = redemption.status === "approved";
                    const isRejected = redemption.status === "rejected";

                    return (
                      <div
                        key={redemption.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                pkg?.service_type === "nanny"
                                  ? "bg-pink-100"
                                  : "bg-green-100"
                              }`}
                            >
                              {pkg?.service_type === "nanny" ? (
                                <Baby className="w-6 h-6 text-pink-600" />
                              ) : (
                                <Shield className="w-6 h-6 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {pkg?.name || "Subscription Redemption"}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Requested on{" "}
                                {formatDate(redemption.created_at)}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </span>
                            )}
                            {isApproved && !isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3" />
                                Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Start: {formatDate(redemption.service_start_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              End: {formatDate(redemption.service_end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{redemption.days_to_redeem} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{redemption.location}</span>
                          </div>
                        </div>

                        {redemption.notes && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Notes:</strong> {redemption.notes}
                          </div>
                        )}

                        {redemption.rejection_reason && isRejected && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                            <strong>Rejection reason:</strong>{" "}
                            {redemption.rejection_reason}
                          </div>
                        )}
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


