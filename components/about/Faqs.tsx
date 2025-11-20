"use client";
import React from "react";
import { ArrowRight, Circle } from "lucide-react";
import TestimonialsSection from "./TestimonialCarousel";
import FAQSection from "./FaqsAll";
import ContactForm from "./ContactUs";
const Faqs = () => {
  return (
    <div>
      <div
        className="flex flex-col lg:flex-row-reverse h-auto lg:h-[650px ] bg-contain"
        style={{ backgroundImage: "url('/about-1.JPG')" }}
      >
        {/* Left section with big vertical text */}
        <div className="hiddn lg:flex flex-row-reverse lg:w-[70%] bg-[#e7f0e9] lg:p-20 items-center justify-start">
          {/* Left section with big vertical text */}
          <div className="hidden lg:flex lg:-ml-20 lg:w-20 lg:px-20 items-center justify-start">
            <h5
              className="text-transparent text-[60px] rotate-180 font-bold"
              style={{
                WebkitTextStroke: "1.5px #30584C63 ",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
             FAQS
            </h5>
          </div>
          <FAQSection />
        </div>

        {/* Right section with content */}
        <section className="relative w-full lg:w-1/4 lg:-mr-[10vh] lg:m-20 bg-white py-16 md:p-10 px-6 m overflow-hidden flex items-center">
          <div className=" ">
            <ContactForm />
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

export default Faqs;
