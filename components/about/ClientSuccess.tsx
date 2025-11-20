"use client";
import React from "react";
import { ArrowRight, Circle } from "lucide-react";
import TestimonialsSection from "./TestimonialCarousel";


const ClientSuccess = () => {
  return (
    <div>
      <div
        className="flex flex-col lg:flex-row h-[650px ] bg-contain bg-right bg-no-repeat"
        style={{ backgroundImage: "url('/about-2.JPG')" }}
      >
        {/* Left section with big vertical text */}
        <div className="hidden uppercase lg:flex w-2/5 bg-white lg:px-20 items-center justify-start">
          <h5
            className="text-transparent text-[60px] rotate-180 font-bold"
            style={{
              WebkitTextStroke: "1.5px #30584C63 ",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            Testimonial
          </h5>
        </div>

        {/* Right section with content */}
        <section className="relative w-full lg:w-2/4 lg:-ml-[40vh] lg:m-20 bg-[#e7f0e9] py-16 md:py-16 px-6 md:px-12 overflow-hidden flex items-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 animate-fadeInUp">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#222e48]">
                Clients' Success Stories
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our clients' satisfaction is at the heart of everything we do.
                We are proud to have had the opportunity to represent and assist
                numerous individuals
              </p>
            </div>

            {/* Features Grid */}
           <TestimonialsSection />

            {/* CTA Button */}
             
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

export default ClientSuccess;
