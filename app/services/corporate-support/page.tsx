"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/CorporateHero";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import {
  Zap,
  TrendingDown,
  Leaf,
  Gauge,
  FileText,
  ChevronDown,
  User,
  Phone,
  Mail,
  MapPin,
  Baby,
  ClipboardList,
  Clock,
} from "lucide-react";
import NannyForm from "@/components/forms/NannyForm";
import CorporateForm from "@/components/forms/CorporateForm";
import CorporateSection from "@/components/services/CorporateSection";

export default function EmergencyNanny() {
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const benefits = [
    {
      icon: TrendingDown,
      title: "Lower Energy Bills",
      desc: "Identify areas of high energy consumption and get recommendations for cost savings.",
    },
    {
      icon: Gauge,
      title: "Optimized Energy Usage",
      desc: "Improve the efficiency of electrical appliances, lighting, and HVAC systems.",
    },
    {
      icon: Leaf,
      title: "Sustainable & Green Energy Compliance",
      desc: "Meet environmental regulations and reduce your carbon footprint.",
    },
    {
      icon: Zap,
      title: "Enhanced Equipment Lifespan",
      desc: "Reduce overloading and unnecessary wear on electrical components.",
    },
    {
      icon: FileText,
      title: "Data-Driven Decision Making",
      desc: "Gain actionable insights for energy management.",
    },
  ];

  const auditProcess = [
    {
      number: "1️⃣",
      title: "Request & Immediate Response",
      items: [
        "Client submits a request for an Emergency Nanny or Day-Bug service.",
        "Our support team reviews the urgency and gathers key details such as child's age, location, and duty requirements.",
        "For Emergency Nanny service, response time begins immediately with priority handling.",
      ],
    },
    {
      number: "2️⃣",
      title: "Nanny Selection & Verification",
      items: [
        "A suitable nanny is selected from our pool of trained and verified professionals.",
        "All nannies have undergone background checks, first-aid training, soft skills coaching, and childcare simulations.",
        "We ensure the nanny selected matches the family’s needs (infants, twins, special routines, Sunday coverage, etc.).",
      ],
    },
    {
      number: "3️⃣",
      title: "Deployment & Handover",
      items: [
        "For Emergency Nanny service, deployment is done within **6 hours guaranteed**.",
        "For Day-Bug service, deployment aligns with your preferred Sunday/weekday schedule.",
        "A structured handover process is guided, ensuring the caregiver understands routines, feeding, hygiene, and safety expectations.",
      ],
    },
    {
      number: "4️⃣",
      title: "Caregiving & Support",
      items: [
        "Nanny provides professional childcare including feeding, cleaning, play supervision, and infant/toddler care.",
        "Support also includes help during church days, family events, errands, or personal parent time.",
        "Parents can reach our support team at any time for assistance or adjustments.",
      ],
    },
    {
      number: "5️⃣",
      title: "Review & Continuity Options",
      items: [
        "We follow up to ensure satisfaction and confirm that the nanny met all expectations.",
        "Families can extend services, request a repeat Day-Bug booking, or transition to a long-term nanny plan.",
        "Feedback helps us continuously improve nanny preparedness and service quality.",
      ],
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Corporate"
        highlight="Support"
        background="/dashboards.png"
      />

      <div className="mx-auto flex lg:flex-row gap-6 flex-col px-4 sm:px-6 lg:px-8 py-4">
        {/* FORM */}
        {showForm && (
          <section className="lg:w-2/3 bg-white p-8 lg:p-12 border  ">
            <h2 className="text-4xl font-bold text-[#244672] mb-4">
              Corporate Support
            </h2>

            <p className="text-gray-600 mb-10 text-lg leading-relaxed">
              Need immediate nanny assistance? Please provide your details
              below.
            </p>

            <CorporateForm />
          </section>
        )}

        {/* ===================== LEFT SECTION ===================== */}
        {!showForm && (
          <section className="lg:w-2/3">
            <div className=" lg:mb-10 bg-white lg:px-8 lg:py-8  p-4">
              <div className="w-full bg-white">
                {/* Header Section */}
                <CorporateSection
                  showForm={showForm}
                  setShowForm={setShowForm}
                />

                {/* Audit Steps & CTA ... */}
              </div>
            </div>
          </section>
        )}

        {/* ===================== LEFT SECTION ===================== */}
        <section className="lg:w-1/3">
          <div className="lg:mb-10 bg-white lg:px-8 lg:py-8 p-4">
            {/* Benefits Section */}
            <div className="px-4 py-12">
              <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8">
                Summary
              </h1>

              <div className="text-lg space-y-8 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="text-2xl font-bold text-[#244672] mb-3">
                    Sales Training & Performance Consulting
                  </h3>

                  <p className="mb-2">
                    Our flagship corporate service designed for high-impact
                    teams across Pharmaceutical, FMCG, and service-based
                    industries.
                  </p>

                  <ul className="list-disc ml-6 space-y-1">
                    <li>
                      Managers Coaching Excellence & Leadership Development
                    </li>
                    <li>
                      Medical & Sales Representative 6-week competency programs
                    </li>
                    <li>
                      Territory planning, call execution & pipeline management
                    </li>
                    <li>
                      Ethical, consultative & scientific selling frameworks
                    </li>
                  </ul>

                  <p className="font-semibold text-[#244672] mt-6">
                    Why this matters:
                  </p>

                  <ul className="list-disc ml-6 space-y-1">
                    <li>
                      Improves productivity, accountability & field execution
                    </li>
                    <li>
                      Strengthens leadership at supervisor & regional levels
                    </li>
                    <li>Boosts conversion rates and revenue performance</li>
                  </ul>

                  <ul className="list-disc ml-6 space-y-1 mt-4">
                    <li>
                      Custom KPI dashboards for Reps, Managers & Executives
                    </li>
                    <li>
                      Integration with CRM/ERP systems for real-time insights
                    </li>
                    <li>
                      Clear ROI tracking and continuous improvement models
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ===================== RIGHT SECTION WITH FORM ===================== */}
            {/* Toggle Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-[#b38f62] text-white py-3 font-semibold hover:bg-[#b38f62] transition mb-4"
            >
              {showForm ? "Close Form" : "Book Service Now"}
            </button>
            {/* CONTACT SECTION */}
            <div className="px-4 py-8 space-y-4 text-gray-700">
              <h2 className="text-2xl font-bold text-[#244672]">Contact Us</h2>

              <p>
                <strong>Phone:</strong> +254 741767944
              </p>
              <p>
                <strong>Email:</strong> info@peckersswiftserve.com
              </p>
              <p>
                <strong>Location:</strong> Nairobi, Kenya
              </p>
            </div>

            {/* HIRE BUTTON */}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
