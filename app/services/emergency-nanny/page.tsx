"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/HeroComponent";
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
      <AboutHero title="Emergency Nanny" highlight=" Consultancy" />

      <div className="mx-auto flex lg:flex-row gap-6 flex-col px-4 sm:px-6 lg:px-8 py-4">
        {/* FORM */}
        {showForm && (
          <section className="lg:w-2/3 bg-white p-8 lg:p-12 border  ">
            <h2 className="text-4xl font-bold text-[#244672] mb-4">
              Emergency Nanny Request
            </h2>

            <p className="text-gray-600 mb-10 text-lg leading-relaxed">
              Need immediate nanny assistance? Our certified nannies can be
              deployed to your home{" "}
              <span className="text-[#b38f62] font-semibold">
                within 6 hours.
              </span>
              Please provide your details below.
            </p>

            <form className="space-y-8">
              {/* Grid Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <User className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone Number *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Phone className="text-[#244672] w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="0700 000 000"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email (Optional)
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Mail className="text-[#244672] w-5 h-5" />
                    <input
                      type="email"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Your Location *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <MapPin className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="Nairobi – Westlands, Karen..."
                      required
                    />
                  </div>
                </div>

                {/* Children */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Number & Age of Children *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Baby className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="e.g. 1 child (2 years)"
                      required
                    />
                  </div>
                </div>

                {/* Service Needed */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Service Needed *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <ClipboardList className="text-[#244672] w-5 h-5" />

                    <select
                      className="w-full bg-transparent focus:outline-none"
                      required
                    >
                      <option value="">Select service</option>
                      <option>Emergency Nanny (Under 6 Hours)</option>
                      <option>Sunday / Day-Bug Nanny</option>
                      <option>Short-Term / Daily Nanny</option>
                    </select>
                  </div>
                </div>

                {/* Hours Needed */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Hours / Duration *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Clock className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="4 hours, full day, overnight..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes - Full Width */}
              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Additional Notes
                </label>
                <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
                  <FileText className="text-[#244672] w-5 h-5 mt-1" />
                  <textarea
                    className="w-full bg-transparent h-32 focus:outline-none"
                    placeholder="Share important details: allergies, routines, special needs..."
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold   hover:bg-[#b38f62] transition "
              >
                Request Emergency Nanny
              </button>

              <p className="text-center text-sm text-gray-500 mt-2">
                You will be contacted immediately after submission ✔
              </p>
            </form>
          </section>
        )}

        {/* ===================== LEFT SECTION ===================== */}
        {!showForm && (
          <section className="lg:w-2/3">
            <div className=" lg:mb-10 bg-white lg:px-8 lg:py-8  p-4">
              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 lg:px-4 py-12 md:py-16">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12">
                    Backup & Emergency Nanny Services
                  </h1>

                  <div className="max-w-6xl text-gray-700 mb-12">
                    {/* ⭐ NEW CONTENT INSERTED HERE ⭐ */}
                    <div>
                      {/* Top About Section */}
                      <section className="flex flex-col md:flex-row items-center justify-center gap-10 bg-white">
                        {/* Left Image */}
                        <div className="w-full flex justify-start">
                          <img
                            src="https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-13-1024x683.jpeg"
                            alt="Emergency Nanny"
                            className="w-[120vh] lg:h-[60vh] h-[20vh] object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Right Content */}
                        <div className="w-full lg:px-0 px-4 lg:pb-0 pb-12 space-y-6 relative">
                          {/* Heading */}
                          <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                            Backup & Emergency Nanny Services
                          </h2>

                          {/* Description */}
                          <p className="text-gray-800 leading-relaxed">
                            Our signature service — the first of its kind in
                            Kenya. We provide highly trained nannies within{" "}
                            <span className="font-semibold">6 hours</span>,
                            ensuring your home never faces childcare emergencies
                            alone.
                          </p>

                          {/* Icon List */}
                          <ul className="space-y-3 text-gray-800">
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
                              <span>Rapid 6-hour deployment guarantee</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
                              <span>
                                Ideal for sudden nanny absence, travel, or
                                sickness
                              </span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
                              <span>
                                Background-checked, first-aid trained &
                                simulation-tested nannies
                              </span>
                            </li>
                          </ul>

                          {/* CTA Button */}
                          <button
                            onClick={() => setShowForm(!showForm)}
                            className="w-full bg-[#b38f62] text-white py-3 font-semibold hover:bg-[#b38f62] transition mb-4"
                          >
                            {showForm ? "Close Form" : "Book Nanny Now"}
                          </button>
                        </div>

                        {/* Stroke Text */}
                        {/* <div className="lg:pr-20 lg:mt-40 h-full top-1/2 -translate-y-1/2 hidden md:block">
                          <h5
                            className="text-transparent uppercase text-[60px] rotate-180 font-bold"
                            style={{
                              WebkitTextStroke: "1.5px #30584C63",
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                            }}
                          >
                            Emergency Care
                          </h5>
                        </div> */}
                      </section>

                      {/* Why Choose Us Section */}
                      <div className="lg:flex flex-col justify-between w-full lg:flex-row-reverse lg:h-[650px] bg-cover bg-right">
                        {/* Left Vertical Text */}
                        <div className="hidden lg:flex lg:w-2/5 bg-white lg:px-20 items-center justify-start">
                          <h5
                            className="text-transparent text-[60px] rotate-180 font-bold"
                            style={{
                              WebkitTextStroke: "1.5px #30584C63",
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                            }}
                          >
                            WHY CHOOSE
                          </h5>
                        </div>

                        {/* Right Content */}
                        <section className="relative w-full  lg:w-5/5    py-16 md:py-24 px-6 md:px-12 overflow-hidden flex items-center">
                          <div className="w-full  ">
                            <div className="mb-8 animate-fadeInUp">
                              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#222e48]">
                                Why Choose Our Emergency Nannies?
                              </h2>
                              <p className="text-md text-gray-800 leading-relaxed">
                                When childcare emergencies strike, your family
                                deserves more than rushed decisions. We ensure
                                safety, professionalism, and peace of
                                mind—immediately.
                              </p>
                            </div>

                            {/* Features Grid */}
                            <div className="grid md:grid-cols-2 gap-3 lg:gap-3 mb-10">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                                <span className="text-base font-medium">
                                  Guaranteed 6-hour response time
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                                <span className="text-base font-medium">
                                  Highly trained & vetted caregivers
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                                <span className="text-base font-medium">
                                  Safer alternative to desperate last-minute
                                  options
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                                <span className="text-base font-medium">
                                  Immediate continuity and peace of mind
                                </span>
                              </div>
                            </div>

                            {/* CTA Button */}
                            <button
                              onClick={() => setShowForm(!showForm)}
                              className="w-full bg-[#b38f62] text-white py-3 font-semibold hover:bg-[#b38f62] transition mb-4"
                            >
                              {showForm ? "Close Form" : "Book Nanny Now"}
                            </button>
                          </div>

                          {/* Animation */}
                          <style jsx>{`
                            @keyframes fadeInUp {
                              from {
                                opacity: 0;
                                transform: translateY(20px);
                              }
                              to {
                                opacity: 1;
                                transform: translateY(0);
                              }
                            }
                            .animate-fadeInUp {
                              animation: fadeInUp 0.6s ease-out;
                            }
                          `}</style>
                        </section>
                      </div>
                    </div>

                    {/* ⭐ END NEW CONTENT ⭐ */}
                  </div>
                </div>

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
                Emergency Nanny
              </h1>

              <div className="text-lg space-y-8 text-gray-700 leading-relaxed">
                {/* BENEFIT 1 */}
                <div>
                  <h3 className="text-2xl font-bold text-[#244672] mb-3">
                    Backup & Emergency Nanny Services
                  </h3>
                  <p className="mb-2">
                    Our signature service, first of its kind in Kenya.
                  </p>

                  <ul className="list-disc ml-6 space-y-1">
                    <li>Guaranteed deployment in under 6 hours.</li>
                    <li>
                      Perfect when your usual nanny quits, travels, or becomes
                      sick.
                    </li>
                    <li>
                      All nannies are fully background-checked and trained.
                    </li>
                  </ul>

                  <p className="font-semibold text-[#244672] mt-3">
                    Why this matters:
                  </p>

                  <ul className="list-disc ml-6 space-y-1">
                    <li>
                      You never have to panic in an emergency situation again.
                    </li>
                    <li>Your child maintains consistent care and safety.</li>
                  </ul>

                  <ul className="list-disc ml-6 space-y-1">
                    <li>Ideal for Sundays and nanny off-days.</li>
                    <li>
                      Helps when you have church, errands, meetings, or events.
                    </li>
                    <li>Perfect for infants, twins, and busy parents.</li>
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
              {showForm ? "Close Form" : "Hire Nanny Now"}
            </button>
            {/* CONTACT SECTION */}
            <div className="px-4 py-8 space-y-4 text-gray-700">
              <h2 className="text-2xl font-bold text-[#244672]">Contact Us</h2>

              <p>
                <strong>Phone:</strong> 0700 000 000
              </p>
              <p>
                <strong>Email:</strong> support@peckersswiftswerve.co.ke
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
