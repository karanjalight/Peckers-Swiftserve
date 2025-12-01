"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Laptop,
  Smartphone,
  FileText,
  CheckCircle,
} from "lucide-react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  location: string | null;
  availability: string;
  has_smartphone: boolean;
  has_laptop: boolean;
  extra_skills: string | null;
  years_of_experience: number | null;
}

interface Job {
  id: string;
  title: string;
  department: string;
}

interface Document {
  id: string;
  document_type: string;
  file_url: string;
}

export default function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 1. Applicant
      const { data: applicantData } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", id)
        .single();

      setApplicant(applicantData);

      // 2. Job from job_applications
      const { data: jobApplication } = await supabase
        .from("job_applications")
        .select("job:jobs(id,title,department)")
        .eq("applicant_id", id)
        .single();

      if (jobApplication?.job) {
        setJob(jobApplication.job as unknown as Job);
      }

      // 3. Documents
      const { data: docs } = await supabase
        .from("applicant_documents")
        .select("*")
        .eq("applicant_id", id);

      setDocuments(docs || []);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold text-gray-600">
        Loading applicant...
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold text-red-600">
        Applicant not found
      </div>
    );
  }

  return (
    <SidebarLayout title="Job Detail">
      <main className="min-h-screen ">
        <Navbar />

        <section className=" px-6 py-20 space-y-10">
          {/* Header Card */}
          <div className="bg-white p-8 border border-gray-200 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <User className="text-blue-700" />
              {applicant.first_name} {applicant.last_name}
            </h1>

            {job && (
              <p className="mt-2 text-gray-600 flex gap-2 items-center">
                <Briefcase size={18} />
                Applied for: <strong>{job.title}</strong> – {job.department}
              </p>
            )}
          </div>

          {/* Personal Info */}
          <div className="bg-white p-8 border border-gray-200 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <Mail size={16} /> {applicant.email}
              </p>

              <p className="flex items-center gap-2">
                <Phone size={16} /> {applicant.phone}
              </p>

              {applicant.gender && (
                <p className="flex items-center gap-2">
                  <User size={16} /> {applicant.gender}
                </p>
              )}

              {applicant.date_of_birth && (
                <p className="flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(applicant.date_of_birth).toLocaleDateString()}
                </p>
              )}

              {applicant.location && (
                <p className="flex items-center gap-2">
                  <MapPin size={16} />
                  {applicant.location}
                </p>
              )}

              <p className="flex items-center gap-2">
                <CheckCircle size={16} />
                Availability:{" "}
                <span className="font-medium capitalize">
                  {applicant.availability.replaceAll("_", " ")}
                </span>
              </p>

              {applicant.years_of_experience !== null && (
                <p className="flex items-center gap-2">
                  <Briefcase size={16} />
                  {applicant.years_of_experience} years experience
                </p>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              Device Access
            </h2>

            <div className="flex gap-6">
              {applicant.has_smartphone && (
                <span className="flex items-center gap-2 text-green-700 font-medium">
                  <Smartphone size={18} /> Smartphone
                </span>
              )}

              {applicant.has_laptop && (
                <span className="flex items-center gap-2 text-green-700 font-medium">
                  <Laptop size={18} /> Laptop
                </span>
              )}
            </div>
          </div>

          {/* Extra Skills */}
          {applicant.extra_skills && (
            <div className="bg-white p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Additional Skills
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {applicant.extra_skills}
              </p>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Uploaded Documents
            </h2>

            {documents.length === 0 && (
              <p className="text-gray-500">No documents uploaded</p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  className="p-4 border border-gray-200 rounded hover:border-blue-600 transition flex items-center gap-3"
                >
                  <FileText className="text-blue-700" />
                  <span className="capitalize">
                    {doc.document_type.replaceAll("_", " ")}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

      </main>
    </SidebarLayout>
  );
}
