"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/landing/Footer";
import AboutHero from "@/components/hero/AboutHero";
import { supabase } from "@/lib/supabase";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  GraduationCap,
  TrendingUp,
  Loader2,
  Eye,
  Plus,
  Save,
  Edit,
  Trash2,
} from "lucide-react";
import { format, parseISO, addMonths, startOfDay } from "date-fns";
import StudentIDCard from "@/components/training/StudentIDCard";
import { IdCard } from "lucide-react";

interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
  cohort_number: number;
  start_date: string | null;
  end_date: string | null;
}

interface Enrollment {
  id: string;
  enrollment_status: string;
  student_id: string | null;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
  created_at: string;
  training_programs: TrainingProgram;
  users: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  arrival_time: string | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

interface Note {
  id: string;
  enrollment_id: string;
  note_text: string;
  note_date: string | null;
  note_type: string;
  created_by: string | null;
  created_at: string;
}

export default function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // Attendance form state
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "late" | "excused">("present");
  const [arrivalTime, setArrivalTime] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState<string>("");
  const [noteType, setNoteType] = useState<string>("general");
  const [savingNote, setSavingNote] = useState(false);

  // ID Card state
  const [showIDCard, setShowIDCard] = useState(false);

  // Attendance summary
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    excused_days: 0,
    attendance_percentage: 0,
  });

  useEffect(() => {
    checkAuthAndFetchData();
  }, [id]);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push("/login?redirect=/account/training/" + id);
        return;
      }
      setUser(authUser);
      await fetchEnrollmentDetails(authUser);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to load enrollment details");
      setLoading(false);
    }
  };

  const fetchEnrollmentDetails = async (authUser?: any) => {
    try {
      setLoading(true);
      setError("");

      // Use the passed user or the state user
      const currentUser = authUser || user;
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }

      // Fetch enrollment - verify it belongs to the current user
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("training_enrollments")
        .select(`
          *,
          training_programs(*),
          users(id, full_name, email, phone, avatar_url)
        `)
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .single();

      if (enrollmentError) throw enrollmentError;
      if (!enrollmentData) {
        throw new Error("Enrollment not found or you don't have access to this enrollment");
      }

      setEnrollment(enrollmentData);

      // Fetch attendance records (read-only for students)
      await fetchAttendance();

      // Fetch notes (read-only for students)
      await fetchNotes();

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching enrollment:", err);
      setError(err.message || "Failed to load enrollment details");
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("training_attendance")
        .select("*")
        .eq("enrollment_id", id)
        .order("attendance_date", { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);

      // Calculate summary
      const summary = {
        total_days: data?.length || 0,
        present_days: data?.filter((a) => a.status === "present").length || 0,
        absent_days: data?.filter((a) => a.status === "absent").length || 0,
        late_days: data?.filter((a) => a.status === "late").length || 0,
        excused_days: data?.filter((a) => a.status === "excused").length || 0,
        attendance_percentage: 0,
      };

      if (summary.total_days > 0) {
        summary.attendance_percentage = Math.round(
          ((summary.present_days + summary.late_days) / summary.total_days) * 100
        );
      }

      setAttendanceSummary(summary);
    } catch (err: any) {
      console.error("Error fetching attendance:", err);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("training_enrollment_notes")
        .select("*")
        .eq("enrollment_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      console.error("Error fetching notes:", err);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const existingRecord = attendanceRecords.find(
      (record) => record.attendance_date === dateStr
    );

    if (existingRecord) {
      setAttendanceStatus(existingRecord.status);
      setArrivalTime(existingRecord.arrival_time || "");
      setAttendanceNotes(existingRecord.notes || "");
    } else {
      setAttendanceStatus("present");
      setArrivalTime("");
      setAttendanceNotes("");
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedDate || !user) {
      alert("Please select a date and ensure you're logged in");
      return;
    }

    // Only allow saving for today's date
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(selectedDate);
    
    if (selectedDay < today) {
      alert("You cannot mark attendance for past dates. Please select today's date.");
      return;
    }
    
    if (selectedDay > today) {
      alert("You cannot mark attendance for future dates. Please select today's date.");
      return;
    }

    setMarkingAttendance(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const existingRecord = attendanceRecords.find(
        (record) => record.attendance_date === dateStr
      );

      const attendanceData: any = {
        enrollment_id: id,
        attendance_date: dateStr,
        status: attendanceStatus,
        notes: attendanceNotes || null,
        marked_by: user.id,
      };

      if (attendanceStatus === "late" && arrivalTime) {
        attendanceData.arrival_time = arrivalTime;
      }

      if (existingRecord) {
        // Update existing record (only if it's self-marked)
        if (existingRecord.marked_by === user.id) {
          const { error } = await supabase
            .from("training_attendance")
            .update(attendanceData)
            .eq("id", existingRecord.id);

          if (error) throw error;
        } else {
          alert("You can only update your own attendance records. This record was marked by an instructor.");
          return;
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from("training_attendance")
          .insert(attendanceData);

        if (error) throw error;
      }

      await fetchAttendance();
      setSelectedDate(null);
      setAttendanceNotes("");
      setArrivalTime("");
      alert("Attendance marked successfully!");
    } catch (err: any) {
      console.error("Error marking attendance:", err);
      alert(err.message || "Failed to mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !user) {
      alert("Please enter a note and ensure you're logged in");
      return;
    }

    setSavingNote(true);
    try {
      const noteData: any = {
        enrollment_id: id,
        note_text: noteText.trim(),
        note_type: noteType,
        created_by: user.id,
      };

      if (noteDate) {
        noteData.note_date = noteDate;
      }

      if (editingNote) {
        // Update existing note (only if it's self-created)
        if (editingNote.created_by === user.id) {
          const { error } = await supabase
            .from("training_enrollment_notes")
            .update(noteData)
            .eq("id", editingNote.id);

          if (error) throw error;
        } else {
          alert("You can only update your own notes.");
          return;
        }
      } else {
        // Create new note
        const { error } = await supabase
          .from("training_enrollment_notes")
          .insert(noteData);

        if (error) throw error;
      }

      await fetchNotes();
      setNoteText("");
      setNoteDate("");
      setNoteType("general");
      setEditingNote(null);
      setShowNoteForm(false);
      alert("Note saved successfully!");
    } catch (err: any) {
      console.error("Error saving note:", err);
      alert(err.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string, createdBy: string | null) => {
    if (!user) return;
    
    // Only allow deleting own notes
    if (createdBy !== user.id) {
      alert("You can only delete your own notes.");
      return;
    }

    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase
        .from("training_enrollment_notes")
        .delete()
        .eq("id", noteId)
        .eq("created_by", user.id); // Double check it's their note

      if (error) throw error;
      await fetchNotes();
      alert("Note deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting note:", err);
      alert(err.message || "Failed to delete note");
    }
  };

  const handleEditNote = (note: Note) => {
    if (note.created_by !== user?.id) {
      alert("You can only edit your own notes.");
      return;
    }
    setEditingNote(note);
    setNoteText(note.note_text);
    setNoteDate(note.note_date || "");
    setNoteType(note.note_type);
    setShowNoteForm(true);
  };

  const getAttendanceStatusColor = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = attendanceRecords.find((r) => r.attendance_date === dateStr);
    if (!record) return "";

    switch (record.status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-300";
      case "absent":
        return "bg-red-100 text-red-800 border-red-300";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "excused":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "";
    }
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="w-4 h-4" />;
      case "absent":
        return <XCircle className="w-4 h-4" />;
      case "late":
        return <Clock className="w-4 h-4" />;
      case "excused":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <AboutHero title="Enrollment Details" highlight="View" background="/planding3.jpeg" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || "Enrollment not found"}</p>
            <Link
              href="/account/training"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              ← Back to Training
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const program = enrollment.training_programs;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AboutHero title="Enrollment Details" highlight="View" background="/planding3.jpeg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/account/training"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Training
          </Link>
        </div>

        {/* Enrollment Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{program.name}</h2>
                {enrollment.student_id && (
                  <p className="text-sm text-gray-600">Student ID: {enrollment.student_id}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(program.start_date)} - {formatDate(program.end_date)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(enrollment.enrollment_status === "deposit_paid" || enrollment.enrollment_status === "fully_paid") && (
                <button
                  onClick={() => setShowIDCard(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#244672] text-white rounded-lg hover:bg-[#1a3554] transition-colors"
                >
                  <IdCard className="w-4 h-4" />
                  Download ID Card
                </button>
              )}
              <div className="text-right">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {enrollment.enrollment_status.replace("_", " ").toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceSummary.attendance_percentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{attendanceSummary.present_days}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent_days}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.late_days}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Attendance Calendar</h2>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleDateClick(date);
                    }
                  }}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className="border border-gray-200 rounded-lg p-4"
                  disabled={(date) => {
                    // Only allow today's date, disable past and future dates
                    const today = startOfDay(new Date());
                    const checkDate = startOfDay(date);
                    return checkDate.getTime() !== today.getTime();
                  }}
                  modifiers={{
                    hasAttendance: (date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      return attendanceRecords.some((r) => r.attendance_date === dateStr);
                    },
                  }}
                  modifiersClassNames={{
                    hasAttendance: "bg-blue-100",
                    selected: "bg-blue-600 text-white",
                  }}
                />
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-600">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm text-gray-600">Excused</span>
                </div>
              </div>
            </div>

            {/* Attendance Form */}
            <div className="lg:col-span-1">
              {selectedDate ? (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Mark Attendance - {format(selectedDate, "MMM dd, yyyy")}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={attendanceStatus}
                          onChange={(e) =>
                            setAttendanceStatus(e.target.value as "present" | "absent" | "late" | "excused")
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </div>

                      {attendanceStatus === "late" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                          <input
                            type="time"
                            value={arrivalTime}
                            onChange={(e) => setArrivalTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                          value={attendanceNotes}
                          onChange={(e) => setAttendanceNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add notes for this attendance record..."
                        />
                      </div>

                      <button
                        onClick={handleMarkAttendance}
                        disabled={markingAttendance}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {markingAttendance ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Confirm Attendance
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Select a date to mark your attendance</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Records</h2>
          <div className="space-y-2">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No attendance records yet.</p>
                <p className="text-sm mt-2">Click on a date in the calendar above to mark your attendance</p>
              </div>
            ) : (
              attendanceRecords.map((record) => {
                const isSelfMarked = record.marked_by === user?.id;
                return (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      record.status === "present"
                        ? "bg-green-50 border-green-200"
                        : record.status === "absent"
                        ? "bg-red-50 border-red-200"
                        : record.status === "late"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getAttendanceStatusIcon(record.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{formatDate(record.attendance_date)}</p>
                          {isSelfMarked && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Self-reported
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 capitalize">{record.status}</p>
                        {record.arrival_time && (
                          <p className="text-sm text-gray-600">Arrived at {record.arrival_time}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {record.notes && (
                        <p className="text-sm text-gray-600 max-w-md">{record.notes}</p>
                      )}
                      {isSelfMarked && (
                        <button
                          onClick={() => {
                            const date = parseISO(record.attendance_date);
                            handleDateClick(date);
                            // Scroll to calendar
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Notes</h2>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteText("");
                setNoteDate("");
                setNoteType("general");
                setShowNoteForm(!showNoteForm);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showNoteForm ? "Cancel" : "Add Note"}
            </button>
          </div>

          {/* Note Form */}
          {showNoteForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                {editingNote ? "Edit Note" : "New Note"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note Text</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your note here... (e.g., reminders, thoughts, questions)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date (Optional)</label>
                    <input
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="attendance">Attendance</option>
                      <option value="performance">Performance</option>
                      <option value="assignment">Assignment</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !noteText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Note
                      </>
                    )}
                  </button>
                  {editingNote && (
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText("");
                        setNoteDate("");
                        setNoteType("general");
                        setShowNoteForm(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No notes yet.</p>
                <p className="text-sm mt-2">Add notes to help you remember important information</p>
              </div>
            ) : (
              notes.map((note) => {
                const isOwnNote = note.created_by === user?.id;
                return (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {note.note_type}
                          </span>
                          {note.note_date && (
                            <span className="text-sm text-gray-600">
                              {formatDate(note.note_date)}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                          </span>
                          {!isOwnNote && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                              From Instructor
                            </span>
                          )}
                          {isOwnNote && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Your Note
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{note.note_text}</p>
                      </div>
                      {isOwnNote && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id, note.created_by)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Student ID Card Modal */}
      {showIDCard && (enrollment.enrollment_status === "deposit_paid" || enrollment.enrollment_status === "fully_paid") && enrollment.users && (
        <StudentIDCard
          studentName={enrollment.users.full_name || enrollment.users.email || "Unknown Student"}
          studentId={enrollment.student_id || "TBD"}
          course={program.name || "Training Program"}
          cohort={`Cohort ${program.cohort_number} ${new Date(program.start_date || Date.now()).getFullYear()}`}
          validTill={enrollment.deposit_paid_at 
            ? format(addMonths(parseISO(enrollment.deposit_paid_at), 1), "MMM yyyy")
            : format(addMonths(new Date(), 1), "MMM yyyy")}
          onClose={() => setShowIDCard(false)}
        />
      )}
    </div>
  );
}

