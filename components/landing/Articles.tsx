"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image_url?: string;
  published_at?: string;
  created_at: string;
};

type Card = {
  id: string | number;
  title: string;
  color: string;
  img: string;
  slug: string | null;
  date: string | null;
};

interface ArticlesProps {
  blogs?: Blog[];
  limit?: number;
}

export default function Articles({
  blogs: initialBlogs,
  limit = 6,
}: ArticlesProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blogs client-side if not given as props
  useEffect(() => {
    if (initialBlogs && initialBlogs.length > 0) {
      setBlogs(initialBlogs);
      setLoading(false);
      return;
    }

    async function fetchBlogs() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("blogs")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          setBlogs([]);
        } else {
          setBlogs(data || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch blogs"
        );
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [initialBlogs]);

  // Transform Supabase rows to cards
  const displayItems: Card[] = blogs.length
    ? blogs.map((b) => ({
        id: b.id,
        title: b.title,
        color: b.excerpt ?? "Read more about this article…",
        img:
          b.cover_image_url ??
          "https://via.placeholder.com/400x300?text=No+Image",
        slug: b.slug,
        date: b.published_at ?? b.created_at,
      }))
    : [];

  // Carousel
  const itemsPerPage = 3;
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const handleNext = () => {
    if (isAnimating || totalPages <= 1) return;
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % totalPages);
      setIsAnimating(false);
    }, 400);
  };

  const handlePrev = () => {
    if (isAnimating || totalPages <= 1) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((i) =>
        i === 0 ? totalPages - 1 : i - 1
      );
      setIsAnimating(false);
    }, 400);
  };

  const goToSlide = (idx: number) => {
    if (!isAnimating) setCurrentIndex(idx);
  };

  const visibleCards = displayItems.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  );

  const getDay = (d: string | null) =>
    d ? new Date(d).getDate().toString() : "27";
  const getMonth = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short" }) : "Sep";

  const handleCardClick = (slug: string) => router.push(`/blogs/${slug}`);

  return (
    <section className="my-10 mb-20 lg:py-20">
      <div className="w-full px-4 lg:px-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center text-center lg:text-left">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-3">
              News and Articles
            </h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base max-w-md mx-auto lg:mx-0 leading-relaxed">
              Stay updated with the latest insights, tips, and news about household support, corporate productivity, and our services.
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <button
                onClick={handlePrev}
                className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-purple-600 transition"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="h-10 w-10 md:h-12 md:w-12 text-lg md:text-xl border border-gray-600 text-gray-600 hover:text-white hover:bg-purple-600 transition"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex items-center justify-center mt-10">
        <div className="w-full px-4 sm:px-6 lg:px-20">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading articles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No published articles yet. Check back later!
            </p>
          ) : (
            <>
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
                    <article
                      key={card.id}
                      className="bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => card.slug && handleCardClick(card.slug)}
                    >
                      {/* Image */}
                      <div className="relative w-full h-60 sm:h-64 md:h-72 overflow-hidden">
                        <img
                          src={card.img}
                          alt={card.title}
                          className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                        />

                        <div className="absolute bottom-3 right-3 bg-[#FFCA28] text-white text-center p-3 rounded-md shadow-md w-14 sm:w-16">
                          <p className="text-lg font-bold leading-tight">
                            {getDay(card.date)}
                          </p>
                          <p className="text-xs uppercase">
                            {getMonth(card.date)}
                          </p>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="mt-4 px-4">
                        <h2 className="text-base md:text-lg font-semibold mb-1">
                          {card.title}
                        </h2>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {card.color}
                        </p>
                      </div>

                      {/* Read More */}
                      <div className="border-gray-200 p-4 mt-auto">
                        <button
                          className="w-full px-6 py-3 bg-[#b38f62] text-white font-semibold hover:bg-[#2a8f00] transition-colors duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            card.slug &&
                              router.push(`/blogs/${card.slug}`);
                          }}
                        >
                          Read More →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Dots */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-purple-600 w-8"
                          : "bg-gray-300 hover:bg-gray-500"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
