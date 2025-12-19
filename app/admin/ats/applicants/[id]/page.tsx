"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SidebarLayout from "@/components/layouts/SidebarLayout";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Smartphone,
  Laptop,
  Award,
  Building2,
  Save,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
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
  shortlisted: boolean;
  verified: boolean;
  created_at: string;
}

interface Job {
  id: string;
  job_code: string;
  title: string;
  department: string | null;
  description: string | null;
  location: string | null;
  employment_type: string;
  status: string;
}

interface Document {
  id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency: string | null;
  years: number | null;
}

interface Application {
  id: string;
  applicant_id: string;
  job_id: string;
  status: string;
  notes: string | null;
  applied_at: string;
  updated_at: string;
}

export default function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    } else {
      setError("Invalid application ID");
      setLoading(false);
    }
  }, [id]);

  const fetchApplicationDetails = async () => {
    if (!id) {
      setError("Application ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", id)
        .single();

      if (appError) throw appError;
      setApplication(appData);
      setSelectedStatus(appData.status);
      setNotes(appData.notes || "");

      // Fetch applicant
      const { data: applicantData, error: applicantError } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", appData.applicant_id)
        .single();

      if (applicantError) throw applicantError;
      setApplicant(applicantData);

      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", appData.job_id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from("applicant_documents")
        .select("*")
        .eq("applicant_id", appData.applicant_id)
        .order("uploaded_at", { ascending: false });

      if (!docsError) setDocuments(docsData || []);

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("applicant_skills")
        .select("*")
        .eq("applicant_id", appData.applicant_id)
        .order("skill_name");

      if (!skillsError) setSkills(skillsData || []);
    } catch (err: any) {
      console.error("Error fetching application details:", err);
      setError(err.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!application) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({
          status: selectedStatus,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("Changes saved successfully!");
      fetchApplicationDetails();
    } catch (err: any) {
      console.error("Error saving changes:", err);
      alert(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const deleteApplication = async () => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("Application deleted successfully");
      router.push("/admin/applications");
    } catch (err: any) {
      console.error("Error deleting application:", err);
      alert(err.message || "Failed to delete application");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500";
      case "shortlisted":
        return "bg-blue-500";
      case "interview_scheduled":
        return "bg-blue-500";
      case "interviewed":
        return "bg-yellow-500";
      case "hired":
        return "bg-blue-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case "immediately":
        return "Immediately";
      case "after_2_weeks":
        return "After 2 Weeks";
      case "after_4_weeks":
        return "After 4 Weeks";
      default:
        return availability;
    }
  };

  const statuses = [
    "applied",
    "shortlisted",
    "interview_scheduled",
    "interviewed",
    "hired",
    "rejected",
  ];

  if (loading) {
    return (
      <SidebarLayout title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading application details...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !application || !applicant || !job) {
    return (
      <SidebarLayout title="Error">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Error Loading Application
            </h2>
            <p className="text-slate-600 mb-6">{error || "Application not found"}</p>
            <Link
              href="/admin/ats/applicants"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Applications
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={`${applicant.first_name} ${applicant.last_name}`}>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className=" mx-auto mb-6">
          <Link
            href="/admin/ats/applicants"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>

          <div className="bg-white rounded-2xl  border border-slate-200 overflow-hidden">
            {/* Status Bar */}
            <div className={`h-2 ${getStatusColor(application.status)}`}></div>

            <div className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-slate-900">
                      {applicant.first_name} {applicant.last_name}
                    </h1>
                    {applicant.verified && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    )}
                    {applicant.shortlisted && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        Shortlisted
                      </span>
                    )}
                  </div>
                  <p className="text-xl text-slate-600">
                    Applied for <span className="font-semibold text-slate-900">{job.title}</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover: disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={deleteApplication}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <Calendar className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 font-medium mb-1">Applied</p>
                  <p className="text-sm font-bold text-blue-900">
                    {formatDate(application.applied_at)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <Briefcase className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 font-medium mb-1">Experience</p>
                  <p className="text-sm font-bold text-blue-900">
                    {applicant.years_of_experience || 0} Years
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <Clock className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 font-medium mb-1">Availability</p>
                  <p className="text-sm font-bold text-blue-900">
                    {getAvailabilityText(applicant.availability)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <Award className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-xs text-blue-600 font-medium mb-1">Skills</p>
                  <p className="text-sm font-bold text-blue-900">
                    {skills.length} Listed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className=" mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                Application Status
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Current Status
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                          selectedStatus === status
                            ? "bg-blue-600 text-white border-blue-600  scale-105"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600">
                    <strong>Last Updated:</strong> {formatDateTime(application.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Internal Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this application..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                Job Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Position</p>
                  <p className="text-lg font-semibold text-slate-900">{job.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Job Code</p>
                    <p className="font-medium text-slate-900">{job.job_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Department</p>
                    <p className="font-medium text-slate-900">{job.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Employment Type</p>
                    <p className="font-medium text-slate-900">
                      {job.employment_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Location</p>
                    <p className="font-medium text-slate-900">{job.location || "N/A"}</p>
                  </div>
                </div>
                {job.description && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Description</p>
                    <p className="text-slate-700 leading-relaxed">{job.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white rounded-2xl  border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  Skills & Expertise
                </h2>
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{skill.skill_name}</p>
                        {skill.proficiency && (
                          <p className="text-sm text-slate-600 mt-1">
                            Proficiency: {skill.proficiency.charAt(0).toUpperCase() + skill.proficiency.slice(1)}
                          </p>
                        )}
                      </div>
                      {skill.years !== null && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {skill.years} {skill.years === 1 ? "year" : "years"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div className="bg-white rounded-2xl  border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Documents
                </h2>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {doc.document_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-slate-500">
                            Uploaded {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Applicant Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact</h2>
              <div className="space-y-4">
                {applicant.email && (
                  <a
                    href={`mailto:${applicant.email}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-900 break-all">{applicant.email}</span>
                  </a>
                )}
                <a
                  href={`tel:${applicant.phone}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-slate-900">{applicant.phone}</span>
                </a>
                {applicant.location && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-900">{applicant.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Personal Info</h2>
              <div className="space-y-3">
                {applicant.id_number && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">ID Number</p>
                    <p className="font-medium text-slate-900">{applicant.id_number}</p>
                  </div>
                )}
                {applicant.gender && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Gender</p>
                    <p className="font-medium text-slate-900">
                      {applicant.gender.charAt(0).toUpperCase() + applicant.gender.slice(1)}
                    </p>
                  </div>
                )}
                {applicant.date_of_birth && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Date of Birth</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(applicant.date_of_birth)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Device Access */}
            <div className="bg-white rounded-2xl  border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Device Access</h2>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${applicant.has_smartphone ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                  <Smartphone className={`w-5 h-5 ${applicant.has_smartphone ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-900">Smartphone</span>
                  {applicant.has_smartphone ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 ml-auto" />
                  )}
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${applicant.has_laptop ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                  <Laptop className={`w-5 h-5 ${applicant.has_laptop ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-900">Laptop</span>
                  {applicant.has_laptop ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 ml-auto" />
                  )}
                </div>
              </div>
            </div>

            {/* Extra Skills */}
            {applicant.extra_skills && (
              <div className="bg-white rounded-2xl  border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Skills</h2>
                <p className="text-slate-700 leading-relaxed">{applicant.extra_skills}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}