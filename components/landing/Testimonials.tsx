"use client";
import React, { useRef, useEffect } from "react";
import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Mwangi",
      text: "Peckers Services saved us when our nanny quit suddenly. They deployed a backup nanny within 6 hours! The staff was professional, trained, and our kids loved her. We now use their Sunday services regularly.",
      rating: 5,
      role: "Working Mother",
      image: "https://ui-avatars.com/api/?name=Sarah+Mwangi&background=33B200&color=fff&size=128",
    },
    {
      id: 2,
      name: "James Ochieng",
      text: "As a pharma company, we've used Peckers for both MR training and performance dashboards. Their training program transformed our new graduates, and the analytics dashboards give us real-time visibility into field performance.",
      rating: 5,
      role: "Pharma Sales Manager",
      image: "https://ui-avatars.com/api/?name=James+Ochieng&background=244672&color=fff&size=128",
    },
    {
      id: 3,
      name: "Mary Wanjiku",
      text: "The contract-managed nanny service is a game-changer. Peckers handles everything - training, replacements, monitoring. We have peace of mind knowing our nanny is professionally managed.",
      rating: 5,
      role: "New Parent",
      image: "https://ui-avatars.com/api/?name=Mary+Wanjiku&background=33B200&color=fff&size=128",
    },
    {
      id: 4,
      name: "David Kimani",
      text: "We needed temporary security while traveling. Peckers provided excellent dog handlers and security personnel. Professional, reliable, and trustworthy. Highly recommend their services.",
      rating: 5,
      role: "Business Owner",
      image: "https://ui-avatars.com/api/?name=David+Kimani&background=244672&color=fff&size=128",
    },
    {
      id: 5,
      name: "Grace Akinyi",
      text: "The graduate MR training program is outstanding. I learned territory management, detailing skills, and field simulations. Within months, I was performing at the top of my team. Thank you, Peckers!",
      rating: 5,
      role: "Medical Representative",
      image: "https://ui-avatars.com/api/?name=Grace+Akinyi&background=33B200&color=fff&size=128",
    },
    {
      id: 6,
      name: "Peter Otieno",
      text: "Our FMCG team uses Peckers' performance dashboards. The KPI monitoring and analytics have improved our decision-making significantly. The data-driven insights are invaluable.",
      rating: 5,
      role: "FMCG Operations Manager",
      image: "https://ui-avatars.com/api/?name=Peter+Otieno&background=244672&color=fff&size=128",
    },
  ];

  // Duplicate testimonials for infinite scroll effect
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const cardWidth = 400; // Width of each card + gap
    const scrollSpeed = 1; // Pixels per frame

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // Reset position when we've scrolled through one set of testimonials
      if (scrollPosition >= cardWidth * testimonials.length) {
        scrollPosition = 0;
      }
      
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollPosition;
      }
    };

    const intervalId = setInterval(scroll, 20);

    return () => clearInterval(intervalId);
  }, [testimonials.length]);

  return (
    <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-[#02273f] font-semibold text-sm uppercase tracking-wider bg-purple-50 px-4 py-2 rounded-full">
              Client Stories
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-4 text-center ">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Our customers are at the heart of everything we do. Here's what they have to say about their experience with Peckers Services Ltd.
          </p>
        </div>

        {/* Scrolling Testimonials Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden scrollbar-hide py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="flex-shrink-0 w-[380px] bg-white rounded-2xll shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:-translate-y-2 group"
              >
                {/* Quote Icon */}
                <div className="mb-6">
                  
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 text-base leading-relaxed mb-6 line-clamp-4 group-hover:line-clamp-nonen transition-all">
                  "{testimonial.text}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full shadow-md"
                  />
                  <div>
                    <h4 className="text-[#02273f] font-bold text-lg">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Text */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Join hundreds of satisfied families and corporates who trust Peckers Services for reliability, professionalism, and excellence
          </p>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;