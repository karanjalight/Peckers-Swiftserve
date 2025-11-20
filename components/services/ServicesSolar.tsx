"use client";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export default function MaintenanceRepairs() {
  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
      {/* Header Image */}
      <div className="w-full mb-10">
        <Image
          src="/about-4.JPG"
          alt="Maintenance Repairs"
          width={832}
          height={500}
          className="rounded-xl w-full object-cover"
        />
      </div>

      {/* Title & Intro */}
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
        Maintenance Repairs
      </h2>
      <p className="text-gray-600 leading-relaxed mb-8">
        Installed a 6 kW solar panel system on a residential rooftop. This
        project included 20 high-efficiency photovoltaic panels with a compact
        inverter setup, optimized for suburban homes. The system provides enough
        energy to meet 90% of the household’s electricity needs, significantly
        lowering energy bills.
      </p>

      {/* Details List */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Details:</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li>System Size: 6 kW</li>
        <li>Number of Panels: 20 high-efficiency photovoltaic panels</li>
        <li>
          Inverter: Compact string inverter setup to convert DC to usable AC
          power for household consumption.
        </li>
        <li>Location: Suburban neighborhood with excellent sun exposure.</li>
        <li>
          Installation Duration: 3 days from start to finish, including site
          preparation, panel mounting, and system setup.
        </li>
        <li>
          Cost: Mid-range installation with long-term savings on energy bills.
          The investment is expected to break even in about 5–7 years.
        </li>
      </ul>

      {/* Highlights Section */}
      <div className="mt-12 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Service Highlights:
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Monitoring and Maintenance: A smart monitoring system was installed,
            allowing the homeowner to track energy production and consumption in
            real-time through a mobile app. This provides detailed insights and
            helps identify maintenance needs. Maintenance includes periodic
            cleaning of the panels to ensure they operate at peak efficiency.
          </p>
        </div>
        <div>
          <Image
            src="/about-5.JPG"
            alt="Service Details"
            width={343}
            height={207}
            className="rounded-lg w-full object-cover"
          />
        </div>
      </div>

      {/* More Details */}
      <div className="mt-12 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">
          More Details
        </h3>
        <p className="text-gray-600">
          <strong>Energy Savings:</strong> The system is designed to meet
          approximately 90% of the household’s electricity needs, drastically
          lowering utility bills. Within the first year, the homeowner
          experienced a 30% reduction in electricity costs.
        </p>
        <p className="text-gray-600">
          <strong>Environmental Impact:</strong> The installation reduces the
          household’s carbon footprint, avoiding an estimated 4.5 metric tons of
          CO₂ emissions per year. This contributes to the broader goal of
          reducing reliance on non-renewable energy sources.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-12 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">
          Benefits to the Homeowner:
        </h3>
        <p className="text-gray-600">
          <strong>Reduced Energy Bills:</strong> Immediate cost savings with a
          significant decrease in monthly electricity bills.{" "}
          <strong>Increased Property Value:</strong> Homes with solar
          installations typically have higher property values due to their lower
          operating costs.
        </p>
        <p className="text-gray-600">
          <strong>Sustainability:</strong> The household now operates on clean,
          renewable energy, contributing to a healthier environment.{" "}
          <strong>Energy Independence:</strong> Increased protection against
          rising energy costs, with less dependence on the traditional power
          grid.
        </p>
      </div>

      {/* Divider */}
      <div className="my-12 border-t border-gray-200"></div>

      {/* Footer Section */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        {/* Tags */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-green-600 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9FD456"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
            </svg>
            Popular Tag
          </span>
          <div className="flex gap-2">
            <a
              href="#"
              className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-200"
            >
              Solar
            </a>
            <a
              href="#"
              className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-200"
            >
              Energy
            </a>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-green-600 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9FD456"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 12.5H21M21 12.5L18 9.5M21 12.5L18 15.5M7 12.5C7 13.0304 6.78929 13.5391 6.41421 13.9142C6.03914 14.2893 5.53043 14.5 5 14.5C4.46957 14.5 3.96086 14.2893 3.58579 13.9142C3.21071 13.5391 3 13.0304 3 12.5C3 11.9696 3.21071 11.4609 3.58579 11.0858C3.96086 10.7107 4.46957 10.5 5 10.5C5.53043 10.5 6.03914 10.7107 6.41421 11.0858C6.78929 11.4609 7 11.9696 7 12.5Z" />
            </svg>
            Follow
          </span>
          <div className="flex gap-3 text-gray-500">
            <a href="#" className="hover:text-[#33B200]">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-[#33B200]">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-[#33B200]">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-[#33B200]">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
