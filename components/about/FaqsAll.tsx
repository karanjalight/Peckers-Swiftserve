"use client";
import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What energy solutions does Cytek Solar offer",
      answer:
        "You can manage your subscription anytime from your account settings. Upgrades and downgrades take effect immediately or at the end of the billing cycle.",
    },
    {
      question: "Why should I consider solar for my business?",
      answer:
        "Solar energy reduces operational costs, provides energy independence, increases property value, and demonstrates environmental responsibility. Businesses typically see ROI within 3-5 years while reducing carbon footprint significantly.",
    },
    {
      question: "What solar financing options are available?",
      answer:
        "We offer multiple financing options including outright purchase, solar loans, power purchase agreements (PPAs), and leasing arrangements. Our team will help you choose the best option based on your financial situation and energy needs.",
    },
    {
      question: "Is hydropower energy reliable?",
      answer:
        "Yes, hydropower is one of the most reliable renewable energy sources. It provides consistent baseload power with capacity factors typically above 40-50%, and can operate 24/7 regardless of weather conditions.",
    },
    {
      question: "Is hydropower suitable for my location?",
      answer:
        "Hydropower suitability depends on factors like water flow rate, head height, seasonal variations, and regulatory requirements. Our team conducts comprehensive site assessments to determine feasibility and potential energy output for your specific location.",
    },
  ];

  const toggleFAQ = (index: React.SetStateAction<number>) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="w-full px-4 lg:px-0 bg-[#e7f0e9]  mb-10">
      <div className=" mx-auto">
        <div className="flex lg:flex-row  flex-col gap-8 items-center">
          {/* Right Side - FAQs */}
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800  mb-4">FAQs</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Have questions about our energy solutions? We've gathered the most
              <br />
              frequently asked questions to help.
            </p>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`overflow-hidden transition-all ${
                    openIndex === index
                      ? "bg-[#244672] text-white shadow-lg"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:opacity-90 transition-opacity"
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
                        openIndex === index ? "bg-white" : "bg-[#244672]"
                      }`}
                    >
                      {openIndex === index ? (
                        <Minus className="w-5 h-5 text-[#244672]" />
                      ) : (
                        <Plus className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>

                  {openIndex === index && (
                    <div className="px-5 pb-5">
                      <div className="pt-3 border-t border-blue-400">
                        <p className="text-blue-100 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
