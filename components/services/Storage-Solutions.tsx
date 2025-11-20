"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

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

export default function Sidebar() {
  const [search, setSearch] = useState("");

  // Filter cards by search text
  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    return cards.filter((card) =>
      card.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Extract unique categories from filtered cards
  const filteredCategories = useMemo(() => {
    const unique = Array.from(new Set(filteredCards.map((card) => card.color)));
    return unique;
  }, [filteredCards]);

  return (
    <aside className="bg-white lg:px-8 lg:py-10 py-10  px-4 space-y-8 w-full">
      {/* Search */}
      <div>
        <h3 className="text-2xl font-semibold mb-2 text-gray-800">Search</h3>
        <div className="border-t border-dotted border-gray-400 mb-3"></div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#e1ecdf] border border-gray-300 py-2 px-3 focus:outline-none "
          />
          <svg
            className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z" />
          </svg>
        </div>
      </div>

      {/* Category List */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">Category</h3>
        <div className="border-t border-dotted border-gray-400 mb-3"></div>
        {filteredCategories.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredCategories.map((cat) => {
              const item = filteredCards.find((c) => c.color === cat);

              // ✅ Skip rendering if no matching item (fixes TS error)
              if (!item) return null;

              return (
                <Link
                  href={`/services/${item.slug}`} // ✅ Always prefix with /
                  key={cat}
                  className="flex items-center gap-3 lg:gap-6 bg-[#e1ecdf] hover:bg-[#d3e7d0] transition-colors p-3 lg:p-6 cursor-pointer"
                >
                  {item.img && (
                    <Image
                      src={item.img}
                      alt={cat}
                      width={32}
                      height={32}
                      className="object-contain lg:h-8"
                    />
                  )}
                  <span className="text-gray-800 font-medium">{item.title}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-2">No categories found.</p>
        )}
      </div>
    </aside>
  );
}
