"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// Your SVG Icons remain the same (NannyIcon, TrainingIcon, etc.)
const NannyIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="8" fill="white" opacity="0.3"/>
    <circle cx="32" cy="20" r="6" fill="white"/>
    <path d="M20 48C20 38 24 32 32 32C40 32 44 38 44 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M26 36L22 42M38 36L42 42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="22" cy="44" r="3" fill="white" opacity="0.8"/>
    <circle cx="42" cy="44" r="3" fill="white" opacity="0.8"/>
  </svg>
);

const TrainingIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="24" width="32" height="28" rx="2" fill="white" opacity="0.3"/>
    <path d="M32 12L16 20V24H48V20L32 12Z" fill="white"/>
    <rect x="20" y="28" width="6" height="20" fill="white" opacity="0.7"/>
    <rect x="29" y="28" width="6" height="20" fill="white" opacity="0.7"/>
    <rect x="38" y="28" width="6" height="20" fill="white" opacity="0.7"/>
    <rect x="14" y="52" width="36" height="2" fill="white"/>
  </svg>
);

const SecurityIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8L16 16V28C16 40 24 48 32 56C40 48 48 40 48 28V16L32 8Z" fill="white" opacity="0.3"/>
    <path d="M32 12L20 18V28C20 38 26 44 32 50C38 44 44 38 44 28V18L32 12Z" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M28 30L30.5 33L36 26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="40" width="10" height="16" rx="2" fill="white" opacity="0.8"/>
    <rect x="27" y="28" width="10" height="28" rx="2" fill="white"/>
    <rect x="42" y="20" width="10" height="36" rx="2" fill="white" opacity="0.8"/>
    <circle cx="17" cy="18" r="3" fill="white"/>
    <circle cx="32" cy="14" r="3" fill="white"/>
    <circle cx="47" cy="10" r="3" fill="white"/>
    <path d="M17 18L32 14M32 14L47 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DogIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="36" rx="14" ry="12" fill="white" opacity="0.3"/>
    <path d="M20 24L18 16C18 16 16 14 18 12C20 10 22 12 22 12L24 20" fill="white" opacity="0.8"/>
    <path d="M44 24L46 16C46 16 48 14 46 12C44 10 42 12 42 12L40 20" fill="white" opacity="0.8"/>
    <circle cx="32" cy="28" r="12" fill="white"/>
    <circle cx="28" cy="26" r="2" fill="#7C3AED"/>
    <circle cx="36" cy="26" r="2" fill="#7C3AED"/>
    <path d="M32 30L32 34M30 34C30 34 32 36 34 34" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="26" cy="42" rx="4" ry="8" fill="white"/>
    <ellipse cx="38" cy="42" rx="4" ry="8" fill="white"/>
  </svg>
);
export default function InfiniteCarousel() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState("next");
  const [cardsPerPage, setCardsPerPage] = useState(1);

  const cards = [
    {
      id: 4,
      title: "Graduate Medical Rep Training",
      color: "Corporate Training",
      icon: TrainingIcon,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC2xi73BKZlVu4dSst8Pfza0TEega04jpMmg&s",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/mr-training",
    },
    {
      id: 5,
      title: "Corporate MR Upskilling",
      color: "Corporate Training",
      icon: TrainingIcon,
      image: "https://www.ku.ac.ke/wp-content/uploads/2025/11/sika3.jpeg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/mr-upskilling",
    },
    {
      id: 1,
      title: "Backup & Emergency Nannies",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-4-1024x683.jpeg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/backup-nannies",
    },
    {
      id: 2,
      title: "Sunday / Day-Bug Nanny Services",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-3-1024x683.jpeg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/sunday-nannies",
    },
    {
      id: 3,
      title: "Contract-Managed Nannies",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-5-1024x683.jpeg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/contract-nannies",
    },
    
    {
      id: 6,
      title: "Performance Dashboards",
      color: "Analytics",
      icon: AnalyticsIcon,
      image: "https://www.slideteam.net/media/catalog/product/cache/1280x720/b/u/business_performance_dashboard_supplier_relationship_management_supplier_strategy_slide01.jpg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/performance-dashboards",
    },
    {
      id: 7,
      title: "Temporary Security & Dog Handlers",
      color: "Security",
      icon: SecurityIcon,
      image: "https://www.sgasecurity.com/application/files/4817/0988/9136/k-9-1.jpg",
      gradient: "from-gray-900/60 to-indigo-900/50",
      slug: "services/security-dogs",
    },
  ];

  useEffect(() => {
    const updateCardsPerPage = () => {
      const width = window.innerWidth;
      let newCardsPerPage = 1;
      if (width < 640) newCardsPerPage = 1;
      else if (width < 1024) newCardsPerPage = 2;
      else if (width < 1440) newCardsPerPage = 3;
      else newCardsPerPage = 4;
      setCardsPerPage(newCardsPerPage);
      setCurrentPage(0);
    };
    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  const totalPages = Math.ceil(cards.length / cardsPerPage);
  const allCardsVisible = cardsPerPage >= cards.length;

  const handleNext = () => {
    if (isAnimating || allCardsVisible) return;
    setIsAnimating(true);
    setDirection("next");
    setCurrentPage((prev) => (prev + 1) % totalPages);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrev = () => {
    if (isAnimating || allCardsVisible) return;
    setIsAnimating(true);
    setDirection("prev");
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const visibleCards = cards.slice(currentPage * cardsPerPage, currentPage * cardsPerPage + cardsPerPage);

  return (
    <div className="my-10 lg:py-20 bg-[#d4b97f]">
      <div className="w-full px-4  sm:px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl py-6 md:text-5xl font-bold text-[#02273f] mb-4 text-left">
              Explore Our Services
            </h1>
            <p className="text-gray-600 mb-6 text-left text-sm sm:text-base max-w-lg md:w-[65vh]">
              Peckers Services Ltd offers household support, corporate training, security, and analytics solutions. Browse our service categories:
            </p>
          </div>
          {!allCardsVisible && (
            <div className="flex gap-3 items-center justify-center lg:justify-end">
              <button 
                onClick={handlePrev} 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg border-2 border-[#02273f] text-[#02273f] hover:text-white hover:bg-[#02273f] hover:border-[#02273f] transition-all duration-300 flex items-center justify-center font-semibold text-xl shadow-sm hover:shadow-md"
              >
                ←
              </button>
              <button 
                onClick={handleNext} 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg border-2 border-[#02273f] text-[#02273f] hover:text-white hover:bg-[#02273f] hover:border-[#02273f] transition-all duration-300 flex items-center justify-center font-semibold text-xl shadow-sm hover:shadow-md"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center lg:px-20 px-4 justify-center my-6">
        <div className="w-full">
          <div className="relative">
            <div className="py-2">
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 transition-all duration-600 ${
                  isAnimating
                    ? direction === "next"
                      ? "-translate-x-8 opacity-80 scale-95"
                      : "translate-x-8 opacity-80 scale-95"
                    : "translate-x-0 opacity-100 scale-100"
                }`}
              >
                {visibleCards.map((card, idx) => {
                  const IconComponent = card.icon;
                  return (
                    <Link
                      key={`${card.id}-${idx}`}
                      href={`/${card.slug}`}
                      className="relative group   overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-72"
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <img 
                          src={card.image} 
                          alt={card.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient}`} />
                      </div>

                      {/* Content */}
                      <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full justify-between">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4">
                          <IconComponent />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-white font-semibold uppercase tracking-wider mb-1">
                            {card.color}
                          </p>
                          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-2">{card.title}</h2>
                          <span className="inline-flex items-center text-sm text-white font-medium opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                            Learn more
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {!allCardsVisible && (
            <div className="flex justify-center gap-2 my-8">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentPage(idx); setIsAnimating(false); }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentPage
                      ? "bg-white w-8 sm:w-10"
                      : "bg-gray-300 hover:bg-gray-400 w-2.5"
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
