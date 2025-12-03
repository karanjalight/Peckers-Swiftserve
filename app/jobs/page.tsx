// app/jobs/page.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import BlogHero from "@/components/hero/BlogHero";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  Clock,
  Briefcase,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  status: string;
}

async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return data as Job[];
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-900/10 to-blue-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-blue-400/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <Navbar />
        <BlogHero
          title="We are"
          highlight="hiring"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Jobs", href: "#" },
          ]}
        />

        <section className="max-w-7xl mx-auto px-6 py-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-100 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-blue-800" />
              <span className="text-sm font-semibold text-gray-700">
                {jobs.length} Open Positions
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Dream Role
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our team and make an impact. We're looking for talented
              individuals to help us grow.
            </p>
          </div>

          {/* Job List */}
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <div
                key={job.id}
                className="group relative flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 border border-gray-300 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Gradient accent bar */}
                <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-blue-900 via-blue-900 to-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/0 via-blue-900/5 to-blue-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Job Info */}
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex items-start gap-4">
                    {/* Company Icon */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                        <Briefcase
                          className="w-7 h-7 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-900 rounded-full animate-pulse" />
                    </div>

                    {/* Title & Department */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors mb-1">
                        {job.title}
                      </h2>
                      <p className="text-gray-600 font-semibold text-lg">
                        {job.department}
                      </p>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                      <MapPin className="w-4 h-4 text-blue-800" strokeWidth={2.5} />
                      <span className="font-semibold text-gray-700 text-sm">
                        {job.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                      <Briefcase className="w-4 h-4 text-blue-800" strokeWidth={2.5} />
                      <span className="font-semibold text-gray-700 text-sm capitalize">
                        {job.employment_type.replace("_", " ")}
                      </span>
                    </div>

                    {job.application_deadline && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                        <Clock className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                        <span className="font-semibold text-gray-700 text-sm">
                          Apply by {new Date(job.application_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-6 md:mt-0 md:ml-8 w-full md:w-auto relative z-10">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="group/btn relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white font-bold hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 w-full md:w-auto overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative">View Details</span>
                    <ArrowRight
                      className="w-5 h-5 relative group-hover/btn:translate-x-1 transition-transform"
                      strokeWidth={2.5}
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {jobs.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Briefcase className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Jobs Available
              </h3>
              <p className="text-gray-600">
                Check back soon for new opportunities!
              </p>
            </div>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}
