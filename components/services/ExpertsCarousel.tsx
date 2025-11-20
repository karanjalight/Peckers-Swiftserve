"use client";
import React, { useState } from "react";

interface Card {
  id: number;
  title: string;
  color: string;
  img: string;
}

// Your 7 cards data
const cards = [
  {
    id: 1,
    title: "Mike ",
    color: "CEO",
    img: "/about-2.JPG",
  },
  {
    id: 2,
    title: "Grace Mwangi",
    color: "Admin Sales",
    img: "/about-3.JPG",
  },
  {
    id: 3,
    title: "Angela",
    color: "Marketing",
    img: "/about-1.JPG",
  },
  {
    id: 4,
    title: "Leah",
    color: "Customer Care",
    img: "/about-4.JPG",
  },
];

export default function ExpertsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const handleNext = () => {
    if (isAnimating) return;
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(cards.length / 3));
      setIsAnimating(false);
    }, 400);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? Math.ceil(cards.length / 3) - 1 : prev - 1
      );
      setIsAnimating(false);
    }, 400);
  };

  // Slice the cards for the current "page" of 3
  const visibleCards = cards.slice(currentIndex * 3, currentIndex * 3 + 3);

  return (
    <div className="bg-white my-10 lg:py-10 pb-20 lg:my-20 ">
      <div className="w-full px-4 lg:px-20">
        {/* Header Section */}
        <div className="flex flex-col py-10 pb-5 lg:flex-row justify-between items-center   text-center lg:text-left">
          <div className="">
            <h1 className="text-3xl md:text-5xl font-bold text-[#244672] mb-3">
              Meet Our Solar Experts
            </h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base max-w-2xl mx-auto lg:mx-0">
              Our team is made up of dedicated professionals who share a passion
              for clean energy and a commitment to excellence.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={handlePrev}
              className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-[#33B200] transition"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-[#33B200] transition"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex items-center lg:px-20 justify-center mt-5">
        <div className="w-full lg:px-0 px-4 ">
          <div className="overflow-hidden">
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-transform duration-500 ease-in-out ${
                isAnimating
                  ? direction === "next"
                    ? "-translate-x-4 opacity-90"
                    : "translate-x-4 opacity-90"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {visibleCards.map((card) => (
                <div
                  key={card.id}
                  className=" border border-[#33B200] flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-start p-6 justify-between  bg-transparent overflow-hidden">
                    <div className="relative w-full h-60 sm:h-64 md:h-72 overflow-hidden flex items-center justify-center group">
                      {/* Image */}
                      <img
                        src={card.img}
                        alt={card.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* ID / Action button area */}
                      <div className="absolute bottom-0 right-0 flex items-center">
                        {/* Icons (hidden until hover) */}
                        <div className="flex items-center gap-2 opacity-0 translate-x-5 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out mr-2">
                          {/* Facebook */}
                          <a
                            href="#"
                            className="flex items-center justify-center w-16 h-16 bg-[#33B200] text-[#222e48] text-xl hover:bg-white transition-all duration-300"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 2.04c-5.5 0-10 4.49-10 10.02c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89c1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02"
                              />
                            </svg>
                          </a>
                          {/* X / Twitter */}
                          <a
                            href="#"
                            className="flex items-center justify-center w-16 h-16 bg-[#33B200] text-[#222e48] text-xl hover:bg-white transition-all duration-300"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6"
                              viewBox="0 0 24 24"
                            >
                              <g fill="currentColor">
                                <path d="M1 2h2.5L3.5 2h-2.5zM5.5 2h2.5L7.2 2h-2.5z">
                                  <animate
                                    fill="freeze"
                                    attributeName="d"
                                    dur="0.4s"
                                    values="M1 2h2.5L3.5 2h-2.5zM5.5 2h2.5L7.2 2h-2.5z;M1 2h2.5L18.5 22h-2.5zM5.5 2h2.5L23 22h-2.5z"
                                  />
                                </path>
                                <path d="M3 2h5v0h-5zM16 22h5v0h-5z">
                                  <animate
                                    fill="freeze"
                                    attributeName="d"
                                    begin="0.4s"
                                    dur="0.4s"
                                    values="M3 2h5v0h-5zM16 22h5v0h-5z;M3 2h5v2h-5zM16 22h5v-2h-5z"
                                  />
                                </path>
                                <path d="M18.5 2h3.5L22 2h-3.5z">
                                  <animate
                                    fill="freeze"
                                    attributeName="d"
                                    begin="0.5s"
                                    dur="0.4s"
                                    values="M18.5 2h3.5L22 2h-3.5z;M18.5 2h3.5L5 22h-3.5z"
                                  />
                                </path>
                              </g>
                            </svg>
                          </a>
                        </div>

                        {/* Main “+” Button */}
                        <div className="flex items-center justify-center w-20 h-20 bg-[#33B200] text-[#222e48] text-3xl font-light group-hover:scale-110 transition-transform duration-500">
                          +
                        </div>
                      </div>
                    </div>

                    {/* Text Section */}
                    <div className="text-left w-full ">
                      <div className="flex justify-between w-full   gap-4">
                        <div className="flex flex-col h-20  justify-around items-start">
                          <div>
                            <div className="text-base md:text-lg font-semibold">
                              {card.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {card.color}
                            </div>
                          </div>
                        </div>
                        <div className="border flex items-center w-20 h-20 justify-center border-[#33B200] ">
                          <div>{card.id}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(cards.length / 3) }).map(
              (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-[#33B200] w-8"
                      : "bg-gray-300 hover:bg-gray-500"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
