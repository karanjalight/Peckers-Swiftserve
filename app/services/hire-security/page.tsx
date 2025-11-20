"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AboutHero from "@/components/hero/HeroComponent";
import Footer from "@/components/landing/Footer";
import {
  Shield,
  Dog,
  Clock,
  FileText,
  Phone,
  Mail,
  MapPin,
  User,
  Home,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import ProductsHero from "@/components/hero/ProductsHero";

export default function TemporarySecurity() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar />
      <ProductsHero title="Temporary Security" highlight=" with Guard Dogs" />

      <div className="mx-auto flex lg:flex-row gap-6 flex-col px-4 sm:px-6 lg:px-8 py-4">
        {/* FORM - LEFT SIDE ON LARGE SCREENS */}
        {showForm && (
          <section className="lg:w-2/3 bg-white p-8 lg:p-12 border">
            <h2 className="text-4xl font-bold text-[#244672] mb-4">
              Request Temporary Security with Guard Dogs
            </h2>

            <p className="text-gray-600 mb-10 text-lg leading-relaxed">
              Going on leave, working night shifts, or leaving home temporarily?
              Get professional armed response + trained guard dogs deployed to
              your premises <span className="text-[#b38f62] font-semibold">within hours</span>.
            </p>

            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <User className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone Number *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Phone className="text-[#244672] w-5 h-5" />
                    <input
                      type="tel"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="0700 000 000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email (Optional)
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Mail className="text-[#244672] w-5 h-5" />
                    <input
                      type="email"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Property Location *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <MapPin className="text-[#244672] w-5 h-5" />
                    <input
                      type="text"
                      className="w-full bg-transparent focus:outline-none"
                      placeholder="e.g. Karen, Runda, Kitengela, Thika..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Start Date *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Calendar className="text-[#244672] w-5 h-5" />
                    <input
                      type="date"
                      className="w-full bg-transparent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Duration *
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Clock className="text-[#244672] w-5 h-5" />
                    <select className="w-full bg-transparent focus:outline-none" required>
                      <option value="">Select duration</option>
                      <option>1–3 nights</option>
                      <option>4–7 nights</option>
                      <option>1–4 weeks</option>
                      <option>1–2 months</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Number of Guard Dogs Needed
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <Dog className="text-[#244672] w-5 h-5" />
                    <select className="w-full bg-transparent focus:outline-none">
                      <option>1 Guard Dog + Handler</option>
                      <option>2 Guard Dogs + Handlers</option>
                      <option>3+ (Large compound/estate)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Reason for Temporary Security
                  </label>
                  <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
                    <AlertTriangle className="text-[#244672] w-5 h-5" />
                    <select className="w-full bg-transparent focus:outline-none">
                      <option>Family travel / vacation</option>
                      <option>Night shift work</option>
                      <option>House help exited</option>
                      <option>Construction / renovation period</option>
                      <option>High-risk period</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Additional Notes / Special Instructions
                </label>
                <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
                  <FileText className="text-[#244672] w-5 h-5 mt-1" />
                  <textarea
                    className="w-full bg-transparent h-32 focus:outline-none"
                    placeholder="Property size, entry points, existing alarms, aggressive dog preference, etc..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
              >
                Deploy Security Team Now
              </button>

              <p className="text-center text-sm text-gray-500 mt-2">
                You will receive a call within 15 minutes to confirm deployment ✔
              </p>
            </form>
          </section>
        )}

        {/* MAIN CONTENT - LEFT WHEN FORM HIDDEN */}
        {!showForm && (
          <section className="lg:w-2/3">
            <div className="lg:mb-10 bg-white lg:px-8 lg:py-8 p-4">
              <div className="px-4 lg:px-4 py-12 md:py-16">
                <h1 className="text-3xl md:text-4xl font-bold text-[#244672] mb-8 md:mb-12">
                  Temporary Security Services with Guard Dogs
                </h1>

                {/* Hero Section */}
                <section className="flex flex-col md:flex-row items-center justify-center gap-10 bg-white">
                  <div className="w-full flex justify-start">
                    <img
                      src="https://www.blueline-kennels.com/wp-content/uploads/2023/09/Security-Services-Strip-I-scaled.jpg"
                      alt="Guard Dog Security Team"
                      className="w-[120vh] lg:h-[60vh] h-[20vh] object-cover rounded-lg shadow-xl"
                      loading="lazy"
                    />
                  </div>

                  <div className="w-full lg:px-0 px-4 lg:pb-0 pb-12 space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Professional Temporary Security with Trained Guard Dogs
                    </h2>

                    <p className="text-gray-800 leading-relaxed text-lg">
                      Traveling? Night shifts? House help just left? Don’t leave your home vulnerable.
                      Peckers Swift Swerve deploys armed response officers + highly trained guard dogs
                      to protect your property — from <strong>1 night to 60 nights</strong>. No long contracts.
                    </p>

                    <ul className="space-y-4 text-gray-800 text-lg">
                      {[
                        "Rapid deployment across Nairobi & surrounding counties",
                        "Trained attack & detection dogs with certified handlers",
                        "Perfect for large compounds, rural homes & estates",
                        "Daily patrol reports + photo evidence for peace of mind",
                        "Seamless integration with Peckers alarm response & nanny services",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-[#b38f62] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
                    >
                      Secure My Home Now
                    </button>
                  </div>
                </section>

                {/* Why Choose Section */}
                <section className="mt-20 py-16 px-6 md:px-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl">
                  <h2 className="text-3xl md:text-5xl font-bold mb-8 text-[#244672]">
                    Maximum Deterrence. Zero Long-Term Commitment.
                  </h2>

                  <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {[
                      { icon: Shield, title: "Visible & Effective Deterrence", desc: "The presence of guard dogs alone prevents 90% of intrusions." },
                      { icon: Home, title: "Ideal When House Help Leaves", desc: "Instant coverage the same day your staff exits — no gaps." },
                      { icon: Clock, title: "From 1 Night to 60 Nights", desc: "Take only what you need. Cancel or extend anytime." },
                      { icon: FileText, title: "Daily Summary Reports", desc: "Photos, patrol logs & incident reports sent to your phone." },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-4">
                        <item.icon className="w-12 h-12 text-[#b38f62] flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-xl text-[#244672]">{item.title}</h3>
                          <p className="text-gray-700 mt-2">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-12 w-full max-w-md mx-auto bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
                  >
                    Get Protected Tonight
                  </button>
                </section>
              </div>
            </div>
          </section>
        )}

        {/* RIGHT SIDEBAR - ALWAYS VISIBLE */}
        <section className="lg:w-1/3">
          <div className="lg:mb-10 bg-white lg:px-8 lg:py-8 p-4 space-y-8">
            <div className="px-4 py-8">
              <h1 className="text-3xl font-bold text-[#244672] mb-6">
                Temporary Security with Guard Dogs
              </h1>

              <div className="text-lg space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="text-2xl font-bold text-[#244672] mb-4">
                    When Do Families Need This Service?
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Family traveling locally or abroad",
                      "Parents working night shifts or long hours",
                      "House help/nanny resigned suddenly",
                      "Home under renovation or construction",
                      "Rural or large compound needing stronger deterrence",
                      "High-crime period or recent break-in nearby",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-[#b38f62] rounded-full mt-2"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-bold text-xl text-[#244672] mb-3">
                    What You Get
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>✔ Trained guard dog(s) + licensed handler(s)</li>
                    <li>✔ 24/7 armed backup response</li>
                    <li>✔ Night & day patrols</li>
                    <li>✔ Daily photo + written reports</li>
                    <li>✔ Immediate deployment available</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
            >
              {showForm ? "Close Form" : "Deploy Security Team"}
            </button>

            <div className="px-4 py-8 space-y-4 text-gray-700 border-t">
              <h2 className="text-2xl font-bold text-[#244672]">Contact Us 24/7</h2>
              <p><strong>Emergency Line:</strong> 07009744522</p>
              <p><strong>Email:</strong> security@peckersswiftswerve.co.ke</p>
              <p><strong>Location:</strong> Nairobi, Kenya</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}