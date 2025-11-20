"use client";
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'What is your deployment time for backup nannies?',
      answer: 'We guarantee a 6-hour deployment window for backup and emergency nannies. This means from the time you contact us, we will have a vetted, trained nanny at your location within 6 hours. This service is ideal when your usual help quits suddenly or falls sick.'
    },
    {
      question: 'Are all your nannies vetted and trained?',
      answer: 'Yes! 100% of our staff are vetted, trained, and accountable. We conduct thorough background checks, provide comprehensive training, and maintain ongoing supervision. All our household staff undergo regular performance monitoring and professional development.'
    },
    {
      question: 'What is the difference between contract-managed and regular nannies?',
      answer: 'With contract-managed nannies, the nanny is managed by Peckers Services, not directly by you as the employer. This means we handle performance monitoring, replacements when needed, ongoing training, and all administrative aspects. You get peace of mind with no direct employer liability.'
    },
    {
      question: 'What areas do you serve?',
      answer: 'We currently serve Nairobi, Kiambu, Nakuru, Mombasa, and Eldoret. Our services are available to working families, new parents, corporates in pharma and FMCG, and families traveling for holidays across these locations.'
    },
    {
      question: 'What does your pharma training program include?',
      answer: 'Our Graduate Medical Representative Training includes industry-oriented training for graduates entering pharma, covering territory management, detailing skills, and field simulations. We also offer Corporate MR Upskilling for pharma companies seeking improved coverage, KPIs, and call rates.'
    },
    {
      question: 'What are performance dashboards and how do they help?',
      answer: 'Our Performance Dashboards provide tailored KPI dashboards for pharma/FMCG companies. They include sales tracking, coverage metrics, call rates, and growth analytics. These data-driven tools help organizations make informed decisions and monitor field excellence in real-time.'
    }
  ];

  const toggleFAQ = (index: React.SetStateAction<number>) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="w-full px-4 lg:px-0 bg-white lg:h-screen mb-10">
      <div className=" mx-auto">
        <div className="flex lg:flex-row flex-col gap-8 items-center">
          {/* Left Side - Image */}
          <div className="relative overflow-hidden lg:w-2/5 w-full h-[30vh]  lg:h-screen">
              <img
              src="https://hatarisecurity.co.ke/wp-content/uploads/2019/07/canine-dogs-for-sale-in-kenya.jpg"
              alt="Peckers Services Ltd"
              className="w-full h-full  object-center object-cover"
            />
            

            {/* Red Carpet Effect */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-red-600 to-transparent opacity-30"></div>
          </div>

          {/* Right Side - FAQs */}
          <div className='mx-auto lg:mr-20 max-w-4xl'>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800  mb-4">FAQs</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Have questions about our services? We've gathered the most<br />
              frequently asked questions to help you understand how we can support you.
            </p>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`overflow-hidden transition-all ${
                    openIndex === index
                      ? 'bg-[#02273f] text-white shadow-lg'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:opacity-90 transition-opacity"
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
                      openIndex === index ? 'bg-white' : 'bg-[#02273f]'
                    }`}>
                      {openIndex === index ? (
                        <Minus className="w-5 h-5 text-[#02273f]" />
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