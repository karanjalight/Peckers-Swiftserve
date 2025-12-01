// app/jobs/[id]/page.tsx
import Navbar from '@/components/Navbar';
import BlogHero from '@/components/hero/BlogHero';
import Footer from '@/components/landing/Footer';
import { supabase } from '@/lib/supabase';
import { MapPin, Clock, DollarSign, Briefcase, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  description?: string;
  requirements?: string;
}

async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Job;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing properties
  const resolvedParams = await params;
  const job = await getJob(resolvedParams.id);

  if (!job) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-50/30">
        <Navbar />
        <div className=" px-6 py-32 text-center">
          <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl border border-blue-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Job Not Found</h2>
            <p className="text-gray-600 mb-8">This position may have been filled or is no longer available.</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Jobs
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Parse requirements if they're in a list format
  const requirementsList = job.requirements 
    ? job.requirements.split('\n').filter(req => req.trim())
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <Navbar />
        <BlogHero
          title={job.title}
          highlight=""
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: job.title, href: "#" },
          ]}
        />

        <section className=" max-w-7xl mx-auto px-6 py-16">
          {/* Back Button */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to All Jobs
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Header Card */}
              <div className="bg-white p-8  border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-900 flex items-center justify-center shadow-xl">
                    <Briefcase className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <p className="text-xl text-gray-600 font-semibold">{job.department}</p>
                  </div>
                </div>

                {/* Job Meta Info */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-200/50">
                    <MapPin className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700 text-sm">{job.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                    <Briefcase className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                    <span className="font-semibold text-gray-700 text-sm capitalize">
                      {job.employment_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {job.salary_min && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl border border-blue-200/50">
                      <DollarSign className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                      <span className="font-semibold text-gray-700 text-sm">
                        Ksh {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString() || '—'}
                      </span>
                    </div>
                  )}
                  
                  {job.application_deadline && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl border border-blue-200/50">
                      <Clock className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                      <span className="font-semibold text-gray-700 text-sm">
                        Apply by {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {job.description && (
                <div className="bg-white p-8  border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">About This Role</h2>
                  </div>
                  <div className="pblue pblue-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div className="bg-white p-8  border border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Requirements</h2>
                  </div>
                  
                  {requirementsList.length > 0 ? (
                    <ul className="space-y-3">
                      {requirementsList.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.requirements}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Apply Card */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-900 to-blue-900 p-8 rounded-3xl shadow-2xl text-white">
                  <h3 className="text-2xl font-bold mb-3">Ready to Apply?</h3>
                  <p className="text-blue-50 mb-6">Join our team and make an impact in your career.</p>
                  <Link
                    href={`/jobs/apply/${job.id}`}
                    className="block w-full px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-center"
                  >
                    Apply Now
                  </Link>
                </div>

                 

                {/* Share Card */}
                <div className="bg-white/80 backdrop-blur-sm p-6  border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Share this job</h3>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-colors">
                      LinkedIn
                    </button>
                    <button className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-xl transition-colors">
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}