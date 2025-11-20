"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 3 CORE SERVICES (switched with each image)
  const services = [
    {
      title: "Emergency Nanny Dispatch",
      desc: "Instant access to trusted, verified nannies — deployed within minutes.",
      cta: "/services/emergency-nanny",
    },
    {
      title: "Peckers Performance Dashboard",
      desc: "Track nanny performance, hours worked, payments, attendance & more.",
      cta: "/dashboard",
    },
    {
      title: "Home Security",
      desc: "Going out of town? Don't worry we will keep your home safe with our verified trained Dogs and guard",
      cta: "/contact-nanny",
    },
  ];

  const backgroundImages = [
    "https://sashleynannies.co.ke/wp-content/uploads/2023/01/sashley-nannies-13-1024x683.jpeg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/b/u/business_performance_dashboard_supplier_relationship_management_supplier_strategy_slide01.jpg",
    "https://www.blueline-kennels.com/wp-content/uploads/2023/09/Security-Services-Strip-I-scaled.jpg",
  ];

  // Auto switch every 7s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex lg:h-[75vh] h-[70vh] items-center px-6 sm:px-10 md:px-20 overflow-hidden text-white">

      {/* BACKGROUND IMAGES */}
      {backgroundImages.map((image, index) => (
        <motion.div
          key={image}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('${image}')` }}
          animate={{ opacity: currentIndex === index ? 1 : 0 }}
        />
      ))}

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* TEXT + ANIMATION */}
      <div className="relative z-10 lg:mt-32 mt-12 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            className="text-center bg-[#b38f62]/60 lg:px-20 lg:py-10 p-4  md:text-left mt-6 md:mt-6"          >
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold mb-4">
              {services[currentIndex].title}
            </h1>

            <p className="text-white/90 text-sm sm:text-base mb-6">
              {services[currentIndex].desc}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-[#02273f] hover:bg-[#0d141a] lg:py-6 py-2 px-10 text-sm sm:text-base text-lg"
                asChild
              >
                <Link href={services[currentIndex].cta}>Explore Service</Link>
              </Button>

              <Button
                variant="outline"
                className="bg-transparent rounded-none border-white px-8 lg:py-6 py-2 hover:bg-white/10 text-sm sm:text-base"
                asChild
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
