"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/HeroComponent";
import Faqs from "@/components/services/Faqs";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle,
  Zap,
  TrendingDown,
  Leaf,
  Gauge,
  FileText,
  ChevronDown,
} from "lucide-react";

export default function EnergyAuditConsultancy() {
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);

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
      title: "Initial Assessment & Data Collection",
      items: [
        "On-site inspection of electrical systems, solar setups, HVAC, lighting, and machinery.",
        "Energy consumption analysis using smart meters and monitoring devices.",
      ],
    },
    {
      number: "2️⃣",
      title: "Load Analysis & Power Factor Optimization",
      items: [
        "Evaluate peak demand times and identify power wastage.",
        "Recommend power factor correction solutions to enhance efficiency.",
      ],
    },
    {
      number: "3️⃣",
      title: "Energy Loss Detection & Recommendations",
      items: [
        "Identify hidden power leaks, inefficient appliances, and outdated equipment.",
        "Suggest energy-efficient appliances, LED lighting, and smart automation solutions.",
      ],
    },
    {
      number: "4️⃣",
      title: "Renewable Energy Integration",
      items: [
        "Assess feasibility for solar power installations to cut reliance on grid electricity.",
        "Provide a cost-benefit analysis of solar energy investment.",
      ],
    },
    {
      number: "5️⃣",
      title: "Report & Implementation Plan",
      items: [
        "Deliver a detailed audit report with energy-saving recommendations.",
        "Provide an implementation roadmap to achieve measurable reductions in electricity usage.",
      ],
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Energy Audit "
        highlight=" Consultancy"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className=" lg:mb-10 bg-white lg:px-8 lg:py-8  p-4">
              {/* Header Image */}
              <div className="w-full mb-2">
                <Image
                  src="/energy-audit-consultancy2.webp"
                  alt=" Borehole Solarization"
                  width={832}
                  height={500}
                  className=" w-full lg:h-[60vh] h-[20vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 lg:px-4 py-12 md:py-16">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12">
                    Energy Audit Consultancy
                  </h1>


                  {/* Introduction */}
                  <div className="max-w-4xl text-gray-700 mb-12">
                    <p className="text-lg">
                      At Cytek Solar, we offer comprehensive energy audit
                      consultancy services to help businesses, industries, and
                      homeowners identify inefficiencies, reduce energy
                      consumption, and lower electricity costs. Our energy
                      audits provide data-driven insights into how energy is
                      used within a facility, allowing for strategic
                      improvements and cost-saving solutions.
                    </p>
                  </div>
                </div>

                {/* Why Get an Energy Audit Section */}
                <div className="py-12 md:py-10 ">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-12 text-center">
                    Why Get an Energy Audit?
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {benefits.map((benefit, idx) => {
                      const Icon = benefit.icon;
                      return (
                        <div
                          key={idx}
                          className="bg-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#33B200]  flex-shrink-0">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#244672] mb-2">
                                {benefit.title}
                              </h3>
                              <p className="text-gray-700 text-sm">
                                {benefit.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Energy Audit Process Section */}
                <div className="px-4 lg:px-4 py-12 md:py-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-12 text-center">
                    Our Energy Audit Process
                  </h2>

                  <div className="max-w-6xl mx-auto space-y-4">
                    {auditProcess.map((step, idx) => (
                      <div
                        key={idx}
                        className="border border-[#e0e7ff]  overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedProcess(
                              expandedProcess === idx ? null : idx
                            )
                          }
                          className="w-full px-6 py-4 bg-gradient-to-r from-[#f0f9ff] to-white hover:from-[#e0f2ff] hover:to-[#f5faff] transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <span className="text-3xl">{step.number}</span>
                            <h3 className="font-semibold text-[#244672]">
                              {step.title}
                            </h3>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-[#33B200] transition-transform ${
                              expandedProcess === idx ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expandedProcess === idx && (
                          <div className="px-6 py-4 bg-white border-t border-[#e0e7ff] space-y-3">
                            {step.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex gap-3 items-start"
                              >
                                <div className="w-5 h-5 bg-[#33B200] rounded-full flex-shrink-0 mt-1"></div>
                                <p className="text-gray-700">{item}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Process Flow Visual */}
                <div className="px-4 lg:px-4 py-12 md:py-20 bg-green-50">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#244672] mb-12 text-center">
                    Energy Audit Journey
                  </h2>

                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {auditProcess.map((step, idx) => (
                        <div key={idx} className="text-center">
                          <div className="bg-[#33B200] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                            {idx + 1}
                          </div>
                          <h4 className="font-semibold text-[#244672] text-sm">
                            {step.title.split(" & ")[0].split("&")[0]}
                          </h4>
                          {idx < auditProcess.length - 1 && (
                            <div className="hidden lg:block absolute right-0 top-8 w-full">
                              <div className="h-0.5   mx-2"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Benefits Overview */}
                <div className="px-4 lg:px-4 py-12 md:py-20">
                  <div className="max-w-4xl mx-auto bg-[#33B200]  p-8 md:p-12 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">
                      What You Get From Our Energy Audit
                    </h2>
                    <ul className="space-y-4">
                      <li className="flex gap-3 items-start">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span>
                          Comprehensive analysis of your current energy
                          consumption patterns
                        </span>
                      </li>
                      <li className="flex gap-3 items-start">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span>
                          Identification of inefficiencies and cost-saving
                          opportunities
                        </span>
                      </li>
                      <li className="flex gap-3 items-start">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span>
                          Customized recommendations for energy optimization
                        </span>
                      </li>
                      <li className="flex gap-3 items-start">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span>
                          Detailed implementation roadmap with measurable
                          targets
                        </span>
                      </li>
                      <li className="flex gap-3 items-start">
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        <span>
                          ROI projections for energy-saving investments
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="px-4 lg:px-4 py-12 md:py-16">
                  <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#244672] mb-4">
                      Ready to Optimize Your Energy Usage?
                    </h2>
                    <p className="text-gray-700 mb-8">
                      Let our experts conduct a comprehensive energy audit for
                      your facility and unlock significant savings.
                    </p>
                    <button className="px-8 py-3 bg-[#33B200] text-white font-semibold  hover:bg-[#2a9500] transition-colors">
                      Schedule Your Energy Audit
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-12 border-t border-gray-200"></div>

              {/* Footer Section */}
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                {/* Tags */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-[#33B200] font-medium">
                    Popular Tag
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="#33B200"
                      stroke="#33B200"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
                    </svg>
                  </span>
                  <div className="flex gap-2">
                    <a
                      href="#"
                      className="bg-green-100 text-[#33B200] px-3 py-1  text-sm hover:bg-green-200"
                    >
                      Solar
                    </a>
                    <a
                      href="#"
                      className="bg-green-100 text-[#33B200] px-3 py-1  text-sm hover:bg-green-200"
                    >
                      Energy
                    </a>
                  </div>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-[#33B200] font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="#33B200"
                      stroke="#33B200"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
                    </svg>
                    Follow
                  </span>
                  <div className="flex gap-3 text-[#33B200]">
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Facebook size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Twitter size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Instagram size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <Faqs />
          </section>
      </div>

      <Footer />
    </main>
  );
}
