"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// ✅ Define the allowed book collection categories
type BookCollectionCategory = "bestsellers" | "new-releases" | "award-winners";

interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
}

export default function Projects() {
  // ✅ Explicitly type the state to ensure it's one of the categories
  const [activeTab, setActiveTab] = useState<BookCollectionCategory>("bestsellers");

  // ✅ Type-safe book collection object
  const collections: Record<BookCollectionCategory, Project[]> = {
    bestsellers: [
      {
        id: 1,
        title: "Top Fiction Bestsellers",
        category: "Bestsellers",
        image:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
      },
      {
        id: 2,
        title: "Popular Non-Fiction",
        category: "Bestsellers",
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=600&fit=crop",
      },
    ],
    "new-releases": [
      {
        id: 3,
        title: "Latest Fiction Releases",
        category: "New Releases",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
      },
      {
        id: 4,
        title: "Fresh Educational Books",
        category: "New Releases",
        image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop",
      },
    ],
    "award-winners": [
      {
        id: 5,
        title: "Award Winning Novels",
        category: "Award Winners",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
      },
      {
        id: 6,
        title: "Prize-Winning Literature",
        category: "Award Winners",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
      },
    ],
  };

  const tabs: { id: BookCollectionCategory; label: string }[] = [
    { id: "bestsellers", label: "Bestsellers" },
    { id: "new-releases", label: "New Releases" },
    { id: "award-winners", label: "Award Winners" },
  ];

  return (
    <div className=" bg-white py-16 lg:py-12 lg:pb-10 px-4">
      <div className="lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4">
            Featured Book Collections
          </h1>
          <p className="text-gray-600 text-sm max-w-3xl mx-auto">
          Discover our curated collections of bestsellers, new releases, and award-winning books. We carefully select titles that inspire, educate, and entertain readers across Kenya.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-12  text-lg  justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3    transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[#244672] text-white  "
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#244672] hover:text-[#244672]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {collections[activeTab].map((collection: any, index: number) => (
            <div
              key={collection.id}
              className="group relative overflow-hidden  shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
              style={{
                animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Collection Image */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-[#33B200]-400 text-sm font-semibold mb-2 uppercase tracking-wide">
                    {collection.category}
                  </p>
                  <h3 className="text-2xl font-bold mb-2">{collection.title}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <span className="text-sm">Browse Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* See All Projects Button */}
        {/* <div className="text-center">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#244672] border-2 border-[#244672]  font-semibold hover:bg-[#244672] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl group">
            See All Projects
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div> */}
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
