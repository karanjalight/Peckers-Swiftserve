"use client";
import React from "react";
import { ArrowRight } from "lucide-react";

const AboutSection = () => {
  return (
    <div>
      {/* Top About Section */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-10  bg-white">
        {/* Left Image */}
        <div className="w-full   flex justify-start">
          <img
            src="https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-11-1024x683.jpeg"
            alt="About Us"
            className="w-[120vh] lg:h-[60vh] h-[20vh]  object-cover"
            loading="lazy"
          />
        </div>

        {/* Right Content */}
        <div className="w-full lg:px-0 px-4 lg:pb-0 pb-12 space-y-6 relative">
          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            Empowering Businesses & Households with Expert Solutions
          </h2>

          {/* Description */}
          <p className="text-gray-800 leading-relaxed">
            We provide professional services that simplify your life and
            enhance business performance. From corporate training and analytics
            dashboards to reliable nannies and security personnel, we ensure
            top-quality support tailored to your needs.
          </p>

          {/* Icon List */}
          <ul className="space-y-3 text-gray-800">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
              <span>Trusted & Experienced Team</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
              <span>Customized Solutions for Every Client</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#b38f62] rounded-full flex-shrink-0" />
              <span>Commitment to Reliability & Excellence</span>
            </li>
          </ul>

          {/* Button */}
          <a
            href="/services"
            className="relative inline-flex w-full lg:w-60 items-center justify-center gap-2 px-6 py-3 bg-[#b38f62] text-white font-semibold overflow-hidden transition-all duration-500 hover:text-[#13203b] hover:border-green-400 before:absolute before:inset-0 before:bg-white before:w-0 hover:before:w-full before:transition-all before:duration-500 before:rotate-45 before:-translate-x-1/2 before:-translate-y-1/2 before:origin-center before:top-1/2 before:left-1/2 before:h-[500%] before:z-0 z-10"
          >
            <span className="relative z-10">Explore Our Services</span>
            <ArrowRight className="w-4 h-4 rotate-[-45deg] relative z-10" />
          </a>
        </div>
        {/* Stroke Text (rotated) */}
        <div className=" lg:pr-20 lg:mt-40   h-full top-1/2 -translate-y-1/2 hidden md:block">
          <h5
            className="text-transparent uppercase text-[60px] rotate-180 font-bold"
            style={{
              WebkitTextStroke: "1.5px #30584C63 ",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            About us
          </h5>
        </div>
      </section>
      {/* Why Choose Us Section */}
      <div
        className="lg:flex flex-col lg:flex-row lg:h-[650px] bg-cover bg-right"
        style={{ backgroundImage: "url('https://advanceguarding.co.uk/wp-content/uploads/2017/01/Security_dog_1500x630.jpg')" }}
      >
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
        <section className="relative w-full lg:w-2/4 lg:-ml-[50vh] lg:m-20 bg-[#e7f0e9] py-16 md:py-24 px-6 md:px-12 overflow-hidden flex items-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 animate-fadeInUp">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#222e48]">
                Why Choose Us?
              </h2>
              <p className="text-md text-gray-800 leading-relaxed">
                We combine experience, professionalism, and innovation to deliver
                services that truly make a difference. Our team is dedicated to
                helping businesses grow and households thrive with minimal
                stress.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-3 lg:gap-3 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                <span className="text-base font-medium">Professional Training Programs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                <span className="text-base font-medium">Reliable Nanny & Security Services</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                <span className="text-base font-medium">Data-Driven Business Solutions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#b38f62] rounded-full"></div>
                <span className="text-base font-medium">Client-Focused & Transparent</span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#b38f62] text-white w-full justify-center lg:w-60 font-semibold hover:bg-white transition-all duration-500"
            >
              <span>Learn More</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
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
  );
};

export default AboutSection;
