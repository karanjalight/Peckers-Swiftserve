"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  
  const testimonials = [
    {
      id: 1,
      name: "Simba Energy",
      text: `"Thank you for your professional and timely installation of our solar system. We felt the difference the next day. We wanted to lessen our energy use and save money and we are already doing both. Our latest electric statement quantifies our initial savings. We used 269 less kWs and paid Kes.5,946 less than the prior month."`,
      rating: 5,
      video: {
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu6Jx21JqFMnskOQAf7HChYFa1NzpE9EYNPg&s",
        name: "Representative, Simba Energy",
        role: "Corporate Client",
      },
    },
    {
      id: 2,
      name: "Fortune Sacco",
      text: `"Cytek Solar are very professional people. Great work and support. I love the monitoring system because it has enlightening minute-by-minute production reports. I encourage people to install their solar power systems because they are efficient."`,
      rating: 5,
      video: {
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWD8lxPtD6pyG2D8ML3muvXdlAuUzTkdclOQ&s",
        name: "Representative, Fortune Sacco",
        role: "Financial Institution Client",
      },
    },
    {
      id: 3,
      name: "Elmel Resort & Spa",
      text: `"The crew that performed the work was very respectful, knowledgeable, timely, courteous, and professional at all times. We thank you very much for your support and follow-up."`,
      rating: 5,
      video: {
        thumbnail: "https://www.elmerresortspa.com/wp-content/uploads/2021/09/logo.png",
        name: "Manager, Elmel Resort & Spa",
        role: "Hospitality Client",
      },
    },
    {
      id: 4,
      name: "Nyeri Golf Club",
      text: `"We are happy that we installed Solar systems from Cytek Solar. Our electricity bill has gone down significantly. The systems are working well, and we get support every time we need them. We recommend their systems to anyone."`,
      rating: 5,
      video: {
        thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNyMto5SAfY9AQBPD9fZl-8mUHVHrjE--7KA&s",
        name: "Representative, Nyeri Golf Club",
        role: "Commercial Client",
      },
    },
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="w-full lg:mt-0 relative overflow-hidden">
      {/* Carousel Container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 83.3333}%)`, // ~1 and 1/3 slide width
        }}
      >
        {testimonials.map((t, i) => (
          <div key={i} className="w-[83.3333%] flex-shrink-0 pr-4 sm:px-6">
            <div className="bg-[#33B200] shadow-md lg:p-8 p-4 transition-all duration-500  ">
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`w-5 h-5 ${
                      j < Math.floor(t.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : j < t.rating
                        ? "fill-yellow-400 text-yellow-400 opacity-50"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-50 text-lg leading-relaxed mb-6">
                {t.text}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={t.video.thumbnail}
                  alt={t.video.name}
                  className="h-16 w-16 object-cover rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-100 text-lg">
                    {t.name}
                  </p>
                  <p className="text-gray-100 text-lg">{t.video.role}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start mt-10  justify-start gap-3">
        <button
          onClick={handlePrev}
          className="w-12 h-12 border-2 border-gray-300  flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleNext}
          className="w-12 h-12 border-2 border-gray-300  flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex items-start  justify-start mb-4 gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2  rounded-full  transition-all ${
              i === currentIndex ? "w-8 rounded-full bg-[#33B200]" : "w-2 bg-gray-300"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
