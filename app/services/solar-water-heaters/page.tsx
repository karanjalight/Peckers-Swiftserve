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
  Smartphone,
  Zap,
  LineChart,
  Bell,
} from "lucide-react";

export default function SolarWaterHeater() {
  const iotFeatures = [
    {
      icon: Smartphone,
      title: "Real-Time Temperature Control",
      desc: "Adjust and monitor water temperature through a mobile app.",
    },
    {
      icon: Zap,
      title: "Automated Efficiency Optimization",
      desc: "AI-driven adjustments for maximum energy savings.",
    },
    {
      icon: LineChart,
      title: "Usage Analytics & Reports",
      desc: "Track hot water consumption to optimize system performance.",
    },
    {
      icon: Bell,
      title: "Predictive Maintenance Alerts",
      desc: "Get notified about maintenance needs before issues arise.",
    },
  ];
  return (
    <main className="min-h-screen">
      <Navbar />
      <AboutHero
        title="Solar Water "
        highlight="Heaters"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section>
            <div className="lg:mb-10 bg-white lg:px-8 lg:py-8 py-8  p-2">
              {/* Header Image */}
              <div className="w-full mb-10">
                <Image
                  src="/solar-water-heaters3.webp"
                  alt="Solar water Heaters"
                  width={832}
                  height={500}
                  className=" w-full lg:h-[60vh] h-[20vh] object-cover object-top"
                />
              </div>

              <div className="w-full bg-white">
                {/* Header Section */}
                <div className="px-4 md:px-8 lg:px-4 py-8 md:py-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12">
                    Solar Water Heaters
                  </h1>

                  {/* Description */}
                  <div className="max-w-5xl space-y-4 text-gray-700 mb-4">
                    <p>
                      Reduce energy bills and enjoy an eco-friendly,
                      cost-effective solution for heating water with solar water
                      heating systems. At Cytek Solar, we offer high-efficiency
                      solar water heaters designed for residential, commercial,
                      and industrial applications. Our systems utilize solar
                      thermal technology to harness the sun's energy, providing
                      a reliable and sustainable alternative to traditional
                      electric or gas-powered water heaters.
                    </p>

                    <p className="font-semibold text-[#244672]">
                      We integrate IoT technology into our solar water heating
                      systems for enhanced performance and remote monitoring.
                    </p>

                    <ul className="space-y-2">
                      <li>
                        •{" "}
                        <span className="font-semibold">
                          Real-Time Temperature Control
                        </span>{" "}
                        – Adjust and monitor water temperature through a mobile
                        app.
                      </li>
                      <li>
                        •{" "}
                        <span className="font-semibold">
                          Automated Efficiency Optimization
                        </span>{" "}
                        – AI-driven adjustments for maximum energy savings.
                      </li>
                      <li>
                        •{" "}
                        <span className="font-semibold">
                          Usage Analytics & Reports
                        </span>{" "}
                        – Track hot water consumption to optimize system
                        performance.
                      </li>
                      <li>
                        •{" "}
                        <span className="font-semibold">
                          Predictive Maintenance Alerts
                        </span>{" "}
                        – Get notified about maintenance needs before issues
                        arise.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Flat Plate Solar Water Heater Section */}
                <div className="px-4 md:px-4 lg:px-4 py-4 lg:py-20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Image */}
                    <div className="flex justify-center lg:order-1">
                      <Image
                        src="/solar-water-heaters2.webp"
                        alt="Maintenance Repairs"
                        width={832}
                        height={500}
                        className="w-full h-auto "
                      />
                    </div>

                    {/* Content */}
                    <div className="lg:order-2">
                      <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
                        Flat Plate Solar Water Heater
                      </h2>

                      <p className="text-gray-700 mb-4">
                        A Flat Plate Collector serves as a heat exchanger that
                        transforms radiant solar energy from the sun into heat
                        energy through the familiar greenhouse effect. This
                        technology captures solar energy, utilizing it to warm
                        water within residential settings, facilitating
                        activities such as bathing, washing, and space heating.
                      </p>

                      <p className="text-gray-700 mb-6">
                        It also extends its applications to heating outdoor
                        swimming pools and hot tubs.
                      </p>

                      <button className="px-6 py-2 bg-[#33B200] text-white  hover:bg-[#2a9500] transition-colors">
                        View More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vacuum Tube Solar Water Heater Section */}
                <div className="px-4 md:px-4 lg:px-4 py-6 md:py-20 ">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Content */}
                    <div className="lg:order-1">
                      <h2 className="text-3xl md:text-4xl font-bold text-[#244672] mb-6">
                        Vacuum Tube Solar Water Heaters
                      </h2>

                      <p className="text-gray-700">
                        Our VACUUM TUBE SOLAR WATER HEATERS harness solar energy
                        within a vacuum-sealed glass space, effectively warming
                        the water in the glass tube. As the water absorbs heat,
                        it ascends to the top of the pipe and accumulates in the
                        tank. The design incorporates a sizable surface area
                        within the vacuum tube and promotes high water
                        turbulence within the internal chamber, ensuring swift
                        heat transfer to the water circulating through the tank.
                      </p>

                      <button className="mt-6 px-6 py-2 bg-[#33B200] text-white  hover:bg-[#2a9500] transition-colors">
                        View More
                      </button>
                    </div>

                    {/* Image */}
                    <div className="flex justify-center lg:order-2">
                      <Image
                        src="/solar-water-heaters3.webp"
                        alt="Maintenance Repairs"
                        width={832}
                        height={500}
                        className="w-full h-auto "
                      />
                    </div>
                  </div>
                </div>

                {/* IoT Features Section */}
                <div className="px-4 md:px-4 lg:px-4 py-16 md:py-24">
                  <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                      <p className="text-[#33B200] font-semibold mb-2">
                        Go green, Today!
                      </p>
                      <h2 className="text-3xl font-bold text-[#244672] mb-4">
                        Minimizes Carbon Footprint; Contributing To A Greener
                        Future!
                      </h2>
                    </div>

                    {/* IoT Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {iotFeatures.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={idx}
                            className="bg-gradient-to-br from-[#f0f9ff] to-white p-8 -lg border border-[#e0e7ff] hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-[#33B200] -lg flex-shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                  {feature.title}
                                </h3>
                                <p className="text-gray-700 text-sm">
                                  {feature.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
