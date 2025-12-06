"use client";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Lightbulb,
  LineChart,
} from "lucide-react";
import React from "react";


// Add props to function signature
export default function CorporateSection({ 
    showForm, 
    setShowForm 
  }: { 
    showForm: boolean; 
    setShowForm: (show: boolean) => void; 
  }) {  // Remove this line - we're using props instead
  // const [showForm, setShowForm] = useState(false);

  const programs = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Managers Coaching Excellence",
    //   subtitle: "6 Weeks - 24 Hours",
      items: [
        "Territory Management & Strategic Planning",
        "Effective Call Skills & Brand Plan Execution",
        "Ethics, Compliance & Monitoring",
        "KPI Tracking & Dashboards",
        "Team Leadership & Motivation",
        "Joint Field Work Methodology",
        "People Development & Talent Retention",
        "Productive Cycle Meetings",
      ],
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Medical / Sales Rep Development",
    //   subtitle: "6 Weeks - 24 Hours",
      items: [
        "Territory Mapping & Customer Segmentation",
        "Product Knowledge & Scientific Selling",
        "Detailing & Objection Handling",
        "Brand Communication & Sampling Strategy",
        "Call Planning & Coverage Tracking",
        "Compliance & Ethics",
        "Competitor Landscape Analysis",
        "Soft Skills (Time, EQ, Conflict)",
      ],
    },
  ];

  const coreServices = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Training & Consulting",
      desc: "Capacity Building Programs",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Market Campaigns",
      desc: "Open Market Activations",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Sales Recruitment",
      desc: "Pharma & FMCG Talent",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Performance Dashboards",
      desc: "Real-time Analytics",
    },
  ];

  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#244672] opacity-95"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/dashboards.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        <div className="relative px-6 lg:px-16 py-20 md:py-28  mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center gap-2 bg-[#b38f62] px-4 py-2 rounded-full text-sm font-medium">
                <Award className="w-4 h-4" />
                <span>Performance Excellence</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Corporate Training & Performance Consulting
              </h1>

              <p className="text-lg text-white/90 leading-relaxed">
                Peckers Swiftserve Ltd is a dynamic organization focused on
                developing high-performing teams and performance-driven
                leadership.
              </p>

              <button
                onClick={() => setShowForm(!showForm)}
                className="group relative overflow-hidden bg-[#b38f62] text-white px-8 py-4 font-semibold hover:bg-[#a07d54] transition-all duration-300 flex items-center gap-2"
              >
                <span>
                  {showForm ? "Close Inquiry Form" : "Request Consultation"}
                </span>
                <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#b38f62] rounded-full flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white">
                      Our Mission
                    </h3>
                    <p className="text-white/80 text-sm">
                      Transform teams into high performers
                    </p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed">
                  We specialize in transforming teams into confident, ethical
                  and results-driven professionals using structured learning,
                  mindset shift, coaching and data-driven performance systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="px-6 lg:px-16 py-16  mx-auto">
        <div className="bg-gradient-to-r from-[#244672] to-[#1a3352] rounded-3xl p-8 md:p-12 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Deep Sector Experience
              </h2>
              <p className="text-white/90 leading-relaxed">
                We design solutions that help teams not only meet their
                objectives but make smarter decisions using credible real-time data
                analytics and KPIs that align daily activity to business growth.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#b38f62]">100+</div>
                <div className="text-sm mt-2">Teams Trained</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#b38f62]">95%</div>
                <div className="text-sm mt-2">Client Satisfaction</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#b38f62]">24hrs</div>
                <div className="text-sm mt-2">Training Duration</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#b38f62]">10+</div>
                <div className="text-sm mt-2">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD SECTION */}
      <section className="px-6  py-16  mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div
              className="relative min-h-[400px] bg-cover bg-center"
              style={{
                backgroundImage: "url('/dashboards.png')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#244672]/90 to-transparent"></div>
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#244672] rounded-full flex items-center justify-center">
                  <LineChart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#244672]">
                  Organizational Dashboard Setup
                </h2>
              </div>

              <div className="inline-block bg-[#b38f62] text-white px-4 py-1 rounded-full text-sm font-medium mb-6">
                1 Month Deployment
              </div>

              <p className="text-gray-700 leading-relaxed mb-8">
                Dashboards transform raw data into real-time performance engines
                , helping leaders monitor KPIs, market coverage, revenue,
                liquidity, and productivity without the burden of data overload.
              </p>

              <div className="space-y-4">
                {[
                  "Real-time visibility & transparency",
                  "Time savings through automated reporting",
                  "Data-backed decision making",
                  "Team alignment with business strategy",
                  "Accountability and motivation through performance tracking",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS SECTION */}
      <section className="px-6 lg:px-16 py-16  mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4">
            Our Training Programs
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Comprehensive development programs designed to elevate your team's
            performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {programs.map((program, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-[#244672] to-[#1a3352] p-6">
                <div className="flex items-center gap-4 text-white">
                  <div>
                    <h3 className="text-2xl font-bold">{program.title}</h3>
                    
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ul className="grid gap-3">
                  {program.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <div className="w-2 h-2 bg-[#b38f62] rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APPROACH SECTION */}
      <section className="px-6 lg:px-16 py-16  mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4">
            Our Approach
          </h2>
          <p className="text-gray-600 text-lg">
            Proven methodology for sustainable results
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            {
              icon: <Target className="w-6 h-6" />,
              text: "Customized curricula per organization",
            },
            {
              icon: <Users className="w-6 h-6" />,
              text: "Interactive workshops with real case studies",
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              text: "Metrics-driven outcomes & KPI tracking",
            },
            {
              icon: <Lightbulb className="w-6 h-6" />,
              text: "Blended delivery ",
            },
            {
              icon: <Award className="w-6 h-6" />,
              text: "Post-training evaluation  ",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
            >
              <div className="w-14 h-14 bg-[#244672] rounded-full flex items-center justify-center text-white mx-auto mb-4">
                {item.icon}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CORE SERVICES */}
      <section className="px-6 lg:px-16 py-16  mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#244672] mb-4">
            Our Core Services
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreServices.map((service, i) => (
            <div
              key={i}
              className="group bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#b38f62] text-center"
            >
              <div className="w-16 h-16 bg-[#244672] rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:bg-[#b38f62] transition-colors">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-[#244672] mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 lg:px-16 py-16  mx-auto">
        <div className="bg-gradient-to-r from-[#244672] via-[#1a3352] to-[#244672] rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Let's discuss how our training programs can help your organization
            achieve sustainable growth and performance excellence.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#b38f62] text-white px-10 py-4 text-lg font-semibold hover:bg-[#a07d54] transition-all duration-300 inline-flex items-center gap-2"
          >
            <span>Schedule a Consultation</span>
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
