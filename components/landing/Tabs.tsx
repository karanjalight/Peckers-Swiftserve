"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
interface Service {
  id: number;
  title: string;
  color: string;
  icon: any;
  image: string;
  gradient: string;
  slug: string;
}

export default function ServicesShowcase() {
  const [activeTab, setActiveTab] = useState<string>("Corporate Training");

  const cards: Service[] = [
    {
      id: 4,
      title: "Graduate Medical Rep Training",
      color: "Corporate Training",
      icon: TrainingIcon,
      image: "https://www.netcare.co.za/Portals/_default/Images/Education-training/fecc-02.jpg",
      gradient: "from-indigo-700/30 to-indigo-900/50",
      slug: "services/mr-training",
    },
    {
      id: 5,
      title: "Corporate MR Upskilling",
      color: "Corporate Training",
      icon: TrainingIcon,
      image: "https://www.ku.ac.ke/wp-content/uploads/2025/11/sika3.jpeg",
      gradient: "from-indigo-700/30 to-indigo-900/50",
      slug: "services/mr-upskilling",
    },
    {
      id: 1,
      title: "Backup & Emergency Nannies",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-4-1024x683.jpeg",
      gradient: "from-purple-700/30 to-purple-900/50",
      slug: "services/backup-nannies",
    },
    {
      id: 2,
      title: "Sunday / Day-Bug Nanny Services",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-3-1024x683.jpeg",
      gradient: "from-purple-700/30 to-purple-900/50",
      slug: "services/sunday-nannies",
    },
    {
      id: 3,
      title: "Contract-Managed Nannies",
      color: "Household",
      icon: NannyIcon,
      image: "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-5-1024x683.jpeg",
      gradient: "from-purple-700/30 to-purple-900/50",
      slug: "services/contract-nannies",
    },
    {
      id: 6,
      title: "Performance Dashboards",
      color: "Analytics",
      icon: AnalyticsIcon,
      image: "https://www.slideteam.net/media/catalog/product/cache/1280x720/b/u/business_performance_dashboard_supplier_relationship_management_supplier_strategy_slide01.jpg",
      gradient: "from-blue-700/30 to-blue-900/50",
      slug: "services/performance-dashboards",
    },
    {
      id: 7,
      title: "Temporary Security & Dog Handlers",
      color: "Security",
      icon: SecurityIcon,
      image: "https://www.sgasecurity.com/application/files/4817/0988/9136/k-9-1.jpg",
      gradient: "from-red-700/30 to-red-900/50",
      slug: "services/security-dogs",
    },
  ];

  // Group cards by category
  const collections: Record<string, Service[]> = cards.reduce((acc, card) => {
    if (!acc[card.color]) acc[card.color] = [];
    acc[card.color].push(card);
    return acc;
  }, {} as Record<string, Service[]>);

  const tabs = Object.keys(collections);

  return (
    <div className="bg-white py-16 lg:pt-30 px-4">
      <div className="lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-4">
            Our Service Pillars
          </h1>
          <p className="text-gray-600 text-sm max-w-3xl mx-auto">
            Explore our curated services across different categories. From corporate training to household support and security solutions, we have you covered.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-12 text-lg justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 transition-all duration-300 ${
                activeTab === tab
                  ? "bg-[#b38f62] text-white"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-800 hover:text-purple-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {collections[activeTab]?.map((service, index) => (
            <Link
              key={service.id}
              href={`/${service.slug}`}
              className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 block"
              style={{
                animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide">
                    {service.color}
                  </p>
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <span className="text-sm">Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
