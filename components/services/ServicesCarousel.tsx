"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function InfiniteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState("next");

  const cards = [
    {
      id: 1,
      title: "Home Solar Systems",
      color: "Solar System",
      img: "/install-icon.png",
      slug: "home-solar-systems",
    },
    {
      id: 2,
      title: "Solar Water Heaters",
      color: "Water Heater",
      img: "/install-icon.png",
      slug: "solar-water-heaters",
    },
    {
      id: 3,
      title: "Commercial Solar System",
      color: "Solar System",
      img: "/consult-icon.png",
      slug: "commercial-solar-system",
    },
    {
      id: 4,
      title: "Borehole Solarization",
      color: "Solar Power",
      img: "/consult-icon.png",
      slug: "borehole-solarization",
    },
    {
      id: 5,
      title: "Solar Street Lighting",
      color: "Solar Power",
      img: "/install-icon.png",
      slug: "solar-street-lighting",
    },
    {
      id: 6,
      title: "Energy Audit Consultancy",
      color: "Storage",
      img: "/install-icon.png",
      slug: "energy-audit-consultancy",
    },
  ];
  
  const cardsToShow = 6;
  typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 4;

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < cardsToShow; i++) {
      const index = (currentIndex + i) % cards.length;
      visible.push(cards[index]);
    }
    return visible;
  };

  const visibleCards = getVisibleCards();

  return (
    <div className=" lg:my-0 py-20 bg-green-50 ">
      {/* Header Section */}
      <div className="w-full px-4 sm:px-8 lg:px-20">
        <div className="">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="">
              <h1 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4 text-left">
                Innovative Services to Meet Your Needs
              </h1>
              <p className="text-gray-600 mb-6 text-left text-sm sm:text-base max-w-lg md:w-[65vh]">
                We provide a wide range of renewable energy services, with a
                special focus on wind energy solutions.
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 items-center justify-center lg:justify-end">
              <button
                onClick={handlePrev}
                className="h-10 w-10 sm:h-12 sm:w-12 text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-[#33B200] transition"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="h-10 w-10 sm:h-12 sm:w-12 text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-[#33B200] transition"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="flex items-center lg:px-20 px-4 justify-center mt-6">
        <div className="w-full  ">
          <div className="relative">
            {/* Cards Container */}
            <div className=" ">
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-transform duration-500 ease-in-out ${
                  isAnimating
                    ? direction === "next"
                      ? "-translate-x-4 opacity-90"
                      : "translate-x-4 opacity-90"
                    : "translate-x-0 opacity-100"
                }`}
              >
                {visibleCards.map((card, idx) => (
                  <div key={`${card.id}-${idx}`}>
                    <Link
                      key={card.id}
                      href={`/services/${card.slug}`}
                      className="bg-white p-6 sm:p-8 h-48 sm:h-52  transform transition-all duration-300 flex flex-col items-start justify-between   hover:border hover:border-green-600"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={card.img}
                          alt={card.title}
                          className="h-10 sm:h-12 w-auto object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-gray-600 text-sm opacity-90">
                          {card.color}
                        </p>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
                          {card.title}
                        </h2>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="f lex hidden justify-center gap-2 mt-8">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-[#33B200] w-6 sm:w-8"
                    : "bg-gray-300 hover:bg-gray-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
