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
  Monitor,
  AlertCircle,
  Wrench,
  Phone,
} from "lucide-react";

export default function SolarStreetLighting() {
  const features = [
    {
      icon: Monitor,
      title: "Real-time Monitoring",
      desc: "Real time monitoring ensures failures are detected in real time and correction measures taken on time.",
    },
    {
      icon: AlertCircle,
      title: "Deeming Plan",
      desc: "Deeming Plan which eliminates shutdown.",
    },
    {
      icon: Wrench,
      title: "Remote Control",
      desc: "Remote control eliminates high maintenance cost that comes with physical inspection.",
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Solar Street "
        highlight="Lighting"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className=" px-4 lg:mb-10 bg-white lg:px-8 lg:py-8  py-16">
              {/* Header Image */}
              <div className="w-full mb-10">
                <Image
                  src="/solar-water-heaters3.webp"
                  alt="Solar water Heaters"
                  width={832}
                  height={500}
                  className=" w-full h-[60vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 lg:px-4 py-12 md:py-16">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-2">
                    Solar Street Lighting
                  </h1>

                   

                  {/* Description */}
                  <div className="max-w-4xl space-y-4 text-gray-700 mb-4">
                    <p className="text-lg">
                      Solar street lights harness the sun's energy to illuminate
                      public spaces, offering an eco-friendly and cost-effective
                      lighting solution. These lights integrate photovoltaic
                      panels that absorb sunlight during the day, converting it
                      into electricity stored in batteries.
                    </p>

                    <p className="text-lg">
                      As night falls, the built-in sensors activate LED lights,
                      providing efficient and sustainable illumination without
                      relying on traditional power grids.
                    </p>
                  </div>
                </div>

                {/* Features Section */}
                <div className="px-4 lg:px-4 py-12 md:py-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Product Image */}
                    <div className="flex justify-center lg:order-1">
                      <img
                        src="/solar-street-lighting2.webp"
                        alt="Solar Street Light"
                        className="w-full max-w-md h-auto"
                      />
                    </div>

                    {/* Content */}
                    <div className="lg:order-2">
                      <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8">
                        Our lights have
                      </h2>

                      {/* Features List */}
                      <div className="space-y-6">
                        {features.map((feature, idx) => {
                          const Icon = feature.icon;
                          return (
                            <div key={idx} className="flex gap-4 items-start">
                              <div className="p-3 bg-[#33B200]  flex-shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-[#244672] mb-1">
                                  {feature.title}
                                </h3>
                                <p className="text-gray-700 text-sm">
                                  {feature.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button className="mt-8 px-6 py-2 bg-[#33B200] text-white rounded hover:bg-[#2a9500] transition-colors">
                        View More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Benefits Overview Section */}
                <div className="px-4 lg:px-4 py-12 md:py-20 bg-gray-50">
                  <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#244672] mb-12 text-center">
                      Why Choose Cytek Solar Street Lights?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-[#244672] mb-2">
                              Eco-Friendly
                            </h3>
                            <p className="text-gray-700 text-sm">
                              Zero carbon emissions and 100% renewable energy
                              powered
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-[#244672] mb-2">
                              Cost-Effective
                            </h3>
                            <p className="text-gray-700 text-sm">
                              No electricity bills, minimal maintenance costs
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-[#244672] mb-2">
                              Easy Installation
                            </h3>
                            <p className="text-gray-700 text-sm">
                              Self-contained design with no grid infrastructure
                              needed
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6  border border-[#e0e7ff] hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-[#33B200] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-[#244672] mb-2">
                              Reliable Performance
                            </h3>
                            <p className="text-gray-700 text-sm">
                              Durable LED technology with extended lifespan
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Specs Section */}
                <div className="px-4 lg:px-4 py-12 md:py-20">
                  <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#244672] mb-8 text-center">
                      Key Features
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-[#f0f9ff] to-white p-6  border border-[#e0e7ff] text-center">
                        <h4 className="font-semibold text-[#244672] mb-2">
                          Integrated Design
                        </h4>
                        <p className="text-gray-700 text-sm">
                          All-in-one solar panel, battery, controller, and LED
                          in a single compact unit
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-[#f0f9ff] to-white p-6  border border-[#e0e7ff] text-center">
                        <h4 className="font-semibold text-[#244672] mb-2">
                          Waterproof (IP65)
                        </h4>
                        <p className="text-gray-700 text-sm">
                          Fully waterproof and weather-resistant for all
                          environmental conditions
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-[#f0f9ff] to-white p-6  border border-[#e0e7ff] text-center">
                        <h4 className="font-semibold text-[#244672] mb-2">
                          Smart Sensors
                        </h4>
                        <p className="text-gray-700 text-sm">
                          Automatic dusk-to-dawn operation with motion detection
                          capabilities
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="px-4 lg:px-4 py-16 md:py-24 bg-[#33B200]">
                  <div className="max-w-3xl mx-auto text-center text-white">
                    <p className="text-sm font-semibold mb-4 uppercase tracking-wide">
                      Call us today
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                      And light up your world!
                    </h2>
                    <button className="flex items-center justify-center gap-2 mx-auto px-8 py-3 bg-white text-[#244672] font-semibold  hover:bg-gray-100 transition-colors">
                      <Phone className="w-5 h-5" />
                      Get In Touch
                    </button>
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
