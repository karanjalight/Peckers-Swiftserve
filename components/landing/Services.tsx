"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Sun, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const services = [
    { title: "Household Staffing", icon: "👶" },
    { title: "Pharma Training", icon: "💊" },
    { title: "Performance Analytics", icon: "📊" },
    { title: "Corporate Solutions", icon: "🏢" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [services.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-end  ">
      <div className="relative lg:w-1/3 lg:h-[70vh] h-[30vh]">
        {/* Adjust h-64 to your desired height */}
        <img
          src="https://insightsocial.org/wp-content/uploads/2023/11/Impacto-cultural.jpg"
          alt="Books Buddies"
          className="object-cover object-top w-full h-full"
        />
        <div className="absolute bottom-0 right-0 bg-white text-gray-700 px-5 lg:py-6 ">
          <div>
            <h2 className="lg:text-3xl text-xl font-bold " >
                Verified
            </h2>
            <p className="text-sm">
                Service Provider
            </p>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-2/3">
        <div className="  flex items-center justify-center">
          <div className="max-w-6xl  w-full  backdrop-blur-sm   p-4 ">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#02273f] my-6 leading-tight">
              About Us
            </h1>

            {/* Subheading */}
            <p className="text-gray-600 text-md mb-12 max-w-2xl">
              Peckers Services Ltd operates at the intersection of family reliability, workplace efficiency, and modern lifestyle convenience. We bring together Household Support, Corporate Training, and Performance Analytics under one trusted brand.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 lg:divide-x-2 divide-gray-300 md:grid-cols-2 gap-8 mb-12">
              {/* Feature 1: 24 Hours Support */}
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3  flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <img
                      src="/landing-1.png"
                      alt="24 Hours Support"
                      className="h-9 w-auto"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#02273f] text-lg mb-2">
                    6-Hour Deployment
                  </h3>
                  <p className="text-gray-600 text-md lg:pr-5">
                    Fast response time for <br /> backup nannies when <br /> you need them most.
                  </p>
                </div>
              </div>

              {/* Feature 2: Affordable Cost Installation */}
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3  flex-shrink-0">
                  <img src="/landing-1.png"
                      alt="Professional Services"
                      className="h-9 w-auto"
                    />
                </div>
                <div>
                  <h3 className="font-bold text-[#02273f] text-lg mb-2">
                    100% Vetted Staff
                  </h3>
                  <p className="text-gray-600 text-md">
                    All our staff are trained, <br /> vetted, and accountable.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkmark Features */}
            <div className="grid text-md grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">
                  Backup & Emergency Nannies
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Pharma & Corporate Training</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">
                  Performance Dashboards & Analytics
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#02273f] flex-shrink-0" />
                <span className="text-gray-700">Technology-Backed Services</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="flex lg:w-60 w-full text-center justify-center items-center gap-2 px-6 py-3 border-2 border-[#b38f62] text-[#8a5f2c]  font-semibold hover:bg-[#b38f62] hover:text-white transition-all duration-300 group">
                Our Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="flex lg:w-60 w-full text-center justify-center items-center gap-2 px-6 py-3 bg-[#b38f62] text-white  font-semibold hover:bg-sky-500 transition-all duration-300 shadow-lg hover:shadow-xl group">
                Contact Us
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
