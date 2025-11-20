"use client";
import React from "react";
import { ArrowRight, Circle } from "lucide-react";
import TestimonialsSection from "../about/TestimonialCarousel";

const ClientSuccess = () => {
  return (
    <div>
      <div className="flex flex-col lg:mb-0  lg:flex-row h-[650px ]">
        <div
          className="  h-[650px ] bg-cover bg-center bg-no-repeat lg:w-[50%]"
          style={{ backgroundImage: "url('/about-2.JPG')" }}
        ></div>

        {/* Right section with content */}
        <section className=" w-full  md:px-0 overflow-hidden flex flex-col items-start">
          <div className="bg-[#e7f0e9] lg:p-40 lg:py-10 py-20 pb-10 px-4 w-full lg:h-80">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#222e48]">
              Clients' Success Stories
            </h2>
            <p>
              We take pride in the relationships we’ve built with our clients
              and the success stories they’ve shared. Our mission is to deliver
              high-quality renewable energy.
            </p>
          </div>
          <div className="bg-whit   w-full lg:h-100">
            <div className="  lg:pl-36 px-4 lg:-mt-32 m">
              <TestimonialsSection />
            </div>
          </div>
        </section>
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
    </div>
  );
};

export default ClientSuccess;
