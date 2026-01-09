"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Loader,
  Baby,
  Shield,
  DollarSign,
  Calendar,
  Check,
  ArrowRight,
  Package,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import AboutHero from "@/components/hero/AboutHero";

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
  status: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [filterType, setFilterType] = useState<"all" | "nanny" | "security">("all");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("status", "active")
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching packages:", error);
      } else {
        setPackages(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: SubscriptionPackage) => {
    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/login?redirect=/subscriptions/purchase/${pkg.slug}`);
      return;
    }

    // Redirect to purchase page
    router.push(`/subscriptions/purchase/${pkg.slug}`);
  };

  const filteredPackages = packages.filter((pkg) => {
    if (filterType === "all") return true;
    return pkg.service_type === filterType;
  });

  const nannyPackages = packages.filter((p) => p.service_type === "nanny");
  const securityPackages = packages.filter((p) => p.service_type === "security");

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
      <AboutHero
        title="Subscription Packages"
        highlight="Affordable Plans"
        background="/planding.jpeg"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Intro */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get flexible subscription packages for nanny and security services. Pay once,
            use multiple times within the validity period.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setFilterType("all")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              filterType === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Packages
          </button>
          <button
            onClick={() => setFilterType("nanny")}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filterType === "nanny"
                ? "bg-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Baby className="w-5 h-5" />
            Nanny Services
          </button>
          <button
            onClick={() => setFilterType("security")}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filterType === "security"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Shield className="w-5 h-5" />
            Security Services
          </button>
        </div>

        {/* Packages Grid */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No packages available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                {/* Header */}
                <div
                  className={`p-6 text-white ${
                    pkg.service_type === "nanny"
                      ? "bg-gradient-to-br from-pink-500 to-pink-600"
                      : "bg-gradient-to-br from-green-500 to-green-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        pkg.service_type === "nanny" ? "bg-pink-400" : "bg-green-400"
                      }`}
                    >
                      {pkg.service_type === "nanny" ? (
                        <Baby className="w-6 h-6" />
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {pkg.service_type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-white/90 text-sm">{pkg.description}</p>
                </div>

                {/* Pricing */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      KES {parseFloat(pkg.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{pkg.service_days} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{pkg.validity_days} days validity</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {pkg.features && pkg.features.length > 0 ? (
                      pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">No features listed</li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(pkg)}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                      pkg.service_type === "nanny"
                        ? "bg-pink-600 hover:bg-pink-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Choose Subscription Packages?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cost Effective
              </h3>
              <p className="text-gray-600">
                Save money with bundled packages compared to booking individual days
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Flexible Usage
              </h3>
              <p className="text-gray-600">
                Use your service days whenever you need within the validity period
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Premium Service
              </h3>
              <p className="text-gray-600">
                Access to verified professionals with priority booking
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Learn more about how subscription packages work
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
















