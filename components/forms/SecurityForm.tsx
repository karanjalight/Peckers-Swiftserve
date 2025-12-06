"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Dog,
  AlertTriangle,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle,
} from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/lib/supabase";

export default function SecurityForm() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    location: "",
    id_number: "",
    dog_option: "",
    reason: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select a date range.");
      return;
    }

    const payload = {
      ...form,
      start_date: dateRange.from.toISOString().split("T")[0],
      end_date: dateRange.to.toISOString().split("T")[0],
    };

    const { data, error } = await supabase.from("security_requests").insert(payload).select().single();

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
        dog_option: "",
        reason: "",
        notes: "",
      });
      setDateRange(undefined);
    }
  };

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================
  if (submitted) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />

          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Request Received!
          </h2>

          <p className="text-gray-600 mb-4">
            Your security team deployment request has been received.
          </p>

          <p className="text-gray-600 font-semibold mb-6">
            Our team will call you within <span className="text-green-600">15 minutes</span> to confirm.
          </p>

          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-[#b38f62] text-white py-3 px-6 font-semibold hover:bg-[#a27d54] transition rounded-lg"
          >
            Submit Another Request
          </button>
        </div>
      </section>
    );
  }

  // =====================================================
  // FORM SCREEN
  // =====================================================
  return (
    <section className="">
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <Field
            label="Full Name *"
            icon={<User className="text-[#244672] w-5 h-5" />}
            name="full_name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          {/* Phone */}
          <Field
            label="Phone Number *"
            icon={<Phone className="text-[#244672] w-5 h-5" />}
            name="phone"
            placeholder="0700 000 000"
            value={form.phone}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <Field
            label="Email (Optional)"
            icon={<Mail className="text-[#244672] w-5 h-5" />}
            name="email"
            placeholder="example@gmail.com"
            value={form.email}
            onChange={handleChange}
          />

          {/* Location */}
          <Field
            label="Property Location *"
            icon={<MapPin className="text-[#244672] w-5 h-5" />}
            name="location"
            placeholder="e.g. Karen, Runda, Kitengela..."
            value={form.location}
            onChange={handleChange}
            required
          />

          {/* ID Number */}
          <Field
            label="ID Number *"
            icon={<User className="text-[#244672] w-5 h-5" />}
            name="id_number"
            placeholder="Enter your ID Number"
            value={form.id_number}
            onChange={handleChange}
            required
          />

          {/* Date Range */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
               Service Duration *
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center  w-full border rounded-lg p-3 gap-3 bg-gray-50 text-right"
                >
                  <CalendarIcon className="text-[#244672] w-5 h-5" />
                  <span className="text-gray-600">
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "PPP")} → ${format(dateRange.to, "PPP")}`
                      : "Select date range"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 bg-white shadow-lg rounded-xl">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Dog Option */}
          <SelectField
            label="Number of Guard Dogs Needed"
            icon={<Dog className="text-[#244672] w-5 h-5" />}
            name="dog_option"
            value={form.dog_option}
            onChange={handleChange}
            options={[
              { value: "", label: "Select option" },
              { value: "one_dog_one_handler", label: "1 Guard Dog + Handler" },
              { value: "two_dogs_two_handlers", label: "2 Guard Dogs + Handlers" },
              { value: "three_plus", label: "3+ (Large compound/estate)" },
            ]}
          />

          {/* Reason */}
          <SelectField
            label="Reason for Temporary Security"
            icon={<AlertTriangle className="text-[#244672] w-5 h-5" />}
            name="reason"
            value={form.reason}
            onChange={handleChange}
            options={[
              { value: "", label: "Select reason" },
              { value: "travel_vacation", label: "Family travel / vacation" },
              { value: "night_shift", label: "Night shift work" },
              { value: "house_help_exit", label: "House help exited" },
              { value: "construction_period", label: "Construction / renovation period" },
              { value: "high_risk_period", label: "High-risk period" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">Additional Notes / Special Instructions</label>
          <div className="flex items-start border rounded-lg p-3 gap-3 bg-gray-50">
            <FileText className="text-[#244672] w-5 h-5 mt-1" />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full bg-transparent h-32 focus:outline-none"
              placeholder="Property size, entry points, alarm details, special requests..."
            ></textarea>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-[#b38f62] text-white py-4 text-lg font-semibold hover:bg-[#a27d54] transition"
        >
          Deploy Security Team Now
        </button>
      </form>
    </section>
  );
}

// ------------------------------------------------------
// SMALL REUSABLE FIELD COMPONENTS
// ------------------------------------------------------

function Field({ label, icon, name, value, onChange, placeholder, required }: any) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
        {icon}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent focus:outline-none"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
}

function SelectField({ label, icon, name, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <div className="flex items-center border rounded-lg p-3 gap-3 bg-gray-50">
        {icon}
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent focus:outline-none"
        >
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}