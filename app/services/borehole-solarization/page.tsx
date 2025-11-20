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
  Droplet,
  Zap,
  Settings,
  Database,
  Filter,
} from "lucide-react";

export default function BoreHoleSolar() {
  const [offGrid, setOffGrid] = useState(0);
  const [powerBills, setPowerBills] = useState(10000);
  const [effective, setEffective] = useState(0);

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;

    // Animate Off-Grid
    if (offGrid < 100) {
      interval = setInterval(() => {
        setOffGrid((prev) => Math.min(prev + 2, 100));
      }, 40);
    }
    return () => clearInterval(interval);
  }, [offGrid]);

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;

    // Animate Power Bills
    if (powerBills > 0) {
      interval = setInterval(() => {
        setPowerBills((prev) => Math.max(prev - 333, 0));
      }, 30);
    }
    return () => clearInterval(interval);
  }, [powerBills]);

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;

    // Animate Effective
    if (effective < 100) {
      interval = setInterval(() => {
        setEffective((prev) => Math.min(prev + 2, 100));
      }, 40);
    }
    return () => clearInterval(interval);
  }, [effective]);

  const components = [
    {
      icon: Droplet,
      title: "Solar Panels",
      desc: "Capture sunlight to generate electricity for water pumping.",
    },
    {
      icon: Zap,
      title: "Solar Water Pump",
      desc: "High-efficiency submersible or surface pumps based on water depth.",
    },
    {
      icon: Settings,
      title: "Controller/Inverter",
      desc: "Regulates power flow and ensures optimal pump performance.",
    },
    {
      icon: Database,
      title: "Water Storage Tank",
      desc: "Stores water for use during low sunlight hours.",
    },
    {
      icon: Filter,
      title: "Piping and Filtration System",
      desc: "Ensures clean and efficient water distribution.",
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Borehole"
        highlight="Solarization"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className="lg:mb-10 bg-white lg:px-8 lg:py-8 py-16">
              {/* Header Image */}
              <div className="w-full mb-2">
                <Image
                  src="/boreholesolar.png"
                  alt=" Borehole Solarization"
                  width={832}
                  height={500}
                  className="w-full lg:h-[60vh] h-[20vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4  py-12 md:py-16 plg:t-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6 md:mb-6">
                    Borehole Solarization
                  </h1>

                  {/* Description */}
                  <div className="max-w-4xl space-y-4 text-gray-700">
                    <p>
                      Harness the power of the sun to pump water efficiently
                      with borehole solarization. At Cytek Solar, we provide
                      custom solar water pumping solutions for homes, farms,
                      schools, industries, and community water projects. Our
                      solar-powered borehole systems eliminate reliance on
                      expensive and unreliable electricity or diesel generators,
                      ensuring continuous water supply at minimal operating
                      costs.
                    </p>

                    <div className="bg-[#f0f9ff] border-l-4 border-[#33B200] p-4 mt-6">
                      <p className="text-gray-800 font-semibold">
                        💰 LIPA POLE POLE Scheme Available
                      </p>
                      <p className="text-gray-700 mt-2">
                        Pay just 10% deposit, we undertake the installation and
                        you pay the balance in 12 monthly installments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="px-4  py-12 md:py-20 bg-[#33B200]">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">
                    Ensure a constant supply of water at all time
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Off-Grid Counter */}
                    <div className="text-center">
                      <div className="b bg-opacity-10 backdrop-blur-sm  p-8 mb-4">
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          {offGrid}%
                        </div>
                        <p className="text-white text-lg">Off-Grid</p>
                      </div>
                    </div>

                    {/* Power Bills Counter */}
                    <div className="text-center">
                      <div className="bg-white/30 bg-opacity-10 backdrop-blur-sm  p-8 mb-4">
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          ${powerBills.toLocaleString()}
                        </div>
                        <p className="text-white text-lg">Power Bills Saved</p>
                      </div>
                    </div>

                    {/* Effectiveness Counter */}
                    <div className="text-center">
                    <div className="bg-white/30 bg-opacity-10 backdrop-blur-sm  p-8 mb-4">
                        <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                          {effective}%
                        </div>
                        <p className="text-white text-lg">Effective</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* How It Works Section */}
                <div className="px-4  py-12 md:py-20">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
                    How Borehole Solarization Works
                  </h2>

                  <p className="text-gray-700 text-lg mb-12 max-w-4xl">
                    Our solar borehole pumping systems use solar panels to
                    generate electricity, which powers a submersible or surface
                    pump to extract water from underground sources. The water is
                    then stored in elevated tanks or direct-use systems.
                  </p>

                  {/* Key Components */}
                  <div>
                    <h3 className="text-2xl font-bold text-[#244672] mb-8">
                      Key Components of a Borehole Solar System
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {components.map((component, idx) => {
                        const Icon = component.icon;
                        return (
                          <div
                            key={idx}
                            className="bg-gradient-to-br from-[#f0f9ff] to-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-[#33B200]  flex-shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-[#244672] mb-2">
                                  {component.title}
                                </h4>
                                <p className="text-gray-700 text-sm">
                                  {component.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="px-4  py-12 md:py-20 bg-gray-50">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#244672] mb-8 text-center">
                      Why Choose Solar Borehole Solarization?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#33B200] rounded-full mt-1 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-[#244672] mb-1">
                              Cost Effective
                            </h4>
                            <p className="text-gray-700 text-sm">
                              Eliminate expensive electricity and diesel
                              generator costs
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#33B200] rounded-full mt-1 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-[#244672] mb-1">
                              Reliable Supply
                            </h4>
                            <p className="text-gray-700 text-sm">
                              Ensures continuous water access independent of the
                              grid
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#33B200] rounded-full mt-1 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-[#244672] mb-1">
                              Low Maintenance
                            </h4>
                            <p className="text-gray-700 text-sm">
                              Minimal moving parts means reduced maintenance
                              requirements
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-[#33B200] rounded-full mt-1 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-[#244672] mb-1">
                              Eco-Friendly
                            </h4>
                            <p className="text-gray-700 text-sm">
                              Zero emissions and sustainable water pumping
                              solution
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="px-4  py-12 md:py-16">
                  <div className="max-w-2xl mx-auto text-center">
                    <button className="px-8 py-3 bg-[#33B200] text-white  font-semibold hover:bg-[#2a9500] transition-colors">
                      Get Your Borehole Solar System Today
                    </button>
                    <p className="text-gray-700 mt-4">
                      With our LIPA POLE POLE financing, it's more affordable
                      than ever!
                    </p>
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
