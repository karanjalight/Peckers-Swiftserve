import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/HeroComponent";
import Faqs from "@/components/services/Faqs";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const features = [
    "All-in-one design with stylish appearance",
    "On & off grid modes are available",
    "Smart control APP",
    "Real-time monitoring system",
    "Wide MPPT range, two strings up to 500V",
    "Long battery lifetime: over 6000 cycles",
    "2.5 hrs less charging time than other inverters",
    "High efficiency > 97%",
    "LCD display",
    "Able to drive heavy load",
  ];

  const steps = [
    { number: "Step One", title: "Power Consumption/Load Analysis" },
    { number: "Step Two", title: "Project Planning" },
    { number: "Step Three", title: "Installation and Maintenance" },
  ];

  const installationProcess = [
    {
      emoji: "1️⃣",
      title: "Free Consultation & Energy Audit",
      desc: "We assess your home's energy needs and recommend the best solar setup.",
    },
    {
      emoji: "2️⃣",
      title: "System Design & Customization",
      desc: "A tailored solution is created based on your energy load and budget.",
    },
    {
      emoji: "3️⃣",
      title: "Professional Installation",
      desc: "Our certified technicians install the system efficiently with minimal disruption.",
    },
    {
      emoji: "4️⃣",
      title: "Testing & Activation",
      desc: "The system is optimized for peak performance and integrated with IoT-enabled smart monitoring for real-time tracking.",
    },
    {
      emoji: "5️⃣",
      title: "Ongoing Maintenance & Support",
      desc: "We offer after-sales service to ensure your system operates efficiently over time.",
    },
  ];
  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Smart Home "
        highlight="Solar System"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className="lg:mb-20 bg-white lg:px-8 lg:py-8 px-2  py-2">
              {/* Header Image */}
              <div className="w-full mb-10">
                <Image
                  src="/home-solar-systems.webp"
                  alt="Maintenance Repairs"
                  width={832}
                  height={500}
                  className=" w-full lg:h-[60vh] h-[20vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 py-6yy">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12 text-left">
                    Smart Home Solar System
                  </h1>

                  {/* Description */}
                  <div className="max-w-6xl mx-auto space-y-4 text-gray-700 mb-12">
                    <p>
                      Power your home with a reliable and cost-effective solar
                      energy system tailored to your household's needs.
                    </p>
                    <p>
                      At Cytek Solar, we customize residential solar power
                      solutions based on your energy consumption, ensuring
                      efficiency, affordability, and long-term savings.
                    </p>
                    <p>
                      Every home has unique energy requirements, and we ensure
                      you get the right solar system size by assessing:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>
                        ● The type and number of household appliances you use.
                      </li>
                      <li>● Your daily energy consumption.</li>
                      <li>● Your budget and future power needs.</li>
                    </ul>
                    <p>
                      Before purchasing a solar system for home use, it's
                      crucial to calculate your power load (the total wattage of
                      all appliances). This helps determine the ideal:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>✔ Number of solar panels needed.</li>
                      <li>
                        ✔ Inverter capacity for seamless power conversion.
                      </li>
                      <li>✔ Battery storage size for backup power.</li>
                    </ul>
                    <p>
                      We provide free solar system sizing for all clients to
                      ensure they invest in an efficient, cost-effective
                      solution. Our goal is to help homeowners transition to
                      solar smoothly and achieve significant savings in the
                      shortest time possible.
                    </p>
                  </div>
                </div>

                {/* Hybrid Inverter Section */}
                <div className="py-12 md:py-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
                    {/* Image */}
                    <div className="flex col-span-6 justify-center">
                      <img
                        src="/home-solar-systems2.webp"
                        alt="Hybrid All-in-One Inverter"
                        className="w-full max-w-sm h-auto"
                      />
                    </div>

                    {/* Content */}
                    <div className="col-span-6">
                      <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8">
                        Hybrid  All-in-One Inverter
                      </h2>

                      {/* Features List */}
                      <div className="space-y-4">
                        {features.map((feature, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button className="mt-8 px-6 py-2 bg-[#33B200] text-white  hover:bg-[#2a9500] transition-colors">
                        View More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Installation Process Section */}
                <div className="  py-12 md:py-20 ">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 text-left">
                    A Seamless Installation Process
                  </h2>

                  <p className="text-left text-gray-700 mb-12  mx-auto">
                    We simplify the switch to solar energy with a professional,
                    step-by-step approach:
                  </p>

                  {/* Installation Steps */}
                  <div className="space-y-6 max-w-6xl mx-auto">
                    {installationProcess.map((step, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <span className="text-3xl flex-shrink-0">
                          {step.emoji}
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            {step.title}
                          </h4>
                          <p className="text-gray-700">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Three Steps Section */}
                <div className="px-4 md:px-8 lg:px-4 py-12 md:py-20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-[#f0f9ff] to-white p-8 -lg border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                      >
                        <div className="w-12 h-12 bg-[#33B200] -full flex items-center justify-center mb-4">
                          <span className="text-white font-bold text-lg">
                            {idx + 1}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {step.number}
                        </h4>
                        <p className="text-gray-700">{step.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remote Monitoring Section */}
                <div className="px-4 md:px-8 lg:px-4 py-12 md:py-20   bg-[#33B200] text-white">
                  <div className=" mx-auto text-center">
                    <p className="text-lg md:text-xl">
                      Monitor the systems remotely using IoT and take up full
                      maintenance for best performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-12 border-t border-gray-200"></div>

              {/* Footer Section */}
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                {/* Tags */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-[#33B200] font-medium">
                    Popular Tag
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="#33B200"
                      stroke="#33B200"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
                    </svg>
                  </span>
                  <div className="flex gap-2">
                    <a
                      href="#"
                      className="bg-green-100 text-[#33B200] px-3 py-1  text-sm hover:bg-green-200"
                    >
                      Solar
                    </a>
                    <a
                      href="#"
                      className="bg-green-100 text-[#33B200] px-3 py-1  text-sm hover:bg-green-200"
                    >
                      Energy
                    </a>
                  </div>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-[#33B200] font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="#33B200"
                      stroke="#33B200"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
                    </svg>
                    Follow
                  </span>
                  <div className="flex gap-3 text-[#33B200]">
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Facebook size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Twitter size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Instagram size={20} />
                    </a>
                    <a
                      href="#"
                      className="hover:bg-[#33B200] hover:text-white border border-[#33B200] p-2"
                    >
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <Faqs />
          </section>
      </div>

      <Footer />
    </main>
  );
}
