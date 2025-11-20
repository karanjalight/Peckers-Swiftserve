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
  Zap,
  Leaf,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react";

export default function CommercialSolar() {
  const benefits = [
    "Cost Savings",
    "Environmental Sustainability",
    "Energy Independence",
    "Long-Term Reliability",
    "Positive Corporate Image",
  ];

  const smeApplications = [
    {
      title: "Shops & Retail Stores",
      desc: "Power lighting, POS systems, and essential appliances.",
    },
    {
      title: "Offices & Workspaces",
      desc: "Run computers, printers, and office equipment without interruptions.",
    },
    {
      title: "Hotels & Restaurants",
      desc: "Maintain operations during grid failures and reduce operational expenses.",
    },
  ];

  const industrialFeatures = [
    "Industrial-Grade Solar Panels – Generate maximum power with high-efficiency PV technology.",
    "Battery Storage & Backup Power – Store excess energy for uninterrupted operations.",
    "Hybrid Solar Integration – Combine solar with the grid or backup generators for optimal energy security.",
  ];

  const iotCapabilities = [
    {
      title: "Smart Monitoring Dashboard",
      desc: "Track energy production, usage, and savings through a mobile or web-based platform.",
    },
    {
      title: "Automated Alerts & Fault Detection",
      desc: "Receive notifications for system performance, maintenance, and energy efficiency improvements.",
    },
    {
      title: "AI-Driven Energy Optimization",
      desc: "Get automated insights to adjust power usage and prevent energy wastage.",
    },
    {
      title: "Remote System Control",
      desc: "Manage your solar power system from anywhere, ensuring maximum efficiency.",
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Commercial "
        highlight="Solar System"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className=" px-4 lg:mb-20 bg-white lg:px-8 lg:py-8  py-16">
              {/* Header Image */}
              <div className="w-full mb-10">
                <Image
                  src="/commercial-solar-system.webp"
                  alt="Maintenance Repairs"
                  width={832}
                  height={500}
                  className=" w-full h-[60vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 md:px-4 lg:px-4 py-12 md:py-10">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12">
                    Commercial Solar Systems
                  </h1>

                  {/* Introduction */}
                  <div className="max-w-4xl space-y-6 text-gray-700 mb-12">
                    <p className="text-lg">
                      Businesses and industries need reliable, cost-effective
                      energy solutions to maintain operations while reducing
                      electricity costs.
                    </p>

                    <p>
                      At Cytek Solar, we provide custom solar energy solutions
                      for commercial and industrial use, helping companies
                      optimize energy consumption, lower expenses, and improve
                      sustainability. Our solar power systems are designed to
                      cater to different energy demands, whether for small
                      businesses, large enterprises, or industrial facilities.
                      We ensure that every system is tailored to match power
                      requirements, operational schedules, and long-term goals.
                    </p>
                  </div>
                </div>

                {/* Why Go Solar Section */}
                <div className="px-4 md:px-4 lg:px-4 py-12 md:pb-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Image */}
                    <div className="flex justify-center lg:order-1">
                      <img
                        src="https://cyteksolar.com/wp-content/uploads/2024/02/chelsea-WvusC5M-TM8-unsplash-1024x768.jpg"
                        alt="Why Go Solar"
                        className="w-full h-auto "
                      />
                    </div>

                    {/* Content */}
                    <div className="lg:order-2">
                      <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8">
                        Why Go Solar?
                      </h2>

                      {/* Benefits List */}
                      <div className="space-y-4">
                        {benefits.map((benefit, idx) => (
                          <div key={idx} className="flex gap-3 items-center">
                            <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0" />
                            <span className="text-gray-700 font-medium">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button className="mt-8 px-6 py-2 bg-[#33B200] text-white  hover:bg-[#2a9500] transition-colors">
                        View More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customized Solutions Section */}
                <div className="px-4 md:px-4 lg:px-4 py-12 md:py-20 b0">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-12 text-left">
                    Customized Solar Solutions for Businesses
                  </h2>

                  {/* Small and Medium Enterprises */}
                  <div className="mb-16 max-w-5xl mx-auto">
                    <h3 className="text-2xl font-bold text-[#244672] mb-4">
                      Small and Medium Enterprises (SMEs)
                    </h3>
                    <p className="text-gray-700 mb-6">
                      Small businesses can cut electricity costs by adopting our
                      commercial solar power systems. Our solutions are ideal
                      for:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {smeApplications.map((app, idx) => (
                        <div
                          key={idx}
                          className="  p-8 -lg border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                        >
                          <h4 className="font-semibold text-[#244672] mb-2">
                            {app.title}
                          </h4>
                          <p className="text-gray-700 text-sm">{app.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Large Commercial Facilities */}
                  <div className="max-w-5xl mx-auto">
                    <h3 className="text-2xl font-bold text-[#244672] mb-4">
                      Large Commercial Facilities
                    </h3>
                    <p className="text-gray-700 mb-6">
                      For industries, factories, and large-scale operations, we
                      provide high-capacity solar energy systems with features
                      like:
                    </p>
                    <div className="space-y-4">
                      {industrialFeatures.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-start bg-white p-4  border border-[#e0e7ff]"
                        >
                          <div className="w-5 h-5 bg-[#33B200] rounded-full flex-shrink-0 mt-1"></div>
                          <p className="text-gray-700">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* IoT Energy Management Section */}
                <div className="px-4 md:px-4 lg:px-4 py-12 md:py-20">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-4 text-center">
                    IoT-Enabled Energy Management for Businesses
                  </h2>
                  <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
                    We integrate IoT technology into our solar solutions,
                    allowing businesses to monitor and optimize energy
                    consumption in real time.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {iotCapabilities.map((capability, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-[#f0f9ff] to-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                      >
                        <h4 className="font-semibold text-[#244672] mb-2">
                          {capability.title}
                        </h4>
                        <p className="text-gray-700 text-sm">
                          {capability.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action Section */}
                <div className="px-4 md:px-4 lg:px-4 py-16 md:py-24  bg-[#33B200]">
                  <div className="max-w-3xl mx-auto text-center text-white">
                    <p className="text-sm font-semibold mb-3 uppercase tracking-wide">
                      Go green, Today!
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                      Save money, and save the planet!
                    </h2>
                    <p className="text-lg text-gray-100">
                      Demonstrates a commitment to corporate social
                      responsibility
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
