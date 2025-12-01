// app/apply/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import BlogHero from "@/components/hero/BlogHero";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  department: string;
}

export default function ApplyJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    id_number: "",
    gender: "",
    date_of_birth: "",
    location: "",
    availability: "immediately" as
      | "immediately"
      | "after_2_weeks"
      | "after_4_weeks",
    has_smartphone: false,
    has_laptop: false,
    extra_skills: "",
    years_of_experience: "",
  });

  const [documents, setDocuments] = useState<{
    cv: File | null;
    good_conduct: File | null;
    form_4: File | null;
    id_photo: File | null;
    other: File[];
  }>({
    cv: null,
    good_conduct: null,
    form_4: null,
    id_photo: null,
    other: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department")
        .eq("id", jobId)
        .single();
      if (data) setJob(data);
    }
    fetchJob();
  }, [jobId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (docType === "other") {
      setDocuments({ ...documents, other: Array.from(files) });
    } else {
      setDocuments({ ...documents, [docType]: files[0] });
    }
  };

  const uploadDocument = async (
    file: File,
    applicantId: string,
    docType: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${applicantId}/${docType}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("applicant_documents")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("applicant_documents")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required documents
      if (!documents.cv) {
        throw new Error("CV is required");
      }

      // 1. Insert applicant
      const { data: applicant, error: applicantError } = await supabase
        .from("applicants")
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone,
          id_number: formData.id_number || null,
          gender: formData.gender || null,
          date_of_birth: formData.date_of_birth || null,
          location: formData.location || null,
          availability: formData.availability,
          has_smartphone: formData.has_smartphone,
          has_laptop: formData.has_laptop,
          extra_skills: formData.extra_skills || null,
          years_of_experience: formData.years_of_experience
            ? parseInt(formData.years_of_experience)
            : null,
        })
        .select()
        .single();

      if (applicantError || !applicant) {
        throw new Error(
          applicantError?.message || "Failed to create applicant"
        );
      }

      const applicantId = applicant.id;

      // 2. Insert job_application
      const { error: jobAppError } = await supabase
        .from("job_applications")
        .insert({
          applicant_id: applicantId,
          job_id: jobId,
          status: "applied",
        });

      if (jobAppError) {
        throw new Error(jobAppError.message);
      }

      // 3. Upload documents
      const documentUploads = [];

      // Upload CV (required)
      if (documents.cv) {
        const cvUrl = await uploadDocument(documents.cv, applicantId, "cv");
        if (cvUrl) {
          documentUploads.push({
            applicant_id: applicantId,
            document_type: "cv",
            file_url: cvUrl,
          });
        }
      }

      // Upload optional documents
      if (documents.good_conduct) {
        const url = await uploadDocument(
          documents.good_conduct,
          applicantId,
          "good_conduct"
        );
        if (url) {
          documentUploads.push({
            applicant_id: applicantId,
            document_type: "good_conduct",
            file_url: url,
          });
        }
      }

      if (documents.form_4) {
        const url = await uploadDocument(
          documents.form_4,
          applicantId,
          "form_4_certificate"
        );
        if (url) {
          documentUploads.push({
            applicant_id: applicantId,
            document_type: "form_4_certificate",
            file_url: url,
          });
        }
      }

      if (documents.id_photo) {
        const url = await uploadDocument(
          documents.id_photo,
          applicantId,
          "id_photo"
        );
        if (url) {
          documentUploads.push({
            applicant_id: applicantId,
            document_type: "id_photo",
            file_url: url,
          });
        }
      }

      // Upload other documents
      for (const file of documents.other) {
        const url = await uploadDocument(file, applicantId, "other");
        if (url) {
          documentUploads.push({
            applicant_id: applicantId,
            document_type: "other",
            file_url: url,
          });
        }
      }

      // Save all document records
      if (documentUploads.length > 0) {
        const { error: docError } = await supabase
          .from("applicant_documents")
          .insert(documentUploads);

        if (docError) {
          console.error("Document save error:", docError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/jobs");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to submit application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-50/30">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-32 text-center">
          <div className="bg-white p-12  shadow-2xl border border-blue-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-800 to-blue-800 rounded-full flex items-center justify-center">
              <CheckCircle2
                className="w-10 h-10 text-white"
                strokeWidth={2.5}
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-2">
              Thank you for applying. We'll review your application and get back
              to you soon.
            </p>
            <p className="text-sm text-gray-500">Redirecting to jobs page...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-50/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-pink-400/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <Navbar />
        <BlogHero
          title="Apply for"
          highlight={job?.title || "Job"}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: "Apply", href: "#" },
          ]}
        />

        <section className="max-w-7xl mx-auto px-6 py-16">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200  flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Application Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-10 lg:col-span-2   border border-gray-300 space-y-8"
            >
              {/* Personal Information */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-6 h-6 text-blue-800" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254..."
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Number
                    </label>
                    <input
                      name="id_number"
                      value={formData.id_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, County"
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Briefcase className="w-6 h-6 text-blue-800" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Work Information
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Availability <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all bg-white"
                      required
                    >
                      <option value="immediately">Immediately</option>
                      <option value="after_2_weeks">After 2 Weeks</option>
                      <option value="after_4_weeks">After 4 Weeks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      name="years_of_experience"
                      type="number"
                      min="0"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Skills
                    </label>
                    <textarea
                      name="extra_skills"
                      value={formData.extra_skills}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about your skills, certifications, or relevant experience..."
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Device Access
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-3 px-4 py-3 bg-gray-50  border-2 border-gray-200 hover:border-blue-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="has_smartphone"
                          checked={formData.has_smartphone}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-800 border-gray-300 rounded focus:ring-blue-800"
                        />
                        <span className="font-medium text-gray-700">
                          I have a Smartphone
                        </span>
                      </label>
                      <label className="flex items-center gap-3 px-4 py-3 bg-gray-50  border-2 border-gray-200 hover:border-blue-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="has_laptop"
                          checked={formData.has_laptop}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-800 border-gray-300 rounded focus:ring-blue-800"
                        />
                        <span className="font-medium text-gray-700">
                          I have a Laptop
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Documents
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 ">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Required:</span> CV/Resume
                      |<span className="font-semibold ml-2">Optional:</span>{" "}
                      Good Conduct Certificate, Form 4 Certificate, ID Photo
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CV/Resume <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, "cv")}
                        className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Good Conduct Certificate
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "good_conduct")}
                        className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Form 4 Certificate
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "form_4")}
                        className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ID Photo
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "id_photo")}
                        className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Other Documents (Optional)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(e, "other")}
                      className="w-full px-4 py-3 border-2 border-gray-200  focus:ring-2 focus:ring-blue-800 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-800 via-blue-800 to-blue-800 text-white font-bold  hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Apply Card */}
                <div className="bg-gradient-to-br from-blue-800 via-blue-900 to-blue-900 p-8  shadow-2xl text-white">
                  <h3 className="text-2xl font-bold mb-3">View other jobs</h3>
                  <p className="text-blue-50 mb-6">
                    Join our team and make an impact in your career.
                  </p>
                  <Link
                    href=""
                    className="block w-full px-8 py-4 bg-white text-blue-800 font-bold  hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-center"
                  >
                   View Jobs
                  </Link>
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
