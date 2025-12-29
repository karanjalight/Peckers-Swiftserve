"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Baby,
  Calendar as CalendarIcon,
  FileText,
  CheckCircle,
} from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NannyForm() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    location: "",
    id_number: "",
    children: "",
    service_needed: "",
    notes: "",
    first_aid: false,
    driving: false,
    cooking: false,
    cleaning: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm({ ...form, [target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select a date range.");
      return;
    }

    const { data, error } = await supabase
      .from("nanny_requests")
      .insert({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        location: form.location,
        id_number: form.id_number,
        household_description: form.children,
        service_needed: form.service_needed,
        start_date: dateRange.from.toISOString().split("T")[0],
        end_date: dateRange.to.toISOString().split("T")[0],
        notes: form.notes,
        first_aid: form.first_aid,
        driving: form.driving,
        cooking: form.cooking,
        cleaning: form.cleaning,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Failed to submit. Check console for details.");
    } else {
      setSubmitted(true);
      setForm({
        full_name: "",
        phone: "",
        email: "",
        location: "",
        id_number: "",
        children: "",
        service_needed: "",
        notes: "",
        first_aid: false,
        driving: false,
        cooking: false,
        cleaning: false,
      });
      setDateRange(undefined);
      router.push(`/services/success/${data.id}`);

    }
  };

  if (submitted) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Request Received!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your nanny request. We've received your
            information and are processing your request. Our team will be in
            touch shortly.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-[#b38f62] text-white py-3 px-8 font-semibold hover:bg-[#a07d50] transition rounded-lg"
          >
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Full Name *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <User className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone Number *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Phone className="text-[#244672] w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="0700 000 000"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email (Optional)
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Mail className="text-[#244672] w-5 h-5" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="example@gmail.com"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Your Location *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <MapPin className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="Nairobi – Westlands, Karen..."
                required
              />
            </div>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              ID Number *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <User className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                name="id_number"
                value={form.id_number}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="Enter your ID Number"
                required
              />
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Number of people in the House
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <Baby className="text-[#244672] w-5 h-5" />
              <input
                type="text"
                name="children"
                value={form.children}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                placeholder="e.g. 1 child (2 years), 2 adults "
                required
              />
            </div>
          </div>

          {/* Service Needed */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Needed *
            </label>
            <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
              <ClipboardList className="text-[#244672] w-5 h-5" />
              <select
                name="service_needed"
                value={form.service_needed}
                onChange={handleChange}
                className="w-full bg-transparent focus:outline-none"
                required
              >
                <option value="">Select service</option>
                <option value="emergency_under_6_hours">
                  Emergency Nanny (Under 6 Hours)
                </option>
                <option value="sunday_day_bug">Sunday / Day-Bug Nanny</option>
                <option value="short_term_daily">
                  Short-Term / Daily Nanny
                </option>
                <option value="short_term_daily">Monthly / Own Managed </option>
                <option value="short_term_daily">
                  Monthly / Company Managed{" "}
                </option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Duration <span className="text-gray-500">(click outside the calendar to proceed )</span>*
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full border rounded-lg p-3 gap-3 bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="text-[#244672] w-5 h-5" />
                    <span className="text-gray-600">
                      {dateRange?.from && dateRange?.to
                        ? `${format(dateRange.from, "PPP")} → ${format(
                            dateRange.to,
                            "PPP"
                          )}`
                        : "Select date range"}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white shadow-lg rounded-xl">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Extra Skills */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-3">
            Extra Skills (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="first_aid"
                id="first_aid"
                checked={form.first_aid}
                onChange={handleChange}
                className="w-5 h-5 text-[#244672] border-gray-300 rounded focus:ring-[#244672] cursor-pointer"
              />
              <label htmlFor="first_aid" className="text-gray-700 font-medium cursor-pointer">
                First Aid
              </label>
            </div>
            <div className="flex items-center space-x-3 border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="driving"
                id="driving"
                checked={form.driving}
                onChange={handleChange}
                className="w-5 h-5 text-[#244672] border-gray-300 rounded focus:ring-[#244672] cursor-pointer"
              />
              <label htmlFor="driving" className="text-gray-700 font-medium cursor-pointer">
                Driving
              </label>
            </div>
            <div className="flex items-center space-x-3 border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="cooking"
                id="cooking"
                checked={form.cooking}
                onChange={handleChange}
                className="w-5 h-5 text-[#244672] border-gray-300 rounded focus:ring-[#244672] cursor-pointer"
              />
              <label htmlFor="cooking" className="text-gray-700 font-medium cursor-pointer">
                ECD Trained
              </label>
            </div>
            <div className="flex hidden items-center space-x-3 border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="checkbox"
                name="cleaning"
                id="cleaning"
                checked={form.cleaning}
                onChange={handleChange}
                className="w-5 h-5 text-[#244672] border-gray-300 rounded focus:ring-[#244672] cursor-pointer"
              />
              <label htmlFor="cleaning" className="text-gray-700 font-medium cursor-pointer">
                Cleaning
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">
            Share your Preference (NB: We might not meet all of them )
          </label>
          <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
            <FileText className="text-[#244672] w-5 h-5 mt-1" />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full bg-transparent h-32 focus:outline-none"
              placeholder="Share details about your staff preference and any special needs in your home."
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#b38f62] transition"
        >
          Submit
        </button>
      </form>
    </section>
  );
}
